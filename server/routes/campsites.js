const express = require('express');
const router = express.Router();
const Campsite = require('../models/Campsite');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const campsiteValidation = require('../validations/campsite.validation');
const cache = require('../middleware/cache');
const supabase = require('../supabaseClient');

// Helper to push campsite backups to Supabase for RLS
const syncCampsiteToSupabase = async (campsiteDoc) => {
  try {
    if (!supabase) return;
    const doc = campsiteDoc.toObject ? campsiteDoc.toObject() : campsiteDoc;
    const { error } = await supabase.from('campsites').upsert(
      { id: doc._id.toString(), isPublic: doc.isPublic, members: doc.members || [] }, 
      { onConflict: 'id' }
    );
    if (error) console.error('Supabase Campsite Sync Error:', error.message);
  } catch (err) {
    console.error('Supabase Campsite Sync Exception:', err.message);
  }
};

// GET all public campsites (For Discover page)
router.get('/public', async (req, res) => {
  try {
    const campsites = await Campsite.find({ isPublic: true });
    res.json(campsites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all campsites for a specific user (ONLY if they have explicitly joined)
router.get('/user/:username/:email', async (req, res) => {
  try {
    const { username, email } = req.params;
    let campsites;
    if (email.toLowerCase().trim() === 'harshitmehta1012@gmail.com') {
      // Operator "God Mode" View:
      // Return ALL outposts, public and hidden.
      campsites = await Campsite.find({});
    } else {
      // Normal User View:
      // Strictly ONLY pull campsites where the user is listed in the members array.
      campsites = await Campsite.find({
        members: username
      });
    }

    res.json(campsites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a specific campsite by ID
router.get('/:id', async (req, res) => {
  try {
    const campsite = await Campsite.findById(req.params.id);
    if (!campsite) return res.status(404).json({ message: 'Campsite not found' });
    res.json(campsite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new campsite
router.post('/', requireAuth, async (req, res) => {
  try {
    const User = require('../models/User'); // Import here to avoid circular dep if any, or just at top
    const userEmail = req.body.adminEmail || req.user.email;
    const user = await User.findOne({ email: userEmail });
    if (user && user.isGloballyRestricted) {
      return res.status(403).json({ error: 'You are permanently banned from creating new outposts.' });
    }

    let template = req.body.template || 'casual';
    let category = req.body.category || 'Casual';
    let icon = req.body.icon || '🏕️';
    if (template === 'gaming') { category = 'Gaming'; icon = '🎮'; }
    else if (template === 'dev') { category = 'Tech & Dev'; icon = '💻'; }

    let expeditions = req.body.expeditions;
    if (!expeditions || !Array.isArray(expeditions) || expeditions.length === 0) {
      if (template === 'gaming') {
        expeditions = [
          { id: 'lobby', name: 'lobby', type: 'text' },
          { id: 'patch-notes', name: 'patch-notes', type: 'text' },
          { id: 'The Frontlines', name: 'The Frontlines', type: 'voice' },
        ];
      } else if (template === 'dev') {
        expeditions = [
          { id: 'general-dev', name: 'general-dev', type: 'text' },
          { id: 'code-review', name: 'code-review', type: 'text' },
          { id: 'Pair-Programming', name: 'Pair-Programming', type: 'voice' },
        ];
      } else {
        expeditions = [
          { id: 'chit-chat', name: 'chit-chat', type: 'text' },
          { id: 'memes', name: 'memes', type: 'text' },
          { id: 'Around the Fire', name: 'Around the Fire', type: 'voice' },
        ];
      }
    }

    const campPayload = {
      ...req.body,
      id: req.body.id || Date.now().toString(),
      adminEmail: userEmail || 'harshitmehta1012@gmail.com',
      adminUsername: req.body.adminUsername || req.user.username || 'Scout',
      description: req.body.description || `Outpost created by ${req.user?.username || 'Scout'}`,
      category: category,
      icon: icon,
      color: req.body.color || (template === 'gaming' ? '#ff3b30' : template === 'dev' ? '#4facfe' : '#ffcc00'),
      totalScouts: req.body.totalScouts || 1,
      activeScouts: req.body.activeScouts || 1,
      template: template,
      members: req.body.members && req.body.members.length > 0 ? req.body.members : [req.user?.username || 'Scout'],
      expeditions: expeditions
    };

    const newCamp = new Campsite(campPayload);
    const savedCamp = await newCamp.save();
    syncCampsiteToSupabase(savedCamp);
    
    if (savedCamp.isPublic && req.io) {
      req.io.emit('new_public_campsite', savedCamp);
    }
    
    res.status(201).json(savedCamp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT (update) a campsite
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const updatedCamp = await Campsite.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (updatedCamp) syncCampsiteToSupabase(updatedCamp);
    res.json(updatedCamp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a campsite (Decommission)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Campsite.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campsite permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST join a campsite
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const { username } = req.body;
    const camp = await Campsite.findById(req.params.id);
    
    if (!camp) return res.status(404).json({ message: 'Campsite not found' });

    if (camp.kickedUsers && camp.kickedUsers.includes(username)) {
      return res.status(403).json({ message: 'You have been kicked from this campsite.' });
    }
    
    if (!camp.members.includes(username)) {
      camp.members.push(username);
      camp.totalScouts += 1;
      camp.activeScouts += 1;
      await camp.save();
      syncCampsiteToSupabase(camp);
    }
    
    res.json(camp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST leave a campsite
router.post('/:id/leave', requireAuth, async (req, res) => {
  try {
    const { username } = req.body;
    const camp = await Campsite.findById(req.params.id);
    
    if (!camp) return res.status(404).json({ message: 'Campsite not found' });
    
    camp.members = camp.members.filter(m => m !== username);
    camp.totalScouts = Math.max(1, camp.totalScouts - 1);
    camp.activeScouts = Math.max(1, camp.activeScouts - 1);
    
    await camp.save();
    syncCampsiteToSupabase(camp);
    res.json({ message: 'Successfully left the bootcamp' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST kick a member from a campsite
router.post('/:id/kick', requireAuth, async (req, res) => {
  try {
    const { username } = req.body;
    let adminEmail = req.user.email;
    if (!adminEmail && req.user.id) {
      const u = await User.findById(req.user.id);
      if (u) adminEmail = u.email;
    }
    const camp = await Campsite.findById(req.params.id);
    
    if (!camp) return res.status(404).json({ message: 'Campsite not found' });
    
    // Check if the requester is the admin or the developer
    const isGlobalAdmin = adminEmail && adminEmail.toLowerCase().trim() === 'harshitmehta1012@gmail.com';
    const isCampAdmin = (camp.adminEmail && adminEmail && camp.adminEmail.toLowerCase().trim() === adminEmail.toLowerCase().trim()) || 
                        (camp.adminUsername && req.user.username && camp.adminUsername === req.user.username);
    
    if (!isGlobalAdmin && !isCampAdmin) {
      return res.status(403).json({ message: 'Only the admin or developer can kick users' });
    }
    
    // Prevent kicking the Developer
    const targetUser = await User.findOne({ username });
    if (targetUser && targetUser.email && targetUser.email.toLowerCase().trim() === 'harshitmehta1012@gmail.com') {
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: 'You cannot kick the platform Developer.' });
      }
    }
    
    // Remove from members
    camp.members = camp.members.filter(m => m !== username);
    camp.totalScouts = Math.max(1, (camp.totalScouts || 1) - 1);
    camp.activeScouts = Math.max(1, (camp.activeScouts || 1) - 1);
    
    // Add to kickedUsers
    if (!camp.kickedUsers) camp.kickedUsers = [];
    if (!camp.kickedUsers.includes(username)) {
      camp.kickedUsers.push(username);
    }
    
    await camp.save();
    syncCampsiteToSupabase(camp);
    res.json({ message: `${username} has been kicked from the campsite`, camp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST ban a member from a campsite
router.post('/:id/ban', requireAuth, async (req, res) => {
  try {
    const { username } = req.body;
    let adminEmail = req.user.email;
    if (!adminEmail && req.user.id) {
      const u = await User.findById(req.user.id);
      if (u) adminEmail = u.email;
    }
    const camp = await Campsite.findById(req.params.id);
    
    if (!camp) return res.status(404).json({ message: 'Campsite not found' });
    
    // Check if the requester is the admin or the developer
    const isGlobalAdmin = adminEmail && adminEmail.toLowerCase().trim() === 'harshitmehta1012@gmail.com';
    const isCampAdmin = (camp.adminEmail && adminEmail && camp.adminEmail.toLowerCase().trim() === adminEmail.toLowerCase().trim()) || 
                        (camp.adminUsername && req.user.username && camp.adminUsername === req.user.username);
    
    if (!isGlobalAdmin && !isCampAdmin) {
      return res.status(403).json({ message: 'Only the admin or developer can ban users' });
    }
    
    // Prevent banning the Developer
    const targetUser = await User.findOne({ username });
    if (targetUser && targetUser.email && targetUser.email.toLowerCase().trim() === 'harshitmehta1012@gmail.com') {
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: 'You cannot ban the platform Developer.' });
      }
    }
    
    // Add to bannedUsers (but DO NOT remove from members)
    if (!camp.bannedUsers) camp.bannedUsers = [];
    if (!camp.bannedUsers.includes(username)) {
      camp.bannedUsers.push(username);
    }
    
    await camp.save();
    syncCampsiteToSupabase(camp);
    res.json({ message: `${username} has been permanently banned`, camp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a role in a campsite
router.post('/:id/roles', requireAuth, async (req, res) => {
  try {
    const { name, color } = req.body;
    const camp = await Campsite.findById(req.params.id);
    if (!camp) return res.status(404).json({ message: 'Campsite not found' });
    
    camp.roles.push({ name, color });
    await camp.save();
    res.json(camp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST assign a role to a member in a campsite
router.post('/:id/roles/assign', requireAuth, async (req, res) => {
  try {
    const { username, roleName } = req.body;
    const camp = await Campsite.findById(req.params.id);
    if (!camp) return res.status(404).json({ message: 'Campsite not found' });
    
    if (!camp.memberRoles) {
      camp.memberRoles = new Map();
    }
    
    // Assign role to member. If roleName is empty, remove the role.
    if (roleName) {
      camp.memberRoles.set(username, roleName);
    } else {
      camp.memberRoles.delete(username);
    }
    
    await camp.save();
    res.json(camp);
    } catch (err) {
    res.status(500).json({ error: err.message });
    }
    });

    // PATCH update a campsite's trail status (for Trail Markers)
    router.patch('/:id/trail-status', requireAuth, async (req, res) => {
    try {
    const { label, username } = req.body;
    const camp = await Campsite.findById(req.params.id);
    if (!camp) return res.status(404).json({ message: 'Campsite not found' });

    camp.trailStatus = {
      label,
      updatedBy: username,
      updatedAt: new Date(),
    };

    const updatedCamp = await camp.save();

    // Notify all members of the campsite room about the update
    if (req.io) {
      req.io.to(`camp_${camp._id}`).emit('campsite_updated', updatedCamp);
    }

    res.json(updatedCamp);
    } catch (err) {
    res.status(400).json({ error: err.message });
    }
    });

    // PATCH toggle censorship on a campsite (Admin/Developer only)
    router.patch('/:id/censorship', requireAuth, async (req, res) => {
      try {
        const { censorshipEnabled, censorshipReason, adminEmail } = req.body;
        const camp = await Campsite.findById(req.params.id);
        if (!camp) return res.status(404).json({ message: 'Campsite not found' });

        // Security: only the campsite admin or the global developer may toggle censorship
        const isGlobalDev = adminEmail?.toLowerCase()?.trim() === 'harshitmehta1012@gmail.com';
        const isCampAdmin = camp.adminEmail?.toLowerCase()?.trim() === adminEmail?.toLowerCase()?.trim();
        if (!isGlobalDev && !isCampAdmin) {
          return res.status(403).json({ error: 'Unauthorized — only Admin or Developer can toggle Censorship.' });
        }

        camp.censorshipEnabled = !!censorshipEnabled;
        camp.censorshipReason = censorshipReason || '';
        const updatedCamp = await camp.save();

        // Broadcast the new censorship state to EVERY member of this campsite room in real-time
        if (req.io) {
          req.io.to(`camp_${camp._id}`).emit('censorship_updated', {
            campsiteId: String(camp._id),
            censorshipEnabled: updatedCamp.censorshipEnabled,
            censorshipReason: updatedCamp.censorshipReason
          });
        }

        res.json({ success: true, censorshipEnabled: updatedCamp.censorshipEnabled, censorshipReason: updatedCamp.censorshipReason });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

module.exports = router;

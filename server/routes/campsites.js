const express = require('express');
const router = express.Router();
const Campsite = require('../models/Campsite');

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
    const { username } = req.params;
    // We strictly ONLY pull campsites where the user is listed in the members array.
    // We intentionally ignore adminEmail here so that creators don't see their own 
    // newly created public camps in their sidebar until they explicitly join them from Discover.
    const campsites = await Campsite.find({
      members: username
    });
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
router.post('/', async (req, res) => {
  try {
    const newCamp = new Campsite(req.body);
    const savedCamp = await newCamp.save();
    res.status(201).json(savedCamp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT (update) a campsite
router.put('/:id', async (req, res) => {
  try {
    const updatedCamp = await Campsite.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(updatedCamp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a campsite (Decommission)
router.delete('/:id', async (req, res) => {
  try {
    await Campsite.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campsite permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST join a campsite
router.post('/:id/join', async (req, res) => {
  try {
    const { username } = req.body;
    const camp = await Campsite.findById(req.params.id);
    
    if (!camp) return res.status(404).json({ message: 'Campsite not found' });
    
    if (!camp.members.includes(username)) {
      camp.members.push(username);
      camp.totalScouts += 1;
      camp.activeScouts += 1;
      await camp.save();
    }
    
    res.json(camp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST leave a campsite
router.post('/:id/leave', async (req, res) => {
  try {
    const { username } = req.body;
    const camp = await Campsite.findById(req.params.id);
    
    if (!camp) return res.status(404).json({ message: 'Campsite not found' });
    
    camp.members = camp.members.filter(m => m !== username);
    camp.totalScouts = Math.max(1, camp.totalScouts - 1);
    camp.activeScouts = Math.max(1, camp.activeScouts - 1);
    
    await camp.save();
    res.json({ message: 'Successfully left the bootcamp' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a role in a campsite
router.post('/:id/roles', async (req, res) => {
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
router.post('/:id/roles/assign', async (req, res) => {
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

module.exports = router;

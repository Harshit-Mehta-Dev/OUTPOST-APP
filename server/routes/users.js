const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const supabase = require('../supabaseClient');

// Helper to push user backups to Supabase
const syncToSupabase = async (userDoc) => {
  try {
    if (!supabase) return;
    const { _id, password, __v, ...data } = userDoc.toObject ? userDoc.toObject() : userDoc;
    const { error } = await supabase.from('users').upsert(
      { email: data.email, ...data }, 
      { onConflict: 'email' }
    );
    if (error) console.error('Supabase User Backup Error:', error.message);
  } catch (err) {
    console.error('Supabase User Backup Exception:', err.message);
  }
};

// POST /api/users/sync
// Find user by email. If they don't exist, create them. (For Google Auth)
router.post('/sync', async (req, res) => {
  try {
    const { email, username } = req.body;
    
    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email, username });
      await user.save();
      syncToSupabase(user);
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/register
// Register with email, username, and password
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Please provide all fields' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ email, username, password: hashedPassword });
    await user.save();
    syncToSupabase(user);
    
    const userToReturn = user.toObject();
    delete userToReturn.password;
    res.json(userToReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login
// Login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'This account uses Google Sign-In. Please sign in with Google or reset your password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const userToReturn = user.toObject();
    delete userToReturn.password;
    res.json(userToReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/profile
// Update user profile (username, profilePictureUrl, passwords)
router.put('/profile', async (req, res) => {
  try {
    const { email, username, profilePictureUrl, currentPassword, newPassword } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required to update profile' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // User doesn't exist in DB yet (legacy login), create them
      user = new User({ email, username });
      await user.save();
    }

    const updates = { username, profilePictureUrl };

    // Handle password change
    if (currentPassword && newPassword) {
      if (!user.password) {
        // If they signed up with Google, they might not have a password yet.
        // We'll just set it without requiring old password match.
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(newPassword, salt);
      } else {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid current password' });
        }
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(newPassword, salt);
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (updatedUser) syncToSupabase(updatedUser);

    // Don't send password back
    const userToReturn = updatedUser.toObject();
    delete userToReturn.password;

    res.json(userToReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:email/disable
// Temporarily disable user account
router.patch('/:email/disable', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: 'Email is required to disable account' });
    }

    const disabledUser = await User.findOneAndUpdate(
      { email },
      { $set: { disabled: true } },
      { returnDocument: 'after' }
    );
    
    if (!disabledUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User disabled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:email
// Permanently delete user account
router.delete('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: 'Email is required to delete profile' });
    }

    const deletedUser = await User.findOneAndDelete({ email });
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:username/alerts
// Fetch system alerts for a user
router.get('/:username/alerts', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user.systemAlerts || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:username/alerts
// Clear all system alerts for a user
router.delete('/:username/alerts', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOneAndUpdate(
      { username },
      { $set: { systemAlerts: [] } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ message: 'Alerts cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

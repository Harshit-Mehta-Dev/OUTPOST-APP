const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/users/sync
// Find user by email. If they don't exist, create them.
router.post('/sync', async (req, res) => {
  try {
    const { email, username } = req.body;
    
    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({ email, username });
      await user.save();
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/profile
// Update user profile (username, profilePictureUrl)
router.put('/profile', async (req, res) => {
  try {
    const { email, username, profilePictureUrl } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required to update profile' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { username, profilePictureUrl } },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

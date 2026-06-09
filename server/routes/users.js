const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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
      { new: true }
    );

    // Don't send password back
    const userToReturn = updatedUser.toObject();
    delete userToReturn.password;

    res.json(userToReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

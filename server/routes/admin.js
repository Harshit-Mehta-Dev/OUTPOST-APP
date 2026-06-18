const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Campsite = require('../models/Campsite');
const Message = require('../models/Message');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

// All routes in this file require Auth + Admin privileges
router.use(requireAuth);
router.use(requireAdmin);

// ========================
// USER MANAGEMENT
// ========================

// GET all users (with basic stats)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT ban/unban user
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { isGloballyRestricted } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isGloballyRestricted }, { new: true });
    res.json({ message: `User ${isGloballyRestricted ? 'banned' : 'unbanned'} successfully`, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// DELETE a user
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ========================
// CAMPSITE MANAGEMENT
// ========================

// GET all campsites (bypassing normal filters)
router.get('/campsites', async (req, res) => {
  try {
    const campsites = await Campsite.find().sort({ createdAt: -1 });
    res.json(campsites);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campsites' });
  }
});

// DELETE a campsite
router.delete('/campsites/:id', async (req, res) => {
  try {
    await Campsite.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campsite deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete campsite' });
  }
});

// ========================
// GLOBAL CHAT LOGS
// ========================

// GET last 100 messages across all rooms
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// DELETE a message
router.delete('/messages/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;

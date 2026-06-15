const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// POST a new feedback
router.post('/', async (req, res) => {
  try {
    const { userName, email, message } = req.body;
    
    const newFeedback = new Feedback({
      userName,
      email,
      message
    });
    
    await newFeedback.save();
    
    // Emit real-time event to developers
    if (req.io) {
      req.io.to('harshitmehta1012@gmail.com').emit('new_feedback', newFeedback);
    }
    
    res.status(201).json(newFeedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all feedback
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ timestamp: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE a specific feedback
router.delete('/:id', async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

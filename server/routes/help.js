const express = require('express');
const router = express.Router();
const HelpRequest = require('../models/HelpRequest');

// Create a new help request
router.post('/requests', async (req, res) => {
  try {
    const { userName, email, description, initialScreenshotUrl } = req.body;
    
    if (!userName || !email || !description) {
      return res.status(400).json({ error: 'Name, email, and description are required' });
    }

    const ticketId = 'TK-' + Math.floor(100000 + Math.random() * 900000).toString();

    const newRequest = new HelpRequest({
      ticketId,
      userName,
      email,
      description,
      initialScreenshotUrl
    });

    await newRequest.save();

    res.status(201).json({ 
      message: 'Help request submitted successfully',
      requestId: newRequest.ticketId
    });
  } catch (error) {
    console.error('Error creating help request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all help requests (for developer dashboard)
router.get('/requests', async (req, res) => {
  try {
    // Ideally we would check auth here, but based on current project scope,
    // we'll fetch them, and the frontend will conditionally render the button.
    // Ensure we send back requests sorted by newest first
    const requests = await HelpRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching help requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single help request by ID (to get chat history on reconnect)
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await HelpRequest.findOne({ ticketId: req.params.id }) || await HelpRequest.findById(req.params.id).catch(() => null);
    if (!request) {
      return res.status(404).json({ error: 'Help request not found' });
    }
    res.json(request);
  } catch (error) {
    console.error('Error fetching help request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark a request as closed
router.patch('/requests/:id/close', async (req, res) => {
  try {
    const request = await HelpRequest.findOneAndUpdate(
      { ticketId: req.params.id }, 
      { status: 'Closed' },
      { new: true }
    ) || await HelpRequest.findByIdAndUpdate(req.params.id, { status: 'Closed' }, { new: true }).catch(() => null);
    if (!request) {
      return res.status(404).json({ error: 'Help request not found' });
    }
    res.json(request);
  } catch (error) {
    console.error('Error closing help request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Delete all help requests
router.delete('/requests', async (req, res) => {
  try {
    await HelpRequest.deleteMany({});
    res.json({ message: 'All tickets successfully deleted' });
  } catch (error) {
    console.error('Error deleting help requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

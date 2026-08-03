const express = require('express');
const router = express.Router();
const StickyNote = require('../models/StickyNote');

// Get all sticky notes for a specific campsite
router.get('/:campsiteId', async (req, res) => {
  try {
    const notes = await StickyNote.find({ campsiteId: req.params.campsiteId }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching sticky notes:', error);
    res.status(500).json({ error: 'Server error fetching sticky notes' });
  }
});

// Create a new sticky note
router.post('/', async (req, res) => {
  try {
    const { campsiteId, title, body, author, color } = req.body;
    
    if (!campsiteId || !title || !body || !author) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newNote = new StickyNote({
      campsiteId,
      title,
      body,
      author,
      color: color || '#fef3c7'
    });

    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error) {
    console.error('Error creating sticky note:', error);
    res.status(500).json({ error: 'Server error creating sticky note' });
  }
});

// Delete a sticky note
router.delete('/:id', async (req, res) => {
  try {
    const note = await StickyNote.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Sticky note not found' });
    }
    res.json({ message: 'Sticky note deleted successfully' });
  } catch (error) {
    console.error('Error deleting sticky note:', error);
    res.status(500).json({ error: 'Server error deleting sticky note' });
  }
});

// Toggle a reaction on a sticky note
router.post('/:id/react', async (req, res) => {
  try {
    const { emoji, username } = req.body;
    
    if (!emoji || !username) {
      return res.status(400).json({ error: 'Missing emoji or username' });
    }

    const note = await StickyNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Sticky note not found' });
    }

    const reactionIndex = note.reactions.findIndex(r => r.emoji === emoji);

    if (reactionIndex > -1) {
      // Reaction exists, toggle user
      const userIndex = note.reactions[reactionIndex].users.indexOf(username);
      if (userIndex > -1) {
        // User already reacted, remove them
        note.reactions[reactionIndex].users.splice(userIndex, 1);
        // If no users left for this emoji, remove the emoji entirely
        if (note.reactions[reactionIndex].users.length === 0) {
          note.reactions.splice(reactionIndex, 1);
        }
      } else {
        // User hasn't reacted with this emoji, add them
        note.reactions[reactionIndex].users.push(username);
      }
    } else {
      // New emoji reaction
      note.reactions.push({ emoji, users: [username] });
    }

    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error) {
    console.error('Error reacting to sticky note:', error);
    res.status(500).json({ error: 'Server error reacting to sticky note' });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const StickyNoteSchema = new mongoose.Schema({
  campsiteId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  author: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: '#fef3c7' // default warm yellow
  },
  reactions: [{
    emoji: String,
    users: [String]
  }],
}, { timestamps: true });

module.exports = mongoose.model('StickyNote', StickyNoteSchema);

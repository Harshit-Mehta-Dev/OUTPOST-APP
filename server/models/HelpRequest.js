const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderType: {
    type: String,
    enum: ['user', 'developer'],
    required: true
  },
  text: {
    type: String
  },
  mediaType: {
    type: String
  },
  body: {
    type: String // for base64 image data
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const helpRequestSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true
  },
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  initialScreenshotUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open'
  },
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('HelpRequest', helpRequestSchema);

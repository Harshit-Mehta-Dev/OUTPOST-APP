const mongoose = require('mongoose');

const helpTicketSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: false
  },
  senderEmail: {
    type: String,
    required: true
  },
  encryptedPayload: {
    type: String,
    required: true
  },
  hasMedia: {
    type: Boolean,
    default: false
  },
  mediaData: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: "Open",
    enum: ["Open", "In Progress", "Closed"]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HelpTicket', helpTicketSchema);

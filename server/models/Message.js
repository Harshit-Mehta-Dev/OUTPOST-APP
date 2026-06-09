const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  channelKey: { type: String, required: true, index: true },
  user: {
    username: { type: String, required: true },
    profilePictureUrl: { type: String },
    level: { type: Number, default: 1 }
  },
  time: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);

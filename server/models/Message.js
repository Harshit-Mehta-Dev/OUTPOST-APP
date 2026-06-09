const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  channelKey: { type: String, required: true, index: true },
  user: {
    username: { type: String, required: true },
    profilePictureUrl: { type: String },
    level: { type: Number, default: 1 }
  },
  time: { type: String, required: true },
  type: { type: String, default: "text" },
  text: { type: String },
  mediaType: { type: String },
  body: { type: String },
  pollData: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);

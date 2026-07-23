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
  text: { type: String }, // Legacy plaintext field
  encryptedData: { type: String }, // Scout-Vault ciphertext
  iv: { type: String }, // Scout-Vault initialization vector
  mediaType: { type: String },
  body: { type: String },
  pollData: { type: mongoose.Schema.Types.Mixed },
  replyTo: { type: mongoose.Schema.Types.Mixed },
  likes: { type: [String], default: [] },
  isPinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for optimizing channel fetching (filter by channelKey, sort by createdAt)
messageSchema.index({ channelKey: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);

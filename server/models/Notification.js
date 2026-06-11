const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  campsiteId: { type: String, required: true },
  message: { type: String, required: true },
  scoutName: { type: String },
  type: { type: String, default: 'alert' }, // 'alert', 'typing'
  
  // TTL Index: This record will automatically vanish after 48 hours
  createdAt: { type: Date, default: Date.now, expires: '48h' }
});

module.exports = mongoose.model('Notification', notificationSchema);

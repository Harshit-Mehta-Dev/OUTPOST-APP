const mongoose = require('mongoose');

const expeditionSchema = new mongoose.Schema({
  id: String,
  name: String,
  type: { type: String, enum: ['text', 'voice'], default: 'text' }
});

const roleSchema = new mongoose.Schema({
  name: String,
  color: String,
  canDeleteMessages: { type: Boolean, default: false },
  canManageAI: { type: Boolean, default: false }
});

const campsiteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  template: { type: String, enum: ['gaming', 'dev', 'casual'], default: 'casual' },
  category: { type: String, default: 'Casual' },
  icon: { type: String, default: '🏕️' },
  imageUrl: { type: String },
  adminEmail: { type: String }, // Used to check if user is the creator
  adminUsername: { type: String }, // Store creator's username for chat tags
  isPublic: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  color: { type: String, default: '#ffcc00' },
  
  // Customization
  globalAgeGate: { type: Boolean, default: false },
  channelOverrides: { type: Map, of: Boolean, default: {} },
  
  expeditions: [expeditionSchema],
  roles: [roleSchema],
  memberRoles: { type: Map, of: String, default: {} }, // Maps username to roleName
  members: [{ type: String }], // Array of usernames
  bannedUsers: [{ type: String }], // Array of usernames permanently banned
  kickedUsers: [{ type: String }], // Array of usernames permanently kicked
  
  totalScouts: { type: Number, default: 1 },
  activeScouts: { type: Number, default: 1 },

  trailStatus: {
    label: { type: String, default: 'Clear Skies' },
    updatedBy: { type: String },
    updatedAt: { type: Date }
  }
}, { timestamps: true });

// Performance Indexes
campsiteSchema.index({ isPublic: 1, active: 1 }); // Optimizes Discover fetching
campsiteSchema.index({ members: 1 }); // Optimizes Sidebar fetching

module.exports = mongoose.model('Campsite', campsiteSchema);

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
  replyTo: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

const testPoll = new Message({
  channelKey: '1_1',
  user: { username: 'Scout' },
  time: 'Now',
  type: 'poll',
  pollData: {
    question: "Test",
    options: ["A", "B"],
    votesArray: [],
    votesMap: { 0: [], 1: [] }
  }
});

console.log('Test poll before save (toObject):', JSON.stringify(testPoll.toObject(), null, 2));

const err = testPoll.validateSync();
if (err) {
  console.error("Validation Error:", err);
} else {
  console.log("Validation Passed!");
}

const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGODB_URI || 'your_mongo_uri_here';
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const messages = await db.collection('messages').find({ type: { $ne: 'text' } }).sort({createdAt: -1}).limit(5).toArray();
  console.log('Total non-text messages:', messages.length);
  if(messages.length > 0) {
    console.log(JSON.stringify(messages.map(m => ({ channel: m.channelKey, type: m.type, mediaType: m.mediaType, bodyLen: m.body ? m.body.length : 0, pollData: m.pollData })), null, 2));
  }
  process.exit(0);
}).catch(console.error);

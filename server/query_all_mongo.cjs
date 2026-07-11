const mongoose = require('mongoose');
const uri = 'mongodb+srv://harshitmehta1313_db_user:gX6uH9swZQ1uHZXo@cluster-outpost.nmytljf.mongodb.net/outpost?retryWrites=true&w=majority&appName=Cluster-OUTPOST';
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const messages = await db.collection('messages').find({ type: { $ne: 'text' } }).sort({createdAt: -1}).limit(5).toArray();
  console.log('Total non-text messages:', messages.length);
  if(messages.length > 0) {
    console.log(JSON.stringify(messages.map(m => ({ channel: m.channelKey, type: m.type, mediaType: m.mediaType, bodyLen: m.body ? m.body.length : 0, pollData: m.pollData })), null, 2));
  }
  process.exit(0);
}).catch(console.error);

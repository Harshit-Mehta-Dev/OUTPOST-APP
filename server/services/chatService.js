const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger_output.json');
require('dotenv').config();

const basicAuth = require('express-basic-auth');

const app = express();

// Secure the API Docs with a native browser login prompt
const docsAuth = basicAuth({
  users: { 
    [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASS || 'admin'
  },
  challenge: true,
  realm: 'Outpost API Docs',
});

// Mount Swagger UI
app.use('/api-docs', docsAuth, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const server = http.createServer(app);

const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const supabase = require('../supabaseClient');
const { checkScoutPermission } = require('../utils/rbac');
const Notification = require('../models/Notification');
const { compressMediaPayload } = require('../utils/compression');

const cache = require('../middleware/cache');
const xss = require('xss-clean');
const morgan = require('morgan');

// Global Crash Handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 System recovered.');
  console.error(err.name, err.message, err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 System recovered.');
  console.error(err.name, err.message, err.stack);
});

// Helper to push message backups to Supabase
const syncMessageToSupabase = async (messageDoc) => {
  try {
    if (!supabase) return;
    const { _id, __v, ...data } = messageDoc.toObject ? messageDoc.toObject() : messageDoc;
    const { error } = await supabase.from('messages').upsert(
      { id: _id.toString(), ...data }, 
      { onConflict: 'id' }
    );
    if (error) console.error('Supabase Message Backup Error:', error.message);
  } catch (err) {
    console.error('Supabase Message Backup Exception:', err.message);
  }
};

// Setup Socket.io
const io = new Server(server, {
  maxHttpBufferSize: 5e7, // 50MB payload limit for images
  cors: {
    origin: "*", // allow all frontend origins
    methods: ["GET", "POST"]
  }
});

// Socket.io JWT Authentication Middleware
const jwt = require('jsonwebtoken');

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    if (supabase) {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        throw new Error('Supabase token invalid');
      }
      socket.user = data.user;
    } else {
      const secret = process.env.JWT_SECRET || 'your_fallback_super_secure_sha256_string_here';
      const decoded = jwt.verify(token, secret);
      socket.user = decoded;
    }
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Make io accessible to our router middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Setup Redis Adapter for multi-container orchestration (Only if REDIS_URL is explicitly provided)
let redisClientForLimits;
if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  redisClientForLimits = pubClient;

  pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
  subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter connected to Socket.io');
  }).catch(err => console.error('Redis connection error:', err));
} else {
  console.log('ℹ️ REDIS_URL not provided. Socket.io running in standalone mode.');
}

// Security Middleware
// 1. Helmet to secure HTTP headers
app.use(helmet());

// 2. Trust Proxy (Required if hosting on Render, Heroku, or behind NGINX/K8s)
app.set('trust proxy', 1);

// 3. CORS and Body Parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Phase 6: 24/7 Ops & Security ---
// 3.5. Logging & Sanitization
app.use(morgan('combined')); // Operational Logging

// 24/7 Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Operational', timestamp: new Date() });
});
// ------------------------------------

// 4. Rate Limiters

// Layer 1: Global DDoS Protection (100 requests per 15 minutes)
const getStore = () => redisClientForLimits ? new RedisStore({ sendCommand: (...args) => redisClientForLimits.sendCommand(args) }) : undefined;

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
});

// Layer 2: Anti-Brute Force for Auth (5 requests per minute)
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 5, 
  message: 'Too many login attempts from this IP, please try again after a minute',
  store: getStore(),
});

// Layer 3: Database Strain Prevention for Searching/Fetching (30 requests per minute)
const dataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 30, 
  message: 'Too many data requests from this IP, please try again after a minute',
  store: getStore(),
});

// Layer 4: Anti-Spam for Forms/Joining (10 requests per minute)
const actionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10, 
  message: 'Too many actions from this IP, please try again after a minute',
  store: getStore(),
});

// Apply Global Limiter to all API routes
app.use('/api/', globalLimiter);

// Apply specific limiters
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

app.use('/api/campsites/join', actionLimiter);
app.use('/api/campsites/create', actionLimiter);

app.use('/api/campsites', dataLimiter);
app.use('/api/messages', dataLimiter);

// Pure WebSocket Service - No Express Routes

// Health Check for Chat Service
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

const Message = require('../models/Message');
const Campsite = require('../models/Campsite');
const User = require('../models/User');
const HelpRequest = require('../models/HelpRequest');
const scoutVault = require('../utils/scoutVault');

// Pinned Messages Route
app.get('/api/messages/pins', cache(15), async (req, res) => {
  try {
    const messages = await Message.find({ isPinned: true })
      .sort({ createdAt: -1 })
      .limit(100);
      
    const decryptedMessages = messages.map(msg => {
      const doc = msg.toObject ? msg.toObject() : msg;
      if (doc.encryptedData && doc.iv) {
        doc.text = scoutVault.decrypt(doc.encryptedData, doc.iv);
      }
      return doc;
    });
    
    res.json(decryptedMessages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pinned messages' });
  }
});

// Messages Route
app.get('/api/messages/:channelKey', async (req, res) => {
  try {
    const username = req.query.username || req.headers['x-username'];
    const query = { channelKey: req.params.channelKey };
    if (username) {
      query.deletedFor = { $ne: username };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .limit(100);
      
    const decryptedMessages = messages.map(msg => {
      const doc = msg.toObject ? msg.toObject() : msg;
      if (doc.encryptedData && doc.iv) {
        doc.text = scoutVault.decrypt(doc.encryptedData, doc.iv);
      }
      return doc;
    });
    
    res.json(decryptedMessages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// REST Route: Delete message for everyone (Purge from Mongo + Supabase)
app.delete('/api/messages/:id', async (req, res) => {
  try {
    const messageId = req.params.id;
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    await Message.findByIdAndDelete(messageId);
    if (supabase) {
      try {
        await supabase.from('messages').delete().eq('id', String(messageId));
      } catch (sErr) {
        console.error("Supabase REST delete error:", sErr);
      }
    }

    if (io && msg.channelKey) {
      io.to(msg.channelKey).emit("message_deleted", { messageId, channelKey: msg.channelKey });
    }
    res.json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// REST Route: Delete message for me (per-user soft delete)
app.post('/api/messages/:id/delete-for-me', async (req, res) => {
  try {
    const messageId = req.params.id;
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    await Message.updateOne({ _id: messageId }, { $addToSet: { deletedFor: username } });
    res.json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark message as deleted' });
  }
});

// Socket.io logic
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join a specific channel room
  socket.on('join_channel', (channelKey) => {
    // Leave previous rooms (except their own socket ID room and admin rooms)
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id && !room.includes('@') && !room.startsWith('camp_')) {
        socket.leave(room);
      }
    });
    
    socket.join(channelKey);
    console.log(`User ${socket.id} joined channel ${channelKey}`);
  });

  socket.on('join_campsite_room', (campsiteId) => {
    socket.join(`camp_${campsiteId}`);
  });

  socket.on('join_admin_room', (email) => {
    if (email) socket.join(email.toLowerCase().trim());
  });

  socket.on('join_user_room', (username) => {
    socket.join(`user-room-${username}`);
  });

  socket.on('kick_user_event', (data) => {
    io.to(`user-room-${data.username}`).emit('user_kicked', data);
  });

  socket.on('ban_user_event', (data) => {
    io.to(`user-room-${data.username}`).emit('user_banned', data);
  });

  // Help Desk specific rooms
  socket.on('join_help_room', (requestId) => {
    socket.join(`help_${requestId}`);
    console.log(`User ${socket.id} joined help room help_${requestId}`);
  });

  socket.on('send_help_message', async (data) => {
    try {
      const { requestId, senderType, text, mediaType, body } = data;
      
      let processedBody = body;
      if (mediaType && body) {
        // processedBody = await compressMediaPayload(body, mediaType);
      }

      const newMessage = {
        senderType,
        text,
        mediaType,
        body: processedBody,
        timestamp: new Date()
      };

      const request = await HelpRequest.findOne({ ticketId: requestId }) || await HelpRequest.findById(requestId).catch(() => null);
      if (request) {
        request.messages.push(newMessage);
        await request.save();
        
        io.to(`help_${requestId}`).emit('receive_help_message', {
          requestId,
          message: request.messages[request.messages.length - 1]
        });

        // Notify developers if the message is from a user
        if (senderType === 'user') {
          io.to('harshitmehta1012@gmail.com').emit('new_help_request_message', {
            requestId,
            userName: request.userName,
            textPreview: text ? text.substring(0, 45) : '[Media]',
            timestamp: newMessage.timestamp
          });
        }
      }
    } catch (err) {
      console.error('Error handling send_help_message:', err);
    }
  });

  socket.on('typing_help_message', (data) => {
    socket.to(`help_${data.requestId}`).emit('user_typing', data);
  });

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    try {
      // --- Phase 5: Media Compression Engine ---
      if (data.type === 'media' && data.body) {
        // Enforce max 10MB payload size
        const payloadSize = Buffer.byteLength(data.body, 'utf8');
        if (payloadSize > 10 * 1024 * 1024) {
          return socket.emit('error', { message: 'Payload too large. Maximum size is 10MB.' });
        }
        
        // Strict MIME-type validation (magic bytes / regex)
        const matches = data.body.match(/^data:(image\/[a-zA-Z0-9.-]+|audio\/[a-zA-Z0-9.-]+);base64,/);
        if (!matches) {
          return socket.emit('error', { message: 'Invalid media format.' });
        }
        
        // data.body = await compressMediaPayload(data.body, data.mediaType);
      }

      // 1. Save to MongoDB
      const newMessage = new Message({
        channelKey: data.channelKey,
        user: data.user,
        time: data.time,
        type: data.type,
        text: data.text,
        mediaType: data.mediaType,
        body: data.body,
        pollData: data.pollData,
        replyTo: data.replyTo
      });
      await newMessage.save();
      syncMessageToSupabase(newMessage);

      // --- Phase 1: XP & Levelling Engine ---
      let currentLevel = data.user.level || 1;
      let currentXp = data.user.xp || 0;
      
      try {
        const userDoc = await User.findOne({ username: data.user.username });
        if (userDoc) {
          const xpGain = data.type === 'poll' ? 20 : (data.mediaType ? 15 : 10);
          userDoc.xp += xpGain;
          
          // Formula: Level = floor(sqrt(XP * 0.1)) + 1
          const calculatedLevel = Math.floor(Math.sqrt(userDoc.xp * 0.1)) + 1;
          
          let leveledUp = false;
          if (calculatedLevel > userDoc.level) {
            userDoc.level = calculatedLevel;
            leveledUp = true;
          }
          await userDoc.save();
          
          currentLevel = userDoc.level;
          currentXp = userDoc.xp;

          if (leveledUp) {
            io.to(`user-room-${userDoc.username}`).emit('level_up_alert', {
              newLevel: userDoc.level,
              xp: userDoc.xp
            });
          }
        }
      } catch (xpErr) {
        console.error("XP Calculation Error:", xpErr);
      }
      // --- End XP Engine ---

      // Inject the live XP data back into the broadcast so the UI can update
      const broadcastUser = { ...newMessage.user, level: currentLevel, xp: currentXp };

      // 2. Broadcast to everyone in the room (including sender to confirm)
      io.to(data.channelKey).emit('receive_message', {
        id: newMessage._id,
        user: broadcastUser,
        time: newMessage.time,
        type: newMessage.type,
        text: newMessage.text,
        mediaType: newMessage.mediaType,
        body: newMessage.body,
        pollData: newMessage.pollData,
        channelKey: newMessage.channelKey
      });

      // 3. FAN-OUT Notification Logic
      try {
        const campsiteId = data.channelKey.split('_')[0];
        let textPreview = data.type === 'text' ? data.text : (data.type === 'poll' ? '[Poll]' : '[Media]');
        if (textPreview && textPreview.length > 45) {
          textPreview = textPreview.substring(0, 45) + '...';
        }

        // God Mode: Operator always receives signals for everything on the platform
        io.to('harshitmehta1012@gmail.com').emit('incoming-signal-alert', {
          campsiteId: campsiteId,
          campsiteName: campsiteId === '1' ? 'Outpost HQ' : 'Hidden Outpost', // Will be overwritten with real name below if not HQ
          channelId: data.channelKey,
          senderName: data.user.username,
          textPreview: textPreview
        });

        if (String(campsiteId) === '1') {
          // Outpost HQ - global broadcast to all users except the sender
          socket.broadcast.emit('incoming-signal-alert', {
            campsiteId: '1',
            campsiteName: 'Outpost HQ',
            channelId: data.channelKey,
            senderName: data.user.username,
            textPreview: textPreview
          });
        } else {
          const campsite = await Campsite.findById(campsiteId);
          if (campsite) {
            
            // God Mode intercept already fired above

            if (campsite.members) {
              campsite.members.forEach((memberUsername) => {
                if (memberUsername !== data.user.username) {
                  io.to(`user-room-${memberUsername}`).emit('incoming-signal-alert', {
                    campsiteId: campsiteId,
                    campsiteName: campsite.name,
                    channelId: data.channelKey,
                    senderName: data.user.username,
                    textPreview: textPreview
                  });
                }
              });
            }
          }
        }
      } catch (fanOutError) {
        console.error("Error broadcasting notification signal:", fanOutError);
      }
    } catch (err) {
      console.error("Error saving/broadcasting message:", err);
    }
  });

  socket.on("submit-scout-vote", async ({ messageId, channelKey, optionIndex, scoutId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (msg && msg.pollData) {
        if (!msg.pollData.votesArray) msg.pollData.votesArray = [];
        if (!msg.pollData.votesMap) msg.pollData.votesMap = {};
        
        if (!msg.pollData.votesArray.includes(scoutId)) {
          msg.pollData.votesArray.push(scoutId);
          if (!msg.pollData.votesMap[optionIndex]) msg.pollData.votesMap[optionIndex] = [];
          msg.pollData.votesMap[optionIndex].push(scoutId);
          
          msg.markModified('pollData');
          await msg.save();
          
          io.to(channelKey).emit('broadcast-updated-vote', {
            messageId: msg._id,
            pollData: msg.pollData
          });
        }
      }
    } catch (err) {
      console.error("Error saving vote:", err);
    }
  });

  // Catch and Broadcast "Scout is typing"
  socket.on("scout-typing-start", async ({ channelId, scoutName }) => {
    try {
      const campsiteId = channelId.split('_')[0];
      const typingNotif = new Notification({
        campsiteId,
        message: `${scoutName} is typing...`,
        scoutName,
        type: 'typing'
      });
      await typingNotif.save();
    } catch (err) {
      console.error("Error saving typing notification:", err);
    }
    socket.broadcast.to(channelId).emit("broadcast-typing-start", { scoutName });
  });

  socket.on("submit-scout-vote", async ({ messageId, channelKey, optionIndex, scoutId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message && message.type === 'poll') {
        const newPollData = { ...message.pollData };
        if (!newPollData.votesArray.includes(scoutId)) {
          newPollData.votesArray.push(scoutId);
          if(!newPollData.votesMap[optionIndex]) newPollData.votesMap[optionIndex] = [];
          newPollData.votesMap[optionIndex].push(scoutId);
          
          message.pollData = newPollData;
          message.markModified('pollData');
          await message.save();
          syncMessageToSupabase(message);
          
          io.to(channelKey).emit("broadcast-updated-vote", { messageId, optionIndex, scoutId, channelKey });
        }
      }
    } catch(err) {
      console.error("Error voting:", err);
    }
  });

  socket.on("delete_message_for_all", async ({ messageId, channelKey, username }) => {
    try {
      if (!username) return; // Silent fail if no username

      const msg = await Message.findById(messageId);
      if (!msg) return;

      const isAuthor = (msg.user && msg.user.username === username) || (msg.user === username);

      if (!isAuthor) {
        const campsiteId = channelKey.split('_')[0];
        const hasPermission = await checkScoutPermission(username, campsiteId, 'canDeleteMessages');

        if (!hasPermission) {
          socket.emit("permission_denied", { message: "You do not have the clearance code to delete this message." });
          return;
        }
      }

      await Message.findByIdAndDelete(messageId);

      if (supabase) {
        try {
          await supabase.from('messages').delete().eq('id', String(messageId));
        } catch (sErr) {
          console.error("Supabase message delete error:", sErr);
        }
      }

      io.to(channelKey).emit("message_deleted", { messageId, channelKey });
    } catch(err) {
      console.error("Error deleting message:", err);
    }
  });

  socket.on("delete_message_for_me", async ({ messageId, username }) => {
    try {
      if (!username || !messageId) return;
      await Message.updateOne({ _id: messageId }, { $addToSet: { deletedFor: username } });
    } catch(err) {
      console.error("Error deleting message for me:", err);
    }
  });

  socket.on("react_message", async ({ messageId, channelKey, emoji, username }) => {
    try {
      if (!username || !emoji) return;
      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (!msg.reactions) msg.reactions = [];

      const reactionIndex = msg.reactions.findIndex(r => r.emoji === emoji);
      if (reactionIndex > -1) {
        const userIndex = msg.reactions[reactionIndex].users.indexOf(username);
        if (userIndex > -1) {
          msg.reactions[reactionIndex].users.splice(userIndex, 1);
          if (msg.reactions[reactionIndex].users.length === 0) {
            msg.reactions.splice(reactionIndex, 1);
          }
        } else {
          msg.reactions[reactionIndex].users.push(username);
        }
      } else {
        msg.reactions.push({ emoji, users: [username] });
      }

      msg.markModified('reactions');
      await msg.save();
      syncMessageToSupabase(msg);

      io.to(channelKey).emit("message_reacted", { messageId, channelKey, reactions: msg.reactions });
    } catch (err) {
      console.error("Error reacting to message:", err);
    }
  });

  socket.on("pin_message", async ({ messageId, channelKey, isPinned }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      
      msg.isPinned = isPinned;
      await Message.updateOne({ _id: messageId }, { $set: { isPinned } });
      syncMessageToSupabase(msg);

      io.to(channelKey).emit("message_pinned", { messageId, channelKey, isPinned });
    } catch (err) {
      console.error("Error pinning message:", err);
    }
  });

  // Catch and Broadcast "Scout stopped typing"
  socket.on("scout-typing-stop", ({ channelId, scoutName }) => {
    socket.broadcast.to(channelId).emit("broadcast-typing-stop", { scoutName });
  });

  // Handle new scout joining a campsite
  socket.on("register-new-scout-join", async ({ campsiteId, adminEmail, scoutName, scoutAvatar }) => {
    // 1. Tell everyone currently looking at the campsite to update their member lists
    io.to(`camp_${campsiteId}`).emit("scout-joined-list", { scoutName, scoutAvatar });

    try {
      const joinNotif = new Notification({
        campsiteId,
        message: `A new Scout has breached the perimeter! Welcome ${scoutName}.`,
        scoutName,
        type: 'alert'
      });
      await joinNotif.save();
    } catch (err) {
      console.error("Error saving join notification:", err);
    }

    // 2. Explicitly target the campsite owner/admin socket connection with a banner notification
    if (adminEmail) {
      io.to(adminEmail).emit("campsite-admin-notification", {
        message: `A new Scout has breached the perimeter! Welcome ${scoutName}.`,
        scoutName
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🛑 Client disconnected: ${socket.id}`);
  });
});

const { ServerApiVersion } = require('mongodb');
const errorHandler = require('../middleware/errorHandler');

// Catch-all route for 404s
app.use((req, res, next) => {
  res.status(404).json({ error: 'API Route Not Found' });
});

// Apply centralized error handler
app.use(errorHandler);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ Failed to connect to MongoDB', err));

const PORT = process.env.PORT_CHAT || 5003;
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Chat Service running on port ${PORT}`);
  });
}

module.exports = { app, server };

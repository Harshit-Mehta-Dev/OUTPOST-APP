const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const supabase = require('./supabaseClient');
const { checkScoutPermission } = require('./utils/rbac');
const Notification = require('./models/Notification');
const { compressMediaPayload } = require('./utils/compression');

const mongoSanitize = require('express-mongo-sanitize');
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

// Setup Redis Adapter for multi-container orchestration (Only if REDIS_URL is explicitly provided)
if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

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
app.use(mongoSanitize());    // Prevent NoSQL Injection
app.use(xss());              // Prevent XSS Attacks

// 24/7 Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Operational', timestamp: new Date() });
});
// ------------------------------------

// 4. Rate Limiters

// Layer 1: Global DDoS Protection (100 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Layer 2: Anti-Brute Force for Auth (5 requests per minute)
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 5, 
  message: 'Too many login attempts from this IP, please try again after a minute'
});

// Layer 3: Database Strain Prevention for Searching/Fetching (30 requests per minute)
const dataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 30, 
  message: 'Too many data requests from this IP, please try again after a minute'
});

// Layer 4: Anti-Spam for Forms/Joining (10 requests per minute)
const actionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10, 
  message: 'Too many actions from this IP, please try again after a minute'
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

// Routes
const campsiteRoutes = require('./routes/campsites');
app.use('/api/campsites', campsiteRoutes);

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);
// Health Check for Keep-Alive
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

const Message = require('./models/Message');
const Campsite = require('./models/Campsite');
const User = require('./models/User');

// Messages Route
app.get('/api/messages/:channelKey', async (req, res) => {
  try {
    const messages = await Message.find({ channelKey: req.params.channelKey })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
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
    socket.join(email);
  });

  socket.on('join_user_room', (username) => {
    socket.join(`user-room-${username}`);
  });

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    try {
      // --- Phase 5: Media Compression Engine ---
      if (data.type === 'media' && data.body) {
        data.body = await compressMediaPayload(data.body, data.mediaType);
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
        pollData: data.pollData
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
        const campsite = await Campsite.findById(campsiteId);
        
        if (campsite && campsite.members) {
          campsite.members.forEach((memberUsername) => {
            if (memberUsername !== data.user.username) {
              let textPreview = data.type === 'text' ? data.text : (data.type === 'poll' ? '[Poll]' : '[Media]');
              if (textPreview && textPreview.length > 45) {
                textPreview = textPreview.substring(0, 45) + '...';
              }
              
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
      } catch (fanOutError) {
        console.error("Error broadcasting notification signal:", fanOutError);
      }
    } catch (err) {
      console.error("Error saving/broadcasting message:", err);
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

      const campsiteId = channelKey.split('_')[0];
      const hasPermission = await checkScoutPermission(username, campsiteId, 'canDeleteMessages');

      if (!hasPermission) {
        socket.emit("permission_denied", { message: "You do not have the clearance code to delete this message." });
        return;
      }

      await Message.findByIdAndDelete(messageId);
      io.to(channelKey).emit("message_deleted", { messageId, channelKey });
    } catch(err) {
      console.error("Error deleting message:", err);
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

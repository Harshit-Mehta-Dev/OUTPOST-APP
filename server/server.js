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

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // allow all frontend origins
    methods: ["GET", "POST"]
  }
});

// Security Middleware
// 1. Helmet to secure HTTP headers
app.use(helmet());

// 2. Trust Proxy (Required if hosting on Render, Heroku, or behind NGINX/K8s)
app.set('trust proxy', 1);

// 3. CORS and Body Parsing
app.use(cors());
app.use(express.json());

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

const Message = require('./models/Message');

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

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    try {
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

      // 2. Broadcast to everyone in the room (including sender to confirm)
      io.to(data.channelKey).emit('receive_message', {
        id: newMessage._id,
        user: newMessage.user,
        time: newMessage.time,
        type: newMessage.type,
        text: newMessage.text,
        mediaType: newMessage.mediaType,
        body: newMessage.body,
        pollData: newMessage.pollData,
        channelKey: newMessage.channelKey
      });
    } catch (err) {
      console.error("Error saving/broadcasting message:", err);
    }
  });

  // Catch and Broadcast "Scout is typing"
  socket.on("scout-typing-start", ({ channelId, scoutName }) => {
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
          
          io.to(channelKey).emit("broadcast-updated-vote", { messageId, optionIndex, scoutId, channelKey });
        }
      }
    } catch(err) {
      console.error("Error voting:", err);
    }
  });

  // Catch and Broadcast "Scout stopped typing"
  socket.on("scout-typing-stop", ({ channelId, scoutName }) => {
    socket.broadcast.to(channelId).emit("broadcast-typing-stop", { scoutName });
  });

  // Handle new scout joining a campsite
  socket.on("register-new-scout-join", ({ campsiteId, adminEmail, scoutName, scoutAvatar }) => {
    // 1. Tell everyone currently looking at the campsite to update their member lists
    io.to(`camp_${campsiteId}`).emit("scout-joined-list", { scoutName, scoutAvatar });

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

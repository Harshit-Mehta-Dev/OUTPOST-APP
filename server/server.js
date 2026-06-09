const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
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

// Middleware
app.use(cors());
app.use(express.json());

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
    // Leave previous rooms (except their own socket ID room)
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    
    socket.join(channelKey);
    console.log(`User ${socket.id} joined channel ${channelKey}`);
  });

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    try {
      // 1. Save to MongoDB
      const newMessage = new Message({
        channelKey: data.channelKey,
        user: data.user,
        time: data.time,
        text: data.text
      });
      await newMessage.save();

      // 2. Broadcast to everyone in the room (including sender to confirm)
      io.to(data.channelKey).emit('receive_message', {
        id: newMessage._id,
        user: newMessage.user,
        time: newMessage.time,
        text: newMessage.text,
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

  // Catch and Broadcast "Scout stopped typing"
  socket.on("scout-typing-stop", ({ channelId, scoutName }) => {
    socket.broadcast.to(channelId).emit("broadcast-typing-stop", { scoutName });
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

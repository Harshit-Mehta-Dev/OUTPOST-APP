const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger_output.json');
const svgCaptcha = require('svg-captcha');
const jwt = require('jsonwebtoken');
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
const supabase = require('./supabaseClient');
const { checkScoutPermission } = require('./utils/rbac');
const Notification = require('./models/Notification');
const { compressMediaPayload } = require('./utils/compression');

// Removed old requires
const morgan = require('morgan');

const { ServerApiVersion } = require('mongodb');

// MongoDB Connection — connect FIRST before any routes or sockets are registered
mongoose.connect(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ Failed to connect to MongoDB', err));

// MongoDB reconnect/disconnect event hooks
mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected. Mongoose will auto-reconnect...'));
mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected.'));
mongoose.connection.on('error', (err) => console.error('❌ MongoDB connection error:', err.message));

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
    const data = messageDoc.toObject ? messageDoc.toObject() : messageDoc;
    
    const { error } = await supabase.from('messages').insert([
      {
        user_id: data.user?.id || '00000000-0000-0000-0000-000000000000', // Mock UUID if none
        username: data.user?.username || 'Scout',
        content: data.text || '[Media/Poll]',
        channel: data.channelKey || 'community-chat'
      }
    ]);
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
  const redisOptions = {
    url: process.env.REDIS_URL,
    pingInterval: 10000,
    socket: { tls: process.env.REDIS_URL.startsWith('rediss://'), connectTimeout: 10000 }
  };
  const pubClient = createClient(redisOptions);
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => {
    // Only log non-timeout connection errors after initial startup
    if (redisClientForLimits && err.name !== 'ConnectionTimeoutError') {
      console.error('Redis Pub Client Error:', err.message);
    }
  });
  subClient.on('error', (err) => {
    if (redisClientForLimits && err.name !== 'ConnectionTimeoutError') {
      console.error('Redis Sub Client Error:', err.message);
    }
  });

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    // Only assign after successful connection — prevents rate-limiter from getting a disconnected client
    redisClientForLimits = pubClient;
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter connected to Socket.io');
  }).catch(err => console.error('Redis connection error:', err.message));
} else {
  console.log('ℹ️ REDIS_URL not provided. Socket.io running in standalone mode.');
}

// Security Middleware
// 1. Helmet to secure HTTP headers with strict policies
app.use(helmet({
  contentSecurityPolicy: false, // Turn off if it blocks your frontend dev server, but ideally configure it.
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true,
  frameguard: { action: 'deny' },
}));

// 1b. Basic Edge CDN Headers for GET requests (mitigates GET-based floods)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.includes('/api/auth/captcha')) {
    // Allow Cloudflare to cache for 30s, browser for 0s (always revalidate)
    res.set('Cache-Control', 'public, max-age=0, s-maxage=30');
  }
  next();
});

// 2. Trust Proxy (Required if hosting on Render, Heroku, or behind NGINX/K8s)
app.set('trust proxy', 1);

// 3. CORS and Body Parsing
const allowedOrigins = [
  'http://localhost:5173',
  'https://afb8f70f.outpost-app-a0c.pages.dev'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.pages.dev')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'QUERY'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Scout-Guardian Security Layer ---
const scoutGuardian = require('./middleware/scoutGuardian');
app.use(scoutGuardian);

// --- Phase 6: 24/7 Ops & Security ---
// 3.5. Logging & Sanitization
app.use(morgan('combined')); // Operational Logging
const { mongoSanitize, xssClean } = require('./middleware/security');
app.use(mongoSanitize); // Custom NoSQL Injection Protection
app.use(xssClean); // Custom Cross-Site Scripting (XSS) Protection

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
  max: parseInt(process.env.RATE_LIMIT_GLOBAL || 1000, 10), 
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  skip: (req, res) => {
    // Prevent ERR_ERL_DOUBLE_COUNT by skipping global limit on paths with specific limits
    const specificPaths = [
      '/api/users/login',
      '/api/users/register',
      '/api/campsites/join',
      '/api/campsites/create',
      '/api/campsites',
      '/api/messages'
    ];
    return specificPaths.some(path => req.originalUrl.startsWith(path));
  }
});

// Layer 2: Anti-Brute Force for Auth (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_AUTH || 5, 10), 
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  store: getStore(),
});

// Layer 3: Database Strain Prevention for Searching/Fetching (30 requests per minute)
const dataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_DATA || 300, 10), 
  message: 'Too many data requests from this IP, please try again after a minute',
  store: getStore(),
});

// Layer 4: Anti-Spam for Forms/Joining (10 requests per minute)
const actionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_ACTION || 10, 10), 
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

// Routes
const campsiteRoutes = require('./routes/campsites');
app.use('/api/campsites', campsiteRoutes);

const boardRoutes = require('./routes/board');
app.use('/api/board', boardRoutes);

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const operatorRoutes = require('./routes/operator');
app.use('/api/operator', operatorRoutes);

const helpRoutes = require('./routes/help');
app.use('/api/help', helpRoutes);

const feedbackRoutes = require('./routes/feedback');
app.use('/api/feedback', feedbackRoutes);

const aiRoutes = require('./routes/ai');
app.use('/api/ai', aiRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Captcha Endpoint
app.get('/api/auth/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 6,
    ignoreChars: '0o1i',
    noise: 2,
    color: true,
    background: '#2d3436'
  });
  
  // Sign the captcha text to verify later without session state
  const secret = process.env.JWT_SECRET || 'your_fallback_super_secure_sha256_string_here';
  const captchaId = jwt.sign({ text: captcha.text }, secret, { expiresIn: '5m' });
  
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json({ image: captcha.data, captchaId });
});

// Health Check for Keep-Alive
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

const Message = require('./models/Message');
const Campsite = require('./models/Campsite');
const User = require('./models/User');
const HelpRequest = require('./models/HelpRequest');
const cache = require('./middleware/cache');
const scoutVault = require('./utils/scoutVault');

// Advanced Message Search using modern HTTP QUERY method
app.use('/api/messages/search', async (req, res, next) => {
  if (req.method !== 'QUERY') return next();
  try {
    const filter = req.body; 
    if (!filter || Object.keys(filter).length === 0) {
      return res.status(400).json({ error: 'QUERY body must contain a valid filter' });
    }
    
    const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(50);
      
    // Scout-Vault: Decrypt messages
    const decryptedMessages = messages.map(msg => {
      const doc = msg.toObject ? msg.toObject() : msg;
      if (doc.encryptedData && doc.iv) {
        doc.text = scoutVault.decrypt(doc.encryptedData, doc.iv);
      }
      return doc;
    });
    
    res.setHeader('Accept-Query', 'application/json');
    res.json(decryptedMessages);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Pinned Messages Route
app.get('/api/messages/pins', async (req, res) => {
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

// Messages Route — requires a valid Supabase token
app.get('/api/messages/:channelKey', async (req, res) => {
  try {
    // Auth guard: verify Bearer token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    if (supabase) {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const messages = await Message.find({ channelKey: req.params.channelKey })
      .sort({ createdAt: 1 })
      .limit(100);
      
    // Scout-Vault: Decrypt messages in-flight before sending to client
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

// Socket.io DoS Protection (Rate Limiter)
const socketRateLimiters = new Map();
const SOCKET_RATE_LIMIT = 15; // Max events per window
const SOCKET_RATE_WINDOW = 10000; // 10 seconds

// Memory cleanup for stale rate limiters
setInterval(() => {
  const now = Date.now();
  for (const [socketId, data] of socketRateLimiters.entries()) {
    if (now - data.startTime > SOCKET_RATE_WINDOW * 2) {
      socketRateLimiters.delete(socketId);
    }
  }
}, 60000);

// Socket.io logic
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Anti-DoS Middleware applied to all incoming packets for this socket
  socket.use((packet, next) => {
    const eventName = packet[0];
    
    // Allow internal ping/pong if they somehow pass through here
    if (eventName === 'ping' || eventName === 'pong') return next();

    const now = Date.now();
    let rateData = socketRateLimiters.get(socket.id);

    if (!rateData) {
      rateData = { count: 1, startTime: now, warnings: 0 };
      socketRateLimiters.set(socket.id, rateData);
      return next();
    }

    if (now - rateData.startTime > SOCKET_RATE_WINDOW) {
      // Reset window
      rateData.count = 1;
      rateData.startTime = now;
      // Optional: decay warnings over time if they behave well
      if (rateData.warnings > 0) rateData.warnings--; 
      return next();
    }

    rateData.count++;

    if (rateData.count > SOCKET_RATE_LIMIT) {
      rateData.warnings++;
      console.warn(`[SECURITY] Socket DoS limit breached by ${socket.id} on event: ${eventName} (Strikes: ${rateData.warnings})`);
      
      if (rateData.warnings >= 3) {
        console.error(`[SECURITY] Auto-Disconnecting socket ${socket.id} for repeated rate limit abuse.`);
        socket.emit("permission_denied", { message: "Security Intervention: Connection severed due to extreme event rate. Please wait before reconnecting." });
        socket.disconnect(true);
        return next(new Error('Rate limit exceeded. Connection severed.'));
      }
      
      // Emits a warning to the user on the first/second strike
      socket.emit("server_alert", { message: "Warning: You are sending requests too quickly! Please slow down to prevent a ban." });
      return next(new Error('Rate limit exceeded. Request dropped.'));
    }

    next();
  });
  
  // Cleanup on disconnect
  socket.on('disconnect', () => {
    socketRateLimiters.delete(socket.id);
    console.log(`🛑 Client disconnected: ${socket.id}`);
  });

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

      // Scout-Vault: Encrypt text messages before saving to DB
      let encryptedData = null;
      let iv = null;
      let plainTextForBroadcast = data.text;
      
      if (data.type === 'text' && data.text) {
        const encryptedObj = scoutVault.encrypt(data.text);
        encryptedData = encryptedObj.encryptedData;
        iv = encryptedObj.iv;
      }

      // 1. Save to MongoDB (Optional fallback/legacy)
      const newMessage = new Message({
        channelKey: data.channelKey,
        user: data.user,
        time: data.time,
        type: data.type,
        text: encryptedData ? null : data.text, // Store null if encrypted, else legacy
        encryptedData: encryptedData,
        iv: iv,
        mediaType: data.mediaType,
        body: data.body,
        pollData: data.pollData,
        replyTo: data.replyTo
      });
      try {
        await newMessage.save();
      } catch (mongoErr) {
        console.warn('MongoDB offline or save failed. Proceeding with Supabase sync.');
      }
      
      // Pass the plaintext to Supabase for now, or keep it encrypted there too
      // If we encrypt it in Supabase, we send the encryptedData. Let's send the raw DB object so it stays encrypted.
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
          
          // Always emit xp_update to keep Scout Registry and sidebar in sync
          // This fires on EVERY message, not just level-ups
          io.to(`user-room-${userDoc.username}`).emit('xp_update', {
            level: userDoc.level,
            xp: userDoc.xp
          });
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
        text: plainTextForBroadcast, // Broadcast plaintext to active WebSockets so they can read it instantly
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

  // Catch and Broadcast "Scout is typing" — do NOT persist to DB (would create spam)
  socket.on("scout-typing-start", ({ channelId, scoutName }) => {
    socket.broadcast.to(channelId).emit("broadcast-typing-start", { scoutName });
  });

  socket.on("like_message", async ({ messageId, channelKey, username }) => {
    try {
      if (!username) return;
      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (!msg.likes) {
        msg.likes = [];
      }

      const likeIndex = msg.likes.indexOf(username);
      if (likeIndex > -1) {
        msg.likes.splice(likeIndex, 1);
      } else {
        msg.likes.push(username);
      }
      
      await Message.updateOne({ _id: messageId }, { $set: { likes: msg.likes } });
      syncMessageToSupabase(msg);

      io.to(channelKey).emit("message_liked", { messageId, channelKey, likes: msg.likes });
    } catch (err) {
      console.error("Error liking message:", err);
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
});

const errorHandler = require('./middleware/errorHandler');

// Catch-all route for 404s
app.use((req, res, next) => {
  res.status(404).json({ error: 'API Route Not Found' });
});
 
// Apply centralized error handler
app.use(errorHandler);

// MongoDB connection already established at the top of this file

const { trainModel } = require('./ai/nlpEngine');

// Trigger background training globally so it works for ALL microservices (apiService, chatService, etc)
trainModel().catch(err => console.error('❌ Failed to train NLP model in background:', err));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = { app, server };

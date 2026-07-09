const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
// Removed old requires
require('dotenv').config({ path: '../.env' });
const errorHandler = require('../middleware/errorHandler');

const app = express();

app.use(helmet());
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(morgan('combined'));
const { mongoSanitize, xssClean } = require('../middleware/security');
app.use(mongoSanitize);
app.use(xssClean);

// Limiters
const actionLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: 'Too many actions' });
const dataLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: 'Too many data requests' });

app.use('/api/campsites/join', actionLimiter);
app.use('/api/campsites/create', actionLimiter);
app.use('/api/campsites', dataLimiter);
app.use('/api/messages', dataLimiter);

// Routes
app.use('/api/campsites', require('../routes/campsites'));
app.use('/api/operator', require('../routes/operator'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/help', require('../routes/help'));
app.use('/api/feedback', require('../routes/feedback'));

// Message Route
const Message = require('../models/Message');
const cache = require('../middleware/cache');
app.get('/api/messages/:channelKey', cache(15), async (req, res) => {
  try {
    const messages = await Message.find({ channelKey: req.params.channelKey })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/health', (req, res) => res.status(200).json({ status: 'Operational (API)' }));

app.use((req, res, next) => res.status(404).json({ error: 'API Route Not Found' }));
app.use(errorHandler);

// Database
mongoose.connect(process.env.MONGODB_URI, { serverApi: { version: '1', strict: true, deprecationErrors: true } })
  .then(() => console.log('✅ API DB Connected'))
  .catch(err => console.error('❌ DB Error', err));

const PORT = process.env.PORT_API || 5002;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API Service on port ${PORT}`));
}
module.exports = { app };

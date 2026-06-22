const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config({ path: '../.env' });
const errorHandler = require('../middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger_output.json');
const basicAuth = require('express-basic-auth');

const app = express();

app.use(helmet());
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(morgan('combined'));

// API Docs
const docsAuth = basicAuth({
  users: { [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASS || 'admin' },
  challenge: true,
});
app.use('/api-docs', docsAuth, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Limiters
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: 'Too many login attempts' });
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// Routes
app.use('/api/users', require('../routes/users'));

app.get('/api/health', (req, res) => res.status(200).json({ status: 'Operational (Auth)' }));

app.use((req, res, next) => res.status(404).json({ error: 'API Route Not Found' }));
app.use(errorHandler);

// Database
mongoose.connect(process.env.MONGODB_URI, { serverApi: { version: '1', strict: true, deprecationErrors: true } })
  .then(() => console.log('✅ Auth DB Connected'))
  .catch(err => console.error('❌ DB Error', err));

const PORT = process.env.PORT_AUTH || 5001;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Auth Service on port ${PORT}`));
}
module.exports = { app };

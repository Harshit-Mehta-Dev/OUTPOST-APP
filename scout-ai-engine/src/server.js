/**
 * ==============================================================================
 * SCOUT AI ENGINE STANDALONE MICROSERVICE SERVER
 * ==============================================================================
 * Exposes high-speed RESTful inference endpoints for Scout AI with health monitoring,
 * D.I.S.M.W security telemetry, and status metrics.
 * ==============================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ScoutEngine = require('./index');

const app = express();
const PORT = process.env.SCOUT_AI_PORT || 5055;

app.use(cors());
app.use(express.json());

const engine = new ScoutEngine();

// Pre-warm the neural network
engine.initialize()
  .then(() => console.log('⚡ [Scout-AI Service] Ready on port ' + PORT))
  .catch(err => console.error('❌ Failed to initialize Scout Engine:', err));

// 1. Health check & Telemetry
app.get('/health', (req, res) => {
  res.json({
    status: 'Operational',
    service: 'Scout AI Autonomous Cognitive Engine',
    version: '1.0.0',
    layers: engine.net ? engine.net.layers : null,
    isTrained: engine.isTrained,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 2. Main Inference / Cognitive Process Endpoint
app.post('/api/think', async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Field "message" is required and must be a string.' });
    }

    const result = await engine.think(message, userId || 'anonymous_scout');
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Scout AI think error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. User Conversation Memory Management
app.get('/api/memory/:userId', (req, res) => {
  const { userId } = req.params;
  const context = engine.memory.getRecentContext(userId, 20);
  const facts = engine.memory.getAllFacts(userId);
  res.json({ success: true, userId, context, facts });
});

app.delete('/api/memory/:userId', (req, res) => {
  const { userId } = req.params;
  engine.memory.clearSession(userId);
  res.json({ success: true, message: `Session memory for ${userId} cleared.` });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Scout AI Autonomous Service listening at http://localhost:${PORT}`);
  });
}

module.exports = { app, engine };

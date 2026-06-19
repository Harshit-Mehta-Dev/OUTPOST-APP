const { createClient } = require('redis');

let redisClient;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis Cache Client Error', err));
  redisClient.connect().then(() => console.log('✅ Redis Cache connected')).catch(console.error);
}

const cache = (durationSeconds) => async (req, res, next) => {
  if (req.method !== 'GET') return next();
  if (!redisClient) return next();

  const key = `cache:${req.originalUrl}`;
  try {
    const cachedResponse = await redisClient.get(key);
    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cachedResponse));
    }
    
    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json;
    res.json = (body) => {
      // Don't cache error responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redisClient.setEx(key, durationSeconds, JSON.stringify(body)).catch(err => console.error('Cache Set Error:', err));
      }
      originalJson.call(res, body);
    };
    next();
  } catch (err) {
    console.error('Cache Middleware Error:', err);
    next();
  }
};

module.exports = cache;

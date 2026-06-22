const { createClient } = require('redis');

let redisClient;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis Cache Client Error', err));
  redisClient.connect().then(() => console.log('✅ Redis Cache connected')).catch(console.error);
}

const memoryCache = new Map();

const cache = (durationSeconds) => async (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `cache:${req.originalUrl}`;

  // REDIS CACHE PATH
  if (redisClient) {
    try {
      const cachedResponse = await redisClient.get(key);
      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT-REDIS');
        return res.json(JSON.parse(cachedResponse));
      }
      
      res.setHeader('X-Cache', 'MISS-REDIS');
      const originalJson = res.json;
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(key, durationSeconds, JSON.stringify(body)).catch(err => console.error('Cache Set Error:', err));
        }
        originalJson.call(res, body);
      };
      return next();
    } catch (err) {
      console.error('Redis Cache Middleware Error:', err);
      return next();
    }
  }

  // FALLBACK IN-MEMORY CACHE PATH
  const cachedData = memoryCache.get(key);
  if (cachedData && cachedData.expiresAt > Date.now()) {
    res.setHeader('X-Cache', 'HIT-MEMORY');
    return res.json(cachedData.data);
  }

  // Clear expired entry if it exists
  if (cachedData && cachedData.expiresAt <= Date.now()) {
    memoryCache.delete(key);
  }

  res.setHeader('X-Cache', 'MISS-MEMORY');
  const originalJson = res.json;
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      memoryCache.set(key, {
        data: body,
        expiresAt: Date.now() + (durationSeconds * 1000)
      });
    }
    originalJson.call(res, body);
  };
  next();
};

module.exports = cache;

const xss = require('xss');

const sanitizeObj = (obj) => {
  if (!obj) return obj;
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObj(item));
  }
  if (typeof obj === 'object' && obj !== null) {
    const cleaned = {};
    for (const key in obj) {
      // Remove keys starting with $ or containing .
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      cleaned[key] = sanitizeObj(obj[key]);
    }
    return cleaned;
  }
  return obj;
};

const xssCleanObj = (obj) => {
  if (!obj) return obj;
  if (typeof obj === 'string') return xss(obj);
  if (Array.isArray(obj)) {
    return obj.map(item => xssCleanObj(item));
  }
  if (typeof obj === 'object' && obj !== null) {
    const cleaned = {};
    for (const key in obj) {
      cleaned[key] = xssCleanObj(obj[key]);
    }
    return cleaned;
  }
  return obj;
};

// Express 5 compatible NoSQL Sanitizer
const mongoSanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeObj(req.body);
  if (req.params) req.params = sanitizeObj(req.params);
  // In Express 5, req.query is a getter. We mutate the object directly if possible.
  if (req.query) {
    try {
      for (const key in req.query) {
        if (key.startsWith('$') || key.includes('.')) {
          delete req.query[key];
        } else {
          req.query[key] = sanitizeObj(req.query[key]);
        }
      }
    } catch (e) {
      // Silent catch if query is immutable
    }
  }
  next();
};

// Express 5 compatible XSS Cleaner
const xssClean = (req, res, next) => {
  if (req.body) req.body = xssCleanObj(req.body);
  if (req.params) req.params = xssCleanObj(req.params);
  if (req.query) {
    try {
      for (const key in req.query) {
        req.query[key] = xssCleanObj(req.query[key]);
      }
    } catch (e) {}
  }
  next();
};

module.exports = {
  mongoSanitize,
  xssClean
};

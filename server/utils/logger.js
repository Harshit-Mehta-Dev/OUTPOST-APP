const isDev = process.env.NODE_ENV !== 'production';

const logger = {
  info: (msg, ...args) => {
    if (isDev) console.log(`[INFO] ${new Date().toLocaleTimeString()} - ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    console.warn(`[WARN] ⚠️ ${new Date().toLocaleTimeString()} - ${msg}`, ...args);
  },
  error: (msg, err, ...args) => {
    console.error(`[ERROR] ❌ ${new Date().toLocaleTimeString()} - ${msg}`, ...args);
    if (err && err.stack) {
      console.error(err.stack);
    } else if (err) {
      console.error(err);
    }
  },
  debug: (msg, ...args) => {
    if (isDev) console.debug(`[DEBUG] 🐛 ${new Date().toLocaleTimeString()} - ${msg}`, ...args);
  }
};

module.exports = logger;

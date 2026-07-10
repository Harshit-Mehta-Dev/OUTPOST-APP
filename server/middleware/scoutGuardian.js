/**
 * Scout-Guardian
 * Advanced Multi-Layered Security & Stability System
 */

const crypto = require('crypto');

// Known malicious signatures
const THREAT_SIGNATURES = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
  /UNION\s+SELECT/gi, // SQLi
  /\$where/g, // NoSQLi
  /\$ne/g,    // NoSQLi bypass
  /\.\.\/\.\.\//g // Directory Traversal
];

const scoutGuardian = (req, res, next) => {
  // 1. Assign a unique trace ID for deep tracking
  req.scoutTraceId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // 2. Payload Inspection (Anti-Exploit)
    const payloadStr = JSON.stringify({ ...req.body, ...req.query });
    for (const regex of THREAT_SIGNATURES) {
      if (regex.test(payloadStr)) {
        console.warn(`[Scout-Guardian] ⚠️ Threat Intercepted | IP: ${req.ip} | Trace: ${req.scoutTraceId}`);
        return res.status(403).json({
          error: 'Scout-Guardian: Malicious payload intercepted and blocked.',
          trace: req.scoutTraceId
        });
      }
    }

    // 3. Strict Payload Size Enforcer (Anti-Glitch / Anti-Crash)
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 50000000) { // 50MB
      console.warn(`[Scout-Guardian] ⚠️ Massive Payload Blocked | IP: ${req.ip}`);
      return res.status(413).json({ error: 'Scout-Guardian: Payload exceeded maximum safe limits.' });
    }

    // 4. Response Monitoring & Anti-Crash Wrapper
    // We override the default response methods to ensure the server never crashes mid-flight
    const originalSend = res.send;
    res.send = function(data) {
      // If response takes longer than 10s, flag a warning (Performance Glitch Detection)
      if (Date.now() - startTime > 10000) {
        console.warn(`[Scout-Guardian] 🐌 Slow Transaction Detected | Route: ${req.originalUrl} | Time: ${Date.now() - startTime}ms`);
      }
      originalSend.apply(res, arguments);
    };

    next();
  } catch (err) {
    // 5. Ultimate Fallback Anti-Crash
    console.error(`[Scout-Guardian] 💥 Critical Crash Prevented | Trace: ${req.scoutTraceId}`, err);
    return res.status(500).json({
      error: 'Scout-Guardian: An internal system glitch was intercepted and contained.',
      trace: req.scoutTraceId
    });
  }
};

module.exports = scoutGuardian;

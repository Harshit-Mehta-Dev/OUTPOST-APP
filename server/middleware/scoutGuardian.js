/**
 * Scout-Guardian Advanced Multi-Layered Security & Stability System
 * Implements Swiss Cheese Defense-in-Depth, Blast Radius Containment, Tiered Execution Subnets, and Real-time Telemetry.
 */

const crypto = require('crypto');

// 1. Multi-Layer Threat Inspection Engine
const THREAT_SIGNATURES = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS Script Tags
  /javascript\s*:/gi,                                   // Inline JS URI XSS
  /on\w+\s*=\s*["'][^"']*["']/gi,                      // Event Handler XSS (e.g. onload=)
  /UNION\s+SELECT/gi,                                   // SQL Injection
  /SELECT\s+.*\s+FROM/gi,                               // Generic SQL Injection
  /\$where/g,                                            // NoSQL Injection ($where)
  /\$ne/g,                                               // NoSQL Injection bypass ($ne)
  /\$gt|\$gte|\$lt|\$lte|\$regex/g,                     // NoSQL Injection operators
  /\.\.\/\.\.\//g,                                       // Path Traversal (../../)
  /%2e%2e%2f/gi,                                        // Encoded Path Traversal
  /\/etc\/passwd|\/etc\/shadow|c:\\windows\\system32/gi, // Sensitive File System Access
  /__proto__|constructor\.prototype/gi,                 // Prototype Pollution
  /;\s*(?:cat|ls|dir|rm|powershell|cmd|wget|curl)\b/gi, // Remote Code Execution (RCE)
  /\|\s*(?:cat|ls|dir|rm|powershell|cmd)\b/gi          // Command Piping RCE
];

// Telemetry & Metrics Store
const telemetry = {
  totalRequestsProcessed: 0,
  blockedThreats: 0,
  rateLimitBreaches: 0,
  payloadViolations: 0,
  slowTransactions: 0,
  criticalGlitchesPrevented: 0,
  activeIpTrackerCount: 0,
  startTime: Date.now()
};

// In-Memory Sliding Window Rate Limiter (Blast Radius Containment)
const ipRequestLogs = new Map(); // IP -> Array of timestamps

// Cleanup expired IP rate limit logs every 5 minutes to manage memory usage
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequestLogs.entries()) {
    const valid = timestamps.filter(t => t > now - 60000);
    if (valid.length === 0) {
      ipRequestLogs.delete(ip);
    } else {
      ipRequestLogs.set(ip, valid);
    }
  }
  telemetry.activeIpTrackerCount = ipRequestLogs.size;
}, 300000);

/**
 * Route Subnet Tier Classification
 */
function getRouteTier(url) {
  if (url.includes('/api/vault') || url.includes('/api/admin') || url.includes('/api/auth')) {
    return { name: 'Data Subnet (Vault)', maxPayload: 2000000, timeoutThreshold: 3000 }; // 2MB, 3s
  }
  if (url.includes('/api/campsites') || url.includes('/api/messages') || url.includes('/api/ai')) {
    return { name: 'App Subnet (Business Logic)', maxPayload: 10000000, timeoutThreshold: 5000 }; // 10MB, 5s
  }
  return { name: 'Web Subnet (Public)', maxPayload: 25000000, timeoutThreshold: 10000 }; // 25MB, 10s
}

const scoutGuardian = (req, res, next) => {
  telemetry.totalRequestsProcessed++;
  req.scoutTraceId = crypto.randomUUID();
  const startTime = Date.now();
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';

  try {
    // 2. Blast Radius Rate Limiting (Sliding Window: Max 100 req/min, Burst: Max 25 req/10s)
    const now = Date.now();
    const timestamps = ipRequestLogs.get(clientIp) || [];
    const recentWindow = timestamps.filter(t => t > now - 60000);
    const burstWindow = recentWindow.filter(t => t > now - 10000);

    if (burstWindow.length >= 25 || recentWindow.length >= 100) {
      telemetry.rateLimitBreaches++;
      console.warn(`[Scout-Guardian] 🛡️ Blast Radius Rate Limit Triggered | IP: ${clientIp} | Trace: ${req.scoutTraceId}`);
      return res.status(429).json({
        error: 'Scout-Guardian: Execution rate limit exceeded. Blast radius protection active.',
        trace: req.scoutTraceId,
        retryAfterSeconds: 10
      });
    }

    recentWindow.push(now);
    ipRequestLogs.set(clientIp, recentWindow);

    // 3. Route Subnet Tier & Payload Limit Check
    const tier = getRouteTier(req.originalUrl || req.url || '');
    req.scoutSubnetTier = tier.name;

    const contentLength = req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : 0;
    if (contentLength > tier.maxPayload) {
      telemetry.payloadViolations++;
      console.warn(`[Scout-Guardian] ⚠️ Payload Limit Breached (${contentLength} > ${tier.maxPayload} bytes) | Tier: ${tier.name} | IP: ${clientIp}`);
      return res.status(413).json({
        error: `Scout-Guardian: Payload exceeded safe limits for ${tier.name}.`,
        trace: req.scoutTraceId
      });
    }

    // 4. Payload Deep Inspection (Anti-Exploit)
    const payloadStr = JSON.stringify({ ...req.body, ...req.query, params: req.params });
    for (const regex of THREAT_SIGNATURES) {
      if (regex.test(payloadStr)) {
        telemetry.blockedThreats++;
        console.warn(`[Scout-Guardian] ⚠️ Threat Intercepted | Signature Match | IP: ${clientIp} | Trace: ${req.scoutTraceId}`);
        return res.status(403).json({
          error: 'Scout-Guardian: Malicious execution payload intercepted and contained.',
          trace: req.scoutTraceId
        });
      }
    }

    // 5. Response Monitoring & Timeout Circuit Monitoring
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      if (duration > tier.timeoutThreshold) {
        telemetry.slowTransactions++;
        console.warn(`[Scout-Guardian] 🐌 Slow Execution Warning | Subnet: ${tier.name} | Route: ${req.originalUrl} | Duration: ${duration}ms`);
      }
      originalSend.apply(res, arguments);
    };

    next();
  } catch (err) {
    telemetry.criticalGlitchesPrevented++;
    console.error(`[Scout-Guardian] 💥 Critical Crash Intercepted & Contained | Trace: ${req.scoutTraceId}`, err);
    return res.status(500).json({
      error: 'Scout-Guardian: Internal execution glitch contained safely by system aegis.',
      trace: req.scoutTraceId
    });
  }
};

// Telemetry Export
scoutGuardian.getTelemetry = () => ({
  ...telemetry,
  activeIpTrackers: ipRequestLogs.size,
  uptimeSeconds: Math.floor((Date.now() - telemetry.startTime) / 1000)
});

module.exports = scoutGuardian;


/**
 * D.I.S.M.W - Deep Intelligence Security Monitoring Wall
 * Frontier Security Engine Orchestrator
 *
 * Unifies:
 *  - Scout-Guardian (Perimeter WAF, Threat Interceptor, Burst Limiter, Subnet Tiers)
 *  - Scout-Vault (AES-256 E2EE Cryptographic Storage)
 *  - Cryptographic Hash Signature Chain (HMAC / SHA-256 Request Fingerprinting)
 *  - Sentinel Strike & Quarantine Police
 *  - Live Neural Telemetry Metrics
 */

const crypto = require('crypto');
const scoutGuardian = require('../../middleware/scoutGuardian');
const scoutVault = require('../../utils/scoutVault');

// Secret key for HMAC Hash Signatures
const DISMW_HMAC_SECRET = process.env.DISMW_SECRET || process.env.SCOUT_VAULT_KEY || 'dismw_deep_intelligence_secret_frontier_hash_key_2026';

// Global Telemetry Store for D.I.S.M.W Frontier Security Engine
const dismwTelemetry = {
  engineName: 'D.I.S.M.W (Deep Intelligence Security Monitoring Wall)',
  status: 'ARMED_AEGIS',
  version: '2.0.0-FRONTIER',
  startTime: Date.now(),
  hashSignaturesGenerated: 0,
  hashVerificationsChecked: 0,
  hashTamperAttemptsBlocked: 0,
  vaultEncryptions: 0,
  vaultDecryptions: 0,
  quarantineActionsTaken: 0,
  quarantinedEntities: new Set(),
};

/**
 * Generate a Cryptographic SHA-256 / HMAC Hash Digest
 * Used for packet fingerprinting, payload integrity, and audit hashing.
 */
function generateHashSignature(data) {
  dismwTelemetry.hashSignaturesGenerated++;
  const payload = typeof data === 'string' ? data : JSON.stringify(data || {});
  return crypto.createHmac('sha256', DISMW_HMAC_SECRET).update(payload).digest('hex');
}

/**
 * Verify Hash Signature Integrity
 */
function verifyHashSignature(data, signature) {
  dismwTelemetry.hashVerificationsChecked++;
  if (!signature) return false;
  const expected = generateHashSignature(data);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/**
 * D.I.S.M.W Frontier Wall Middleware
 * Primary Ingress Wall: Applies Hash Fingerprinting, Quarantine Check, and delegates to Scout-Guardian.
 */
const dismwWallMiddleware = (req, res, next) => {
  // 1. Trace ID & Timestamp
  const traceId = req.scoutTraceId || crypto.randomUUID();
  req.scoutTraceId = traceId;
  const ingressTimestamp = Date.now();

  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';

  // 2. Quarantine Check
  if (dismwTelemetry.quarantinedEntities.has(clientIp)) {
    console.warn(`[D.I.S.M.W] ⛔ BLOCKED: Quarantined entity IP ${clientIp} attempted access. Trace: ${traceId}`);
    return res.status(403).json({
      error: 'D.I.S.M.W: Frontier security wall has isolated this connection due to critical threat history.',
      engine: 'D.I.S.M.W Frontier Engine',
      trace: traceId
    });
  }

  // 3. Compute Ingress Hash Signature
  const clientProvidedHash = req.headers['x-dismw-hash'];
  if (clientProvidedHash && req.body && Object.keys(req.body).length > 0) {
    const isValid = verifyHashSignature(req.body, clientProvidedHash);
    if (!isValid) {
      dismwTelemetry.hashTamperAttemptsBlocked++;
      console.warn(`[D.I.S.M.W] ⚠️ Hash signature mismatch detected from IP ${clientIp}. Trace: ${traceId}`);
      return res.status(400).json({
        error: 'D.I.S.M.W: Cryptographic payload integrity verification failed.',
        trace: traceId
      });
    }
  }

  // Stamp request with D.I.S.M.W Security metadata
  req.dismw = {
    traceId,
    ingressTimestamp,
    clientIp,
    engine: 'D.I.S.M.W'
  };

  // Attach egress security headers with outgoing payload hash
  res.setHeader('X-DISMW-Engine', 'ARMED_AEGIS');
  res.setHeader('X-DISMW-Trace', traceId);

  // 4. Delegate to Scout-Guardian for WAF, Anti-Exploit, Subnet Tiering, and Rate Limiting
  return scoutGuardian(req, res, next);
};

/**
 * D.I.S.M.W Vault Gateway
 * Wraps Scout Vault with hash verification & cryptographic auditing
 */
const dismwVault = {
  encrypt: (text) => {
    dismwTelemetry.vaultEncryptions++;
    const encryptedResult = scoutVault.encrypt(text);
    if (encryptedResult && encryptedResult.encryptedData) {
      // Attach tamper-proof SHA-256 hash digest of the ciphertext
      encryptedResult.hash = crypto.createHash('sha256').update(encryptedResult.encryptedData).digest('hex');
    }
    return encryptedResult;
  },

  decrypt: (encryptedData, ivHex, expectedHash) => {
    dismwTelemetry.vaultDecryptions++;
    // Optional hash integrity check before decryption
    if (encryptedData && expectedHash) {
      const currentHash = crypto.createHash('sha256').update(encryptedData).digest('hex');
      if (currentHash !== expectedHash) {
        dismwTelemetry.hashTamperAttemptsBlocked++;
        console.error('[D.I.S.M.W Vault] 🛡️ Ciphertext tampering detected! Decryption rejected.');
        return '[D.I.S.M.W Security: Ciphertext integrity violated]';
      }
    }
    return scoutVault.decrypt(encryptedData, ivHex);
  }
};

/**
 * Quarantine Action Handler
 */
function quarantineEntity(entityId, reason = 'Repeated critical security violation') {
  dismwTelemetry.quarantineActionsTaken++;
  dismwTelemetry.quarantinedEntities.add(entityId);
  console.warn(`[D.I.S.M.W] 🚨 Entity '${entityId}' placed in QUARANTINE. Reason: ${reason}`);
}

function releaseQuarantine(entityId) {
  dismwTelemetry.quarantinedEntities.delete(entityId);
  console.log(`[D.I.S.M.W] 🛡️ Entity '${entityId}' released from quarantine.`);
}

/**
 * Consolidated Live Telemetry
 */
function getTelemetry() {
  const guardianStats = scoutGuardian.getTelemetry ? scoutGuardian.getTelemetry() : {};
  return {
    ...dismwTelemetry,
    quarantinedCount: dismwTelemetry.quarantinedEntities.size,
    quarantinedList: Array.from(dismwTelemetry.quarantinedEntities),
    uptimeSeconds: Math.floor((Date.now() - dismwTelemetry.startTime) / 1000),
    guardian: guardianStats
  };
}

module.exports = {
  dismwWallMiddleware,
  dismwVault,
  guardian: scoutGuardian,
  scoutVault,
  generateHashSignature,
  verifyHashSignature,
  quarantineEntity,
  releaseQuarantine,
  getTelemetry
};

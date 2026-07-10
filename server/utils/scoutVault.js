const crypto = require('crypto');

// The master vault key should be exactly 32 bytes (256 bits) for AES-256.
// If the env variable is not set or is the wrong size, we hash whatever is there or generate a fallback.
function getMasterKey() {
  const rawKey = process.env.SCOUT_VAULT_KEY || 'default_outpost_secure_vault_key_that_is_long_enough';
  // Hash it to ensure it's exactly 32 bytes
  return crypto.createHash('sha256').update(String(rawKey)).digest();
}

const ALGORITHM = 'aes-256-cbc';
const MASTER_KEY = getMasterKey();

const scoutVault = {
  /**
   * Encrypts a plaintext message using AES-256-CBC.
   * @param {string} text - The plaintext message.
   * @returns {Object} { iv: string, encryptedData: string }
   */
  encrypt: (text) => {
    if (!text) return { iv: null, encryptedData: null };
    
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
      };
    } catch (err) {
      console.error('🛡️ Scout-Vault Encryption Error:', err.message);
      // Fallback in case of crypto failure to avoid data loss, though highly unlikely
      return { iv: null, encryptedData: text };
    }
  },

  /**
   * Decrypts a ciphertext message using AES-256-CBC.
   * @param {string} encryptedData - The hex ciphertext.
   * @param {string} ivHex - The hex Initialization Vector.
   * @returns {string} The original plaintext message.
   */
  decrypt: (encryptedData, ivHex) => {
    if (!encryptedData || !ivHex) return encryptedData || ''; // Fallback for legacy plaintext messages
    
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (err) {
      console.error('🛡️ Scout-Vault Decryption Error:', err.message);
      // Return a safe fallback string if decryption fails (e.g. key changed)
      return '[Message corrupted or encrypted with an older key]';
    }
  }
};

module.exports = scoutVault;

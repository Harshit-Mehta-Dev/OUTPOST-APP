const jwt = require('jsonwebtoken');

/**
 * Verifies either the Cloudflare Turnstile token or the SVG Captcha text.
 */
async function verifyCaptcha(req) {
  const { turnstileToken, captchaText, captchaId } = req.body;

  // 1. If Turnstile Token is provided and Secret Key exists, verify Turnstile
  if (turnstileToken && process.env.TURNSTILE_SECRET_KEY) {
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(turnstileToken)}`
      });
      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error('Turnstile verification error:', err);
      return false; // Fallthrough to false if Turnstile explicitly failed
    }
  }

  // 2. Fallback to SVG Captcha
  if (captchaText && captchaId) {
    try {
      const secret = process.env.JWT_SECRET || 'your_fallback_super_secure_sha256_string_here';
      const decoded = jwt.verify(captchaId, secret);
      
      // Case-insensitive comparison
      if (decoded.text.toLowerCase() === captchaText.toLowerCase()) {
        return true;
      }
    } catch (err) {
      console.error('SVG Captcha verification error (expired or invalid):', err.message);
      return false;
    }
  }

  return false;
}

module.exports = { verifyCaptcha };

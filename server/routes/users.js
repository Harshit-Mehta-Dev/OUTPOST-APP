const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const supabase = require('../supabaseClient');
const requireAuth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const validate = require('../middleware/validate');
const userValidation = require('../validations/user.validation');
const { verifyCaptcha } = require('../utils/captcha');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Helper to push user backups to Supabase
const syncToSupabase = async (userDoc) => {
  try {
    if (!supabase) return;
    const { _id, password, __v, ...data } = userDoc.toObject ? userDoc.toObject() : userDoc;
    const { error } = await supabase.from('users').upsert(
      { email: data.email, ...data }, 
      { onConflict: 'email' }
    );
    if (error) {
      if (error.message.includes('Could not find the table')) {
        console.warn('Supabase User Backup Skipped: Table "users" does not exist.');
      } else {
        console.error('Supabase User Backup Error:', error.message);
      }
    }
  } catch (err) {
    console.error('Supabase User Backup Exception:', err.message);
  }
};

// POST /api/users/sync
// Find user by email. If they don't exist, create them. (For Google Auth)
router.post('/sync', validate(userValidation.syncUser), async (req, res) => {
  try {
    const { email, username } = req.body;
    
    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email, username });
      await user.save();
      syncToSupabase(user);
    }

    const userToReturn = user.toObject ? user.toObject() : user;
    const token = jwt.sign(
      { id: userToReturn._id, email: userToReturn.email, username: userToReturn.username, isGloballyRestricted: userToReturn.isGloballyRestricted },
      process.env.JWT_SECRET || 'your_fallback_super_secure_sha256_string_here',
      { expiresIn: '7d' }
    );
    
    res.json({ ...userToReturn, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/register
// Register with email, username, and password
router.post('/register', validate(userValidation.registerUser), async (req, res) => {
  try {
    const isHuman = await verifyCaptcha(req);
    if (!isHuman) {
      return res.status(403).json({ message: 'CAPTCHA verification failed. Please try again.' });
    }

    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Please provide all fields' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ email, username, password: hashedPassword });
    await user.save();
    syncToSupabase(user);
    
    const userToReturn = user.toObject();
    delete userToReturn.password;
    const token = jwt.sign(
      { id: userToReturn._id, email: userToReturn.email, username: userToReturn.username, isGloballyRestricted: userToReturn.isGloballyRestricted },
      process.env.JWT_SECRET || 'your_fallback_super_secure_sha256_string_here',
      { expiresIn: '7d' }
    );
    res.json({ ...userToReturn, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login
// Login with email and password
router.post('/login', validate(userValidation.loginUser), async (req, res) => {
  try {
    const isHuman = await verifyCaptcha(req);
    if (!isHuman) {
      return res.status(403).json({ message: 'CAPTCHA verification failed. Please try again.' });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'This account uses Google Sign-In. Please sign in with Google or reset your password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const userToReturn = user.toObject();
    delete userToReturn.password;
    const token = jwt.sign(
      { id: userToReturn._id, email: userToReturn.email, username: userToReturn.username, isGloballyRestricted: userToReturn.isGloballyRestricted },
      process.env.JWT_SECRET || 'your_fallback_super_secure_sha256_string_here',
      { expiresIn: '7d' }
    );
    res.json({ ...userToReturn, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/profile
// Update user profile (username, profilePictureUrl, passwords)
router.put('/profile', requireAuth, validate(userValidation.updateProfile), async (req, res) => {
  try {
    const { email, username, profilePictureUrl, currentPassword, newPassword } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required to update profile' });
    }

    // Access Control: Users can only update their own profile
    if (req.user.email !== email && req.user.role !== 'admin' && req.user.role !== 'Commander') {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // User doesn't exist in DB yet (legacy login), create them
      user = new User({ email, username });
      await user.save();
    }

    const updates = { username, profilePictureUrl };

    // Handle password change
    if (currentPassword && newPassword) {
      if (!user.password) {
        // If they signed up with Google, they might not have a password yet.
        // We'll just set it without requiring old password match.
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(newPassword, salt);
      } else {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid current password' });
        }
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(newPassword, salt);
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (updatedUser) syncToSupabase(updatedUser);

    // Don't send password back
    const userToReturn = updatedUser.toObject();
    delete userToReturn.password;

    res.json(userToReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:email/disable
// Temporarily disable user account
router.patch('/:email/disable', requireAuth, async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: 'Email is required to disable account' });
    }

    // Access Control: Users can only disable their own account unless admin
    if (req.user.email !== email && req.user.role !== 'admin' && req.user.role !== 'Commander') {
      return res.status(403).json({ error: 'Forbidden: You can only disable your own account' });
    }

    const disabledUser = await User.findOneAndUpdate(
      { email },
      { $set: { disabled: true } },
      { returnDocument: 'after' }
    );
    
    if (!disabledUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User disabled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:email
// Permanently delete user account
router.delete('/:email', requireAuth, async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: 'Email is required to delete profile' });
    }

    // Access Control: Users can only delete their own account unless admin
    if (req.user.email !== email && req.user.role !== 'admin' && req.user.role !== 'Commander') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own account' });
    }

    const deletedUser = await User.findOneAndDelete({ email });
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:username/alerts
// Fetch system alerts for a user
router.get('/:username/alerts', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user.systemAlerts || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:username/alerts
// Clear all system alerts for a user
router.delete('/:username/alerts', requireAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOneAndUpdate(
      { username },
      { $set: { systemAlerts: [] } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ message: 'Alerts cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/global-restrict
// Developer only: globally ban a user from creating camps or channels
router.put('/global-restrict', requireAuth, async (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (!req.user || !req.user.email || req.user.email.toLowerCase().trim() !== 'harshitmehta1012@gmail.com') {
      return res.status(403).json({ error: 'Only the Developer can issue a Global Ban.' });
    }
    
    const user = await User.findOneAndUpdate(
      { username: targetUsername },
      { $set: { isGloballyRestricted: true } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Emit event to notify the banned user globally
    req.io.emit('global-restricted', { targetUsername });

    res.json({ message: `${targetUsername} has been globally restricted from creating outposts and expeditions.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me
// Fetch the currently logged-in user's fresh data (XP, Level, etc.)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = req.user.id || req.user.sub;
    
    let user = null;
    // Only attempt findById if userId is a valid MongoDB ObjectId
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).select('-password -twoFactorSecret -resetPasswordToken -resetPasswordExpires');
    }
    
    if (!user && req.user.email) {
      // Fallback: find by email if ID doesn't work (e.g. Supabase auth UUIDs)
      user = await User.findOne({ email: req.user.email }).select('-password -twoFactorSecret -resetPasswordToken -resetPasswordExpires');
    }
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users
// Fetch all users (for Outpost HQ Developer access)
router.get('/', requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, 'username email isGloballyRestricted disabled');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/2fa/setup
// Generate a 2FA secret and QR code for the user
router.post('/2fa/setup', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secret = speakeasy.generateSecret({ name: `Outpost Basecamp (${user.email})` });
    user.twoFactorSecret = secret.base32;
    await user.save();

    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) return res.status(500).json({ error: 'Error generating QR code' });
      res.json({ qrCodeUrl: data_url, secret: secret.base32 });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/2fa/verify
// Verify the code and enable 2FA
router.post('/2fa/verify', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret) return res.status(400).json({ error: '2FA setup not initiated' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 step (30 seconds) before or after to account for time drift
    });

    if (verified) {
      user.isTwoFactorEnabled = true;
      await user.save();
      syncToSupabase(user);
      
      const userToReturn = user.toObject();
      delete userToReturn.password;
      
      res.json({ message: '2FA enabled successfully', user: userToReturn });
    } else {
      res.status(400).json({ error: 'Invalid 2FA code' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/forgot-password
// Send password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const isHuman = await verifyCaptcha(req);
    if (!isHuman) {
      return res.status(403).json({ message: 'CAPTCHA verification failed. Please try again.' });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Case-insensitive exact match for email
    const user = await User.findOne({ email: new RegExp('^' + email + '$', 'i') });

    if (!user) {
      console.log(`[Forgot Password] User not found in database. Skipping email for: ${email}`);
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'hello.outpostbasecamp@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD || ''
      },
      // Force IPv4 specifically for nodemailer to bypass Render's IPv6 block
      // This allows the rest of the application to securely use IPv6!
      family: 4
    });

    const resetUrl = `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const mailOptions = {
      from: '"Outpost Basecamp" <hello.outpostbasecamp@gmail.com>',
      to: user.email,
      subject: 'Outpost - Password Reset',
      text: `You requested a password reset for Outpost Basecamp.\n\nPlease click the link below to reset your password. You will need your Google Authenticator code.\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.\nThis link expires in 15 minutes.`
    };

    if (process.env.EMAIL_APP_PASSWORD) {
      console.log(`[Forgot Password] Attempting to send email to ${user.email} using App Password...`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Forgot Password] Email sent successfully! Message ID: ${info.messageId}`);
    } else {
      console.log("[Forgot Password] ERROR: EMAIL_APP_PASSWORD is not set in environment variables! Mock Email Sent:", mailOptions);
    }

    // Always return a generic success message to prevent email enumeration (unless debugging)
    res.json({ message: 'If that email exists in our system, a password reset link has been sent.' });

  } catch (err) {
    console.error('[Forgot Password] ERROR during email sending:', err);
    // Ensure we always return a response to prevent the client from hanging forever
    if (!res.headersSent) {
      res.json({ message: 'If that email exists in our system, a password reset link has been sent.' });
    }
  }
});

// POST /api/users/reset-password
// Reset password using token and 2FA code
router.post('/reset-password', async (req, res) => {
  try {
    const { token, twoFactorCode, newPassword } = req.body;
    if (!token || !twoFactorCode || !newPassword) {
      return res.status(400).json({ error: 'Token, 2FA code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    // Verify 2FA only if it's enabled for this user
    if (user.isTwoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        return res.status(400).json({ error: '2FA code is required' });
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode
      });

      if (!verified) {
        return res.status(400).json({ error: 'Invalid 2FA code' });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    syncToSupabase(user); // Backup to supabase

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Developer-only: Purge test messages (HELLO etc.) from all channels
router.delete('/admin/purge-test-messages', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.username.toLowerCase() !== 'harshit mehta') {
      return res.status(403).json({ error: 'Developer access only.' });
    }
    const Message = require('../models/Message');
    const result = await Message.deleteMany({ text: /^hello$/i });
    res.json({ message: `Purged ${result.deletedCount} test message(s).` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const User = require('../models/User');

async function requireAdmin(req, res, next) {
  try {
    // req.user is set by the requireAuth middleware which must run before this
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Access Denied: Not authenticated' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    console.error('Admin Auth Error:', err);
    return res.status(500).json({ error: 'Internal server error during admin validation' });
  }
}

module.exports = requireAdmin;

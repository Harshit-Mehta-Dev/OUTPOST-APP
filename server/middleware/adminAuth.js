const User = require('../models/User');

async function requireAdmin(req, res, next) {
  try {
    // req.user is set by the requireAuth middleware which must run before this
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Access Denied: Not authenticated' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Harshit's email is hardcoded as the ultimate God Admin for safety, 
    // or anyone with level 99.
    if (user.email === 'harshitmehta1012@gmail.com' || user.level >= 99) {
      req.adminUser = user;
      next();
    } else {
      return res.status(403).json({ error: 'Access Denied: Requires Administrator Privileges' });
    }
  } catch (err) {
    console.error('Admin Auth Error:', err);
    return res.status(500).json({ error: 'Internal server error during admin validation' });
  }
}

module.exports = requireAdmin;

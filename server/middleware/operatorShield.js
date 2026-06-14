const User = require("../models/User");

const OPERATOR_EMAIL = "harshitmehta1012@gmail.com";

async function verifyOperatorAuthority(req, res, next) {
  try {
    // Check for the custom security header passed by the frontend
    const requestEmail = req.headers['x-operator-email'];
    const requestId = req.headers['x-operator-id'];

    if (!requestEmail || requestEmail.toLowerCase().trim() !== OPERATOR_EMAIL.toLowerCase()) {
      return res.status(403).json({ 
        error: "CRITICAL EXCEPTION: Operator privileges required. Execution terminated." 
      });
    }

    if (!requestId) {
      return res.status(403).json({ 
        error: "CRITICAL EXCEPTION: Missing operator identification token. Execution terminated." 
      });
    }

    // Secondary validation: Ensure this user actually exists in the DB and the ID matches
    const user = await User.findOne({ email: requestEmail, _id: requestId });
    
    if (!user) {
      return res.status(403).json({ 
        error: "CRITICAL EXCEPTION: Valid operator footprint not found. Execution terminated." 
      });
    }
    
    // Attach operator info to req just in case downstream needs it
    req.operator = user;
    next(); // Pass verification checks cleanly
  } catch (err) {
    console.error("Operator Shield Error:", err);
    res.status(500).json({ error: "Internal security shield failure." });
  }
}

module.exports = { verifyOperatorAuthority, OPERATOR_EMAIL };

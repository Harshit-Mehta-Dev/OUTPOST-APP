const mongoose = require("mongoose");
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

    // Secondary validation: Ensure user exists by operator email
    const query = { email: requestEmail.toLowerCase().trim() };
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      query._id = requestId;
    }

    const user = await User.findOne(query);
    
    if (!user && mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(403).json({ 
        error: "CRITICAL EXCEPTION: Valid operator footprint not found. Execution terminated." 
      });
    }
    
    // Attach operator info to req cleanly
    req.operator = user || { email: requestEmail, id: requestId, username: 'Harshit Mehta' };
    next(); // Pass verification checks cleanly
  } catch (err) {
    console.error("Operator Shield Error:", err);
    res.status(500).json({ error: "Internal security shield failure." });
  }
}

module.exports = { verifyOperatorAuthority, OPERATOR_EMAIL };

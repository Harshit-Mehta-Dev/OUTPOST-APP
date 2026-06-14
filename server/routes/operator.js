const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Message = require("../models/Message");
const Campsite = require("../models/Campsite");
const { verifyOperatorAuthority } = require("../middleware/operatorShield");

// 💥 OVERRIDE 1: Master Message Erasure
router.delete("/erase-message/:id", verifyOperatorAuthority, async (req, res) => {
  try {
    const messageId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid signal signature." });
    }
    const targetMessage = await Message.findById(messageId);
    
    if (!targetMessage) return res.status(404).json({ error: "Target signal data not located." });

    // We can either permanently delete or set a flag. The user requested permanently deleting the record.
    await Message.findByIdAndDelete(messageId);

    // Dynamic replacement broadcast structure text
    const placeholderText = "SYSTEM DECREE: Our Operator has decided to delete this message under community violation guidelines.";

    // Real-time fan-out across WebSockets to every single connected browser view
    if (req.io) {
      req.io.to(targetMessage.channelKey).emit("operator-erasure-cascade", {
        messageId: messageId,
        replacementText: placeholderText
      });
    }

    res.status(200).json({ success: true, message: "Target signal purged cleanly from Atlas." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 💥 OVERRIDE 2: Master Campsite Decommission
router.delete("/decommission-campsite/:id", verifyOperatorAuthority, async (req, res) => {
  try {
    const campsiteId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(campsiteId)) {
      return res.status(400).json({ error: "Invalid cluster footprint." });
    }

    // Retrieve campsite to get members before deletion
    const targetCampsite = await Campsite.findById(campsiteId);
    if (!targetCampsite) return res.status(404).json({ error: "Target campsite not found." });

    const membersToAlert = targetCampsite.members || [];
    const campsiteName = targetCampsite.name || "Unknown Campsite";

    // Push persistent alert to all members and the admin
    if (membersToAlert.length > 0 || targetCampsite.adminEmail) {
      const User = require("../models/User");
      
      const query = [];
      if (membersToAlert.length > 0) query.push({ username: { $in: membersToAlert } });
      if (targetCampsite.adminEmail) query.push({ email: targetCampsite.adminEmail });

      if (query.length > 0) {
        await User.updateMany(
          { $or: query },
          { 
            $push: { 
              systemAlerts: { 
                campsiteName: campsiteName, 
                message: "Our Operator has decided to delete this group under community violation guidelines." 
              } 
            } 
          }
        );
      }
    }

    // Purge the server and all messages inside it permanently
    await Campsite.findByIdAndDelete(campsiteId);
    // Because messages use channelKey (e.g. `campsiteId_channelId`), we delete by matching the prefix
    await Message.deleteMany({ channelKey: { $regex: `^${campsiteId}_` } });

    // Tell the frontend socket room to instantly kick all users out of the view layout
    if (req.io) {
      req.io.to(`camp_${campsiteId}`).emit("operator-basecamp-purge", {
        message: "⚠️ CRITICAL DECREE: This whole basecamp has been permanently deleted by the developer under community violation guidelines."
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

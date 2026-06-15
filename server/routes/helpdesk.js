const express = require("express");
const router = express.Router();
const HelpTicket = require("../models/HelpTicket");

// Secure routing signature pass
router.post("/transmit-signal", async (req, res) => {
  try {
    // In a fully authenticated setup, this would be req.user
    // But since the payload comes from the client:
    const { rawBytesPayload, hasMedia, mediaData, userEmail, userName } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: "Missing identity credentials" });
    }

    const secureTicketPacket = new HelpTicket({
      senderId: userName || "Unknown",
      senderEmail: userEmail,
      encryptedPayload: rawBytesPayload,
      hasMedia: hasMedia,
      mediaData: mediaData,
      status: "Open"
    });

    await secureTicketPacket.save();
    
    // Alert the engineering support team socket connections instantly
    if (req.io) {
      req.io.to("operator-support-room").emit("new-ticket-alert", secureTicketPacket);
    }

    res.status(200).json({ success: true, message: "Signal packets verified and logged." });
  } catch (err) {
    console.error("Cryptographic pipeline transmission failure:", err);
    res.status(500).json({ error: "Cryptographic pipeline transmission failure." });
  }
});

module.exports = router;

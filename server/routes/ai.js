const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Message = require('../models/Message');
const dismw = require('../security/dismw');
const scoutVault = dismw.dismwVault;
const { processMessage } = require('../ai/nlpEngine');
const AI_BOT_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=Ai-Scout&backgroundColor=4facfe';

const supabase = require('../supabaseClient');
const syncMessageToSupabase = async (messageDoc) => {
  try {
    if (!supabase) return;
    const { _id, __v, ...data } = messageDoc.toObject ? messageDoc.toObject() : messageDoc;
    await supabase.from('messages').upsert({ id: _id.toString(), ...data }, { onConflict: 'id' });
  } catch (err) {
    console.error('Supabase sync error:', err.message);
  }
};

// Helper: format AI message for frontend without saving to DB
const broadcastAiMessage = (text) => {
  return {
    channelKey: '1_Ai-Scout',
    user: { username: 'Ai-Scout', profilePictureUrl: AI_BOT_AVATAR, level: 99 },
    text: text,
    time: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: 'text'
  };
};

// In-memory strike tracker for security guardrail
const securityStrikes = new Map();

router.post('/chat', requireAuth, async (req, res) => {
  const io = req.io;

  try {
    const { message, channelKey } = req.body;

    if (channelKey !== '1_Ai-Scout') {
      return res.status(403).json({ error: 'AI Assistant can only be accessed from #Ai-Scout.' });
    }
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const aiResult = await processMessage(message);
    let aiText = typeof aiResult === 'object' ? aiResult.answer : aiResult;

    // --- 3-STRIKE SECURITY LOGIC ---
    if (typeof aiResult === 'object' && aiResult.isSecurityThreat) {
      const username = req.user.username;
      let strikes = (securityStrikes.get(username) || 0) + 1;
      securityStrikes.set(username, strikes);
      
      console.warn(`[SECURITY ALERT] User ${username} triggered security guardrail. Strike ${strikes}/3`);

      if (strikes >= 3) {
        // Place user into D.I.S.M.W quarantine
        dismw.quarantineEntity(username, '3-Strike AI Safety & Security violation');

        // Trigger force logout
        io.to(`user-room-${username}`).emit('force_logout', { 
          reason: 'D.I.S.M.W Security Intervention: Multiple safety protocol violations. You have been quarantined and logged out.' 
        });
        
        // Reset strikes after logout
        securityStrikes.delete(username);
        
        const saved = broadcastAiMessage(`🚨 D.I.S.M.W Security Protocol Activated. User ${username} has been quarantined and forcefully logged out due to repeated security policy violations.`);
        return res.status(403).json({ success: false, error: 'SECURITY_LOGOUT_TRIGGERED', message: saved });
      } else {
        // Add warning to AI message
        aiText += `\n\n**[SYSTEM WARNING]: This is strike ${strikes}/3. Further violations will result in automatic logout.**`;
      }
    }
    // -------------------------------

    // Add a slight artificial delay to make it feel like AI is "thinking"
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Local AI responded, length:', aiText.length);

    const saved = broadcastAiMessage(aiText);
    return res.status(200).json({ success: true, message: saved });

  } catch (err) {
    console.error('❌ AI Route crash:', err.message, err.stack);
    try {
      const saved = broadcastAiMessage(`⚠️ Ai-Scout had an internal error: ${err.message}`);
      return res.status(200).json({ success: true, message: saved });
    } catch(e2) {
      return res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;

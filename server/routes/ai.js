const express = require('express');
const router = express.Router();
const path = require('path');
const requireAuth = require('../middleware/auth');
const dismw = require('../security/dismw');
const AI_BOT_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=Ai-Scout&backgroundColor=4facfe';

// Load Scout-AI Deep Engine with fallback to local nlpEngine
let scoutEngine = null;
try {
  const ScoutEngine = require('../../scout-ai-engine/src/index');
  scoutEngine = new ScoutEngine();
  scoutEngine.initialize().catch(err => {
    console.warn('⚠️ ScoutEngine deep network warm-up deferred:', err.message);
  });
} catch (e) {
  console.warn('⚠️ Could not load @outpost/scout-ai-engine, using fallback engine:', e.message);
}

const fallbackNlp = require('../ai/nlpEngine');

// Helper: format AI message for frontend without saving to DB
const broadcastAiMessage = (text, action = null) => {
  return {
    channelKey: '1_Ai-Scout',
    user: { username: 'Ai-Scout', profilePictureUrl: AI_BOT_AVATAR, level: 99 },
    text: text,
    time: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: 'text',
    action: action || null
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

    let aiResult;
    let isThreat = false;
    let aiText = '';
    let aiAction = null;

    if (scoutEngine && scoutEngine.isTrained) {
      const cognitiveResult = await scoutEngine.think(message, req.user?.username || 'scout_user');
      aiText = cognitiveResult.text;
      isThreat = cognitiveResult.isThreat;
      aiAction = cognitiveResult.action || null;
    } else {
      aiResult = await fallbackNlp.processMessage(message);
      aiText = typeof aiResult === 'object' ? aiResult.answer : aiResult;
      isThreat = typeof aiResult === 'object' && aiResult.isSecurityThreat;
    }

    // --- 3-STRIKE SECURITY LOGIC ---
    if (isThreat) {
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
    await new Promise(resolve => setTimeout(resolve, 600));
    console.log('✅ Local AI responded, length:', aiText.length, 'action:', aiAction?.type || 'none');

    const saved = broadcastAiMessage(aiText, aiAction);
    return res.status(200).json({ success: true, message: saved });

  } catch (err) {
    console.error('❌ AI Route crash:', err.message, err.stack);
    try {
      const saved = broadcastAiMessage(`⚠️ Ai-Scout had an internal error: ${err.message}`);
      return res.status(200).json({ success: true, message: saved });
    } catch {
      return res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;

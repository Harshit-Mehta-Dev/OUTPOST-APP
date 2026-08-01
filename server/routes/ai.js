const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Message = require('../models/Message');
const scoutVault = require('../utils/scoutVault');
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

    const aiText = await processMessage(message);

    // Add a slight artificial delay to make it feel like AI is "thinking"
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Local AI responded, length:', aiText.length);

    // Emit typing stop explicitly to the user's socket ID if needed, but HTTP response handles frontend.
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

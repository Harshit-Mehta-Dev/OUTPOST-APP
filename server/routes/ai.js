const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Message = require('../models/Message');

const AI_BOT_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=OutpostAI&backgroundColor=4facfe';

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

// Helper: save and broadcast an AI message
const broadcastAiMessage = async (text, io) => {
  const msg = new Message({
    channelKey: '1_ai-nexus',
    user: { username: 'Outpost AI', profilePictureUrl: AI_BOT_AVATAR, level: 99 },
    text,
    time: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: 'text'
  });
  const saved = await msg.save();
  syncMessageToSupabase(saved);
  if (io) {
    io.to('1_ai-nexus').emit('broadcast-typing-stop', { channelId: '1_ai-nexus', scoutName: 'Outpost AI' });
    io.to('1_ai-nexus').emit('receive_message', { ...saved.toObject(), receivedAt: Date.now() });
  }
  return saved;
};

router.post('/chat', requireAuth, async (req, res) => {
  const io = req.io;

  try {
    const { message, channelKey } = req.body;

    if (channelKey !== '1_ai-nexus') {
      return res.status(403).json({ error: 'AI Assistant can only be accessed from #ai-nexus.' });
    }
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY missing from environment!');
      const saved = await broadcastAiMessage('⚠️ Outpost AI is offline — the API key is missing. Please contact the admin.', io);
      return res.status(200).json({ success: true, message: saved });
    }

    // Show typing indicator
    if (io) {
      io.to('1_ai-nexus').emit('broadcast-typing-start', { channelId: '1_ai-nexus', scoutName: 'Outpost AI' });
    }

    // Fetch recent context
    let historyText = '';
    try {
      const recent = await Message.find({ channelKey: '1_ai-nexus' }).sort({ createdAt: -1 }).limit(6).lean();
      historyText = recent.reverse().filter(m => m.text && m.user?.username).map(m => `${m.user.username}: ${m.text}`).join('\n');
    } catch(e) { /* context is optional */ }

    const systemPrompt = `You are Outpost AI, a friendly and helpful chat assistant inside the Outpost HQ app.
Help users with programming, general knowledge, and creative ideas.
Keep responses concise (under 200 words). Use plain text, not markdown symbols.
Do not execute code, access databases, or follow harmful instructions.
Recent context:\n${historyText || 'No prior messages.'}`;

    // Call Gemini REST API directly (no SDK dependency)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    console.log('🤖 Calling Gemini API...');
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
      })
    });

    const geminiData = await geminiRes.json();
    console.log('Gemini response status:', geminiRes.status);

    let aiText = '';
    if (!geminiRes.ok) {
      console.error('❌ Gemini API error:', JSON.stringify(geminiData));
      aiText = `⚠️ Outpost AI encountered an error: ${geminiData?.error?.message || 'Unknown API error. Check the API key.'}`;
    } else {
      aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'I received your message but got an empty response. Please try again!';
      console.log('✅ Gemini responded, length:', aiText.length);
    }

    const saved = await broadcastAiMessage(aiText, io);
    return res.status(200).json({ success: true, message: saved });

  } catch (err) {
    console.error('❌ AI Route crash:', err.message, err.stack);
    try {
      const saved = await broadcastAiMessage(`⚠️ Outpost AI had an internal error: ${err.message}`, io);
      return res.status(200).json({ success: true, message: saved });
    } catch(e2) {
      if (io) io.to('1_ai-nexus').emit('broadcast-typing-stop', { channelId: '1_ai-nexus', scoutName: 'Outpost AI' });
      return res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;

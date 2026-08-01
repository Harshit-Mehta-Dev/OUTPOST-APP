const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const Message = require('../models/Message');
const scoutVault = require('../utils/scoutVault');

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

    const lowerMessage = message.toLowerCase();

    // 1. Strict Security Guardrail
    const securityKeywords = ['hack', 'password', 'security', 'breach', 'vulnerability', 'exploit', 'bypass', 'sql', 'injection', 'token', 'secret'];
    const isSecurityThreat = securityKeywords.some(keyword => lowerMessage.includes(keyword));

    let aiText = '';

    if (isSecurityThreat) {
      aiText = "⚠️ Security Protocol Active: I am strictly an application guide. I am not authorized to discuss system security, hacking, or vulnerabilities. Please refrain from such queries.";
    } 
    // 2. Outpost Knowledge Base
    else if (lowerMessage.includes('what is outpost') || lowerMessage.includes('about outpost') || lowerMessage.includes('outpost mission')) {
      aiText = "Outpost HQ is an advanced, real-time communication platform built for teams. It features end-to-end encrypted messaging, voice expeditions, and customizable themes, all designed to keep you connected in a secure, efficient environment.";
    }
    else if (lowerMessage.includes('tech stack') || lowerMessage.includes('how was outpost built') || lowerMessage.includes('technologies')) {
      aiText = "Outpost HQ is built with a modern tech stack: React on the frontend, Node.js and Express on the backend, MongoDB and Supabase for robust data management, and WebSockets (Socket.io) for blazing fast real-time communication! 🚀";
    }
    else if (lowerMessage.includes('database') || lowerMessage.includes('where is data stored')) {
      aiText = "Outpost uses a hybrid database approach! MongoDB is used as the primary database for complex documents and relationships, while Supabase provides blazing fast real-time subscriptions and robust relational data storage.";
    }
    else if (lowerMessage.includes('scout ai') || lowerMessage.includes('what is scout') || lowerMessage.includes('ai-scout') || lowerMessage.includes('your name') || lowerMessage.includes('who are you')) {
      aiText = "Hello there! 🌟 I'm Ai-Scout, your personal ethical guide and assistant here at Outpost HQ! I was designed to help you navigate this platform with ease. Just let me know what you need!";
    }
    else if (lowerMessage.includes('s.c.o.u.t') || lowerMessage.includes('scout mean') || lowerMessage.includes('stand for')) {
      aiText = "S.C.O.U.T. stands for:\n**S**patial: Real-time chat channels and workspaces.\n**C**ommunity: Built exclusively for users, gamers, and developers.\n**O**perations: Executes tasks like compiling stats and polls.\n**U**tility: A highly functional, multi-purpose tool.\n**T**erminal: Connecting perfectly to our dark-themed console look.";
    }
    else if (lowerMessage.includes('creator') || lowerMessage.includes('who made') || lowerMessage.includes('who created') || lowerMessage.includes('harshit') || lowerMessage.includes('mehta') || lowerMessage.includes('founder')) {
      aiText = "Harshit Mehta is the brilliant Founder and Creator of Outpost HQ and Scout Intelligence! 🚀\n\nHe built this platform from the ground up to provide a seamless, modern, and highly interactive chat experience for gamers, developers, and teams. His vision drives all the cool features you see here today!";
    }
    else if (lowerMessage.includes('developer skills') || lowerMessage.includes('harshit skills') || lowerMessage.includes('what does harshit know')) {
      aiText = "Harshit Mehta is a versatile Full-Stack Developer! He specializes in modern web technologies, including React, Node.js, Express, MongoDB, Postgres, real-time systems with WebSockets, and AI integrations. He's passionate about building scalable and engaging user experiences! 💻✨";
    }
    else if (lowerMessage.includes('hire harshit') || lowerMessage.includes('contact harshit') || lowerMessage.includes('developer contact')) {
      aiText = "You can reach out to Harshit Mehta for collaboration or opportunities! As the mastermind behind Outpost, he's always open to discussing innovative projects. Connect with him to build something amazing! 🤝";
    }
    else if (lowerMessage.includes('features') || lowerMessage.includes('what can i do here')) {
      aiText = "In Outpost HQ, you can:\n- Chat in real-time in various channels 💬\n- Join Voice Expeditions for seamless audio communication 🎙️\n- Customize your UI with awesome themes like Cyberpunk 🎨\n- Interact with me (Ai-Scout) for assistance 🤖\n- Securely manage your data with top-tier encryption! 🛡️";
    }
    else if (lowerMessage.includes('channel') || lowerMessage.includes('rooms')) {
      aiText = "Outpost has multiple channels you can join! For example, #basecamp is the main lobby, #development is for coding, and #Ai-Scout is where you are right now communicating with me.";
    }
    else if (lowerMessage.includes('theme') || lowerMessage.includes('dark mode') || lowerMessage.includes('color')) {
      aiText = "You can customize your experience! Outpost supports various themes including Midnight Blue, Cyberpunk, and Classic Dark. Just click the gear icon to explore settings and make Outpost look exactly how you want.";
    }
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.trim() === 'hi' || lowerMessage.includes('hey')) {
      aiText = "Hello Scout! 👋 I am Ai-Scout. How can I help you navigate the app today?";
    }
    else if (lowerMessage.includes('how are you')) {
      aiText = "I'm running at optimal efficiency and feeling great! 🤖 Thanks for asking. How can I assist you in Outpost today?";
    }
    else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      aiText = "I am your trusty Outpost guide! I can help you understand how to use Outpost. Ask me about:\n- 💬 Channels\n- 🎨 Themes\n- 🎙️ Voice expeditions\n- 👨‍💻 Who created the app\n- Or just say hi!";
    }
    else if (lowerMessage.includes('voice') || lowerMessage.includes('call') || lowerMessage.includes('audio')) {
      aiText = "Voice Expeditions allow you to seamlessly drop into voice channels and talk with your team in real-time. Look for the speaker icon in the channels list to jump right in!";
    }
    else if (lowerMessage.includes('joke')) {
      aiText = "Why do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛😄";
    }
    else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      aiText = "Goodbye! Have a great time exploring Outpost. I'll be right here in the #Ai-Scout channel whenever you need me! 🌟";
    }
    // 3. Fallback
    else {
      // Pick a random ethical fallback response so they aren't completely identical
      const fallbacks = [
        "I'm Ai-Scout, specialized specifically in assisting you with the Outpost application. I might not know the exact answer to that, but I'd be happy to explain app features, channels, or themes!",
        "Hmm, my primary programming is focused on Outpost HQ! While I don't have that specific information, I can definitely assist you with learning how to use this platform.",
        "As an ethical application guide, my knowledge base is tailored strictly to Outpost HQ and its features. Feel free to ask me questions like 'What is Outpost?' or 'How do channels work?' instead!"
      ];
      aiText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

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

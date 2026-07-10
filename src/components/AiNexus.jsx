import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, RotateCcw, Sparkles, Lock } from 'lucide-react';
import './AiNexus.css';

const API_BASE = import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002');

const TypingIndicator = () => (
  <div className="ainex-row ainex-row-bot">
    <div className="ainex-bot-icon">🤖</div>
    <div className="ainex-bubble ainex-bubble-bot ainex-typing">
      <span className="ainex-dot" /><span className="ainex-dot" /><span className="ainex-dot" />
    </div>
  </div>
);

const AiNexus = ({ currentUser }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: `Hello, ${currentUser?.username || 'Scout'}! 👋 I'm Ai-Scout — your personal assistant. Ask me anything!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    autoResize();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg = {
      id: 'u-' + Date.now(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('outpost_token');
      const res = await fetch(API_BASE + '/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ message: text, channelKey: '1_Ai-Scout' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown server error.');

      setMessages(prev => [...prev, {
        id: 'b-' + Date.now(),
        role: 'bot',
        text: data.message?.text || 'I got a blank response. Try again!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: 'e-' + Date.now(),
        role: 'bot',
        text: '⚠️ ' + err.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => setMessages([{
    id: 'w-' + Date.now(), role: 'bot',
    text: `Chat cleared! How can I help, ${currentUser?.username || 'Scout'}?`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);

  return (
    <div className="ainex-container">
      {/* Bot header strip */}
      <div className="ainex-hero">
        <div className="ainex-hero-avatar">
          <Bot size={20} />
          <span className="ainex-online-dot" />
        </div>
        <div className="ainex-hero-info">
          <span className="ainex-hero-name">Ai-Scout</span>
          <span className="ainex-hero-status">● Secure Local Engine</span>
        </div>
        
        <button className="ainex-new-chat-btn" onClick={clearChat} title="New conversation">
          <RotateCcw size={13} /> New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="ainex-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`ainex-row ${msg.role === 'user' ? 'ainex-row-user' : 'ainex-row-bot'}`}>
            {msg.role === 'bot' && <div className="ainex-bot-icon">🤖</div>}
            <div className={`ainex-bubble ${msg.role === 'user' ? 'ainex-bubble-user' : 'ainex-bubble-bot'} ${msg.isError ? 'ainex-bubble-error' : ''}`}>
              <div className="ainex-bubble-text">{msg.text}</div>
              <div className="ainex-bubble-time">{msg.time}</div>
            </div>
            {msg.role === 'user' && (
              <div className="ainex-user-icon">
                {currentUser?.profilePictureUrl
                  ? <img src={currentUser.profilePictureUrl} alt="You" />
                  : (currentUser?.username?.[0] || 'S').toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="ainex-input-section">
        <div className="ainex-input-box">
          <Sparkles size={15} className="ainex-sparkle" />
          <textarea
            ref={textareaRef}
            className="ainex-textarea"
            placeholder={`Ask Ai-Scout anything...`}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className={`ainex-send ${input.trim() && !isLoading ? 'ainex-send-active' : ''}`}
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? <div className="ainex-spinner" /> : <Send size={15} />}
          </button>
        </div>
        <div className="ainex-footer-hint">
          <Lock size={11} /> <span>End-to-End Encrypted · Press Enter to send · Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};

export default AiNexus;

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, RotateCcw } from 'lucide-react';
import './AiNexus.css';

const API_BASE = import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002');

const TypingDots = () => (
  <div className="ai-typing-indicator">
    <div className="ai-avatar-small">🤖</div>
    <div className="ai-bubble ai-bubble-bot">
      <span className="ai-dot" />
      <span className="ai-dot" />
      <span className="ai-dot" />
    </div>
  </div>
);

const AiNexus = ({ currentUser }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: `Hello, ${currentUser?.username || 'Scout'}! 👋 I'm **Outpost AI**, your personal assistant. Ask me anything — coding help, general knowledge, creative ideas, or just chat!`,
      time: 'Today'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setError(null);

    const userMsg = {
      id: 'user-' + Date.now(),
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
        body: JSON.stringify({ message: text, channelKey: '1_ai-nexus' })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unknown error from AI.');
      }

      const aiText = data.message?.text || 'I had a blank thought. Try again!';
      setMessages(prev => [...prev, {
        id: 'bot-' + Date.now(),
        role: 'bot',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        role: 'bot',
        text: `⚠️ ${err.message}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'bot',
      text: `Chat cleared! How can I help you, ${currentUser?.username || 'Scout'}? 🚀`,
      time: 'Today'
    }]);
  };

  const renderText = (text) => {
    // Simple bold rendering for **text**
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="ainexus-container">
      {/* Header */}
      <div className="ainexus-header">
        <div className="ainexus-header-left">
          <div className="ainexus-bot-orb">
            <span>🤖</span>
            <div className="ainexus-orb-ring" />
          </div>
          <div>
            <div className="ainexus-title">Outpost AI</div>
            <div className="ainexus-subtitle">
              <span className="ainexus-status-dot" />
              Always online · Powered by Gemini
            </div>
          </div>
        </div>
        <button className="ainexus-clear-btn" onClick={clearChat} title="Clear conversation">
          <RotateCcw size={15} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Messages */}
      <div className="ainexus-messages">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`ainexus-message-row ${msg.role === 'user' ? 'row-user' : 'row-bot'}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {msg.role === 'bot' && (
              <div className="ai-avatar-small">🤖</div>
            )}
            <div className={`ainexus-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-bot'} ${msg.isError ? 'bubble-error' : ''}`}>
              <div className="ainexus-bubble-text">
                {msg.text.split('\n').map((line, i) => (
                  <span key={i}>{renderText(line)}{i < msg.text.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
              <div className="ainexus-bubble-time">{msg.time}</div>
            </div>
            {msg.role === 'user' && (
              <div className="ainexus-user-avatar">
                {currentUser?.profilePictureUrl
                  ? <img src={currentUser.profilePictureUrl} alt="You" />
                  : (currentUser?.username?.[0] || 'S').toUpperCase()
                }
              </div>
            )}
          </div>
        ))}
        {isLoading && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="ainexus-input-area">
        <div className="ainexus-input-wrapper">
          <Sparkles size={16} className="ainexus-sparkle-icon" />
          <textarea
            ref={inputRef}
            className="ainexus-input"
            placeholder="Ask Outpost AI anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className={`ainexus-send-btn ${input.trim() && !isLoading ? 'active' : ''}`}
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? <div className="ainexus-send-spinner" /> : <Send size={16} />}
          </button>
        </div>
        <div className="ainexus-hint">Press Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
};

export default AiNexus;

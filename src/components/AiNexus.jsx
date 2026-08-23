import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Sparkles, Lock, CheckSquare, Square, Star, Forward, Info, X, Copy, Check } from 'lucide-react';
import { adaptAIPromptPayload } from '../lib/aiAdaptation';
import './AiNexus.css';

const API_BASE = import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002');

const SkeletonMessage = () => (
  <div className="ainex-row ainex-row-bot">
    <div className="ainex-bot-icon"><img src="/ai-scout-logo.png" alt="Ai-Scout" className="ainex-custom-logo" /></div>
    <div className="ainex-bubble ainex-bubble-bot ainex-skeleton-wrapper">
      <div className="ainex-skeleton-line short"></div>
      <div className="ainex-skeleton-line long"></div>
      <div className="ainex-skeleton-line medium"></div>
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
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [starredMessageIds, setStarredMessageIds] = useState([]);
  const [infoMessage, setInfoMessage] = useState(null);
  const [notice, setNotice] = useState('');
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
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const adaptedText = adaptAIPromptPayload(text, isMobile);
      const token = localStorage.getItem('outpost_token');
      const res = await fetch(API_BASE + '/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ message: adaptedText, channelKey: '1_Ai-Scout' })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('outpost_token');
          throw new Error('Your secure session token expired. Please log out and log back in to reconnect Ai-Scout.');
        }
        throw new Error(data.error || 'Unknown server error.');
      }

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

  const notify = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 2400);
  };

  const toggleSelected = (id) => setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);

  const toggleStarred = (id) => {
    const isStarred = starredMessageIds.includes(id);
    setStarredMessageIds(prev => isStarred ? prev.filter(item => item !== id) : [...prev, id]);
    notify(isStarred ? 'Message removed from starred' : 'Message saved to starred');
  };

  const forwardMessage = (msg) => {
    setInput(`Forwarded message: ${msg.text}`);
    window.setTimeout(() => {
      autoResize();
      textareaRef.current?.focus();
    }, 0);
    notify('Message added to the composer — edit or send it.');
  };

  const copyMessage = async (msg) => {
    try {
      await navigator.clipboard.writeText(msg.text);
      notify('Message copied to clipboard.');
    } catch {
      notify('Copy is not available in this browser.');
    }
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
          <img src="/ai-scout-logo.png" alt="Ai-Scout" className="ainex-custom-logo" />
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
          <div key={msg.id} className={`ainex-row ${msg.role === 'user' ? 'ainex-row-user' : 'ainex-row-bot'} ${selectedMessageIds.includes(msg.id) ? 'ainex-row-selected' : ''}`}>
            {msg.role === 'bot' && <div className="ainex-bot-icon"><img src="/ai-scout-logo.png" alt="Ai-Scout" className="ainex-custom-logo" /></div>}
            <div className={`ainex-bubble ${msg.role === 'user' ? 'ainex-bubble-user' : 'ainex-bubble-bot'} ${msg.isError ? 'ainex-bubble-error' : ''}`}>
              <div className="ainex-message-actions" aria-label="Message actions">
                <button onClick={() => toggleSelected(msg.id)} title={selectedMessageIds.includes(msg.id) ? 'Deselect message' : 'Select message'}>{selectedMessageIds.includes(msg.id) ? <CheckSquare size={14} /> : <Square size={14} />}</button>
                <button className={starredMessageIds.includes(msg.id) ? 'is-starred' : ''} onClick={() => toggleStarred(msg.id)} title="Star message"><Star size={14} fill={starredMessageIds.includes(msg.id) ? 'currentColor' : 'none'} /></button>
                <button onClick={() => forwardMessage(msg)} title="Forward message"><Forward size={14} /></button>
                <button onClick={() => setInfoMessage(msg)} title="Message information"><Info size={14} /></button>
              </div>
              <span className="ainex-bubble-text">{msg.text}</span>
              <span className="ainex-bubble-time">{msg.time}</span>
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
        {isLoading && <SkeletonMessage />}
        <div ref={bottomRef} />
      </div>

      {notice && <div className="ainex-notice" role="status"><Check size={14} /> {notice}</div>}
      {infoMessage && (
        <div className="ainex-info-backdrop" onClick={() => setInfoMessage(null)}>
          <section className="ainex-info-panel" onClick={e => e.stopPropagation()} aria-label="Message information">
            <button className="ainex-info-close" onClick={() => setInfoMessage(null)} aria-label="Close"><X size={17} /></button>
            <Info size={18} className="ainex-info-icon" />
            <h3>Message information</h3>
            <p><strong>From</strong> {infoMessage.role === 'bot' ? 'Ai-Scout' : (currentUser?.username || 'You')}</p>
            <p><strong>Sent</strong> {infoMessage.time}</p>
            <button className="ainex-info-copy" onClick={() => copyMessage(infoMessage)}><Copy size={14} /> Copy message</button>
          </section>
        </div>
      )}

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

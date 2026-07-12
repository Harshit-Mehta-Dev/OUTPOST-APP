import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, CheckCircle, Send, Image as ImageIcon, X, Clock, Lock, MessageSquare, ArrowLeft, User, Paperclip, LifeBuoy, Headset } from 'lucide-react';
import { io } from 'socket.io-client';
import './HelpDesk.css';

const socket = io((import.meta.env.VITE_CHAT_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5003')), {
  auth: { token: localStorage.getItem('outpost_token') }
});

const HelpDesk = () => {
  const [viewMode, setViewMode] = useState('submit'); // 'submit' or 'status'
  
  // Form State
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Status & Chat State
  const [requestId, setRequestId] = useState(localStorage.getItem('outpost_help_requestId') || null);
  const [statusInputId, setStatusInputId] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatImage, setChatImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ticketStatus, setTicketStatus] = useState('Open');
  const [originalRequestDescription, setOriginalRequestDescription] = useState('');
  const [isDeveloperTyping, setIsDeveloperTyping] = useState(false);
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (viewMode === 'status' && requestId) {
      socket.emit('join_help_room', requestId);
      
      // Fetch initial messages
      fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/help/requests/${requestId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.messages) {
            setMessages(data.messages);
            setTicketStatus(data.status);
            if (data.userName) setUserName(data.userName);
            if (data.description) setOriginalRequestDescription(data.description);
          }
        })
        .catch(err => console.error("Error fetching request details:", err));
    }
  }, [viewMode, requestId]);

  useEffect(() => {
    const handleReceiveHelpMessage = (data) => {
      if (data.requestId === requestId) {
        setMessages(prev => [...prev, data.message]);
        if (data.message.senderType === 'developer') setIsDeveloperTyping(false);
      }
    };

    const handleUserTyping = (data) => {
      if (data.requestId === requestId && data.senderType === 'developer') {
        setIsDeveloperTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsDeveloperTyping(false), 3000);
      }
    };

    socket.on('receive_help_message', handleReceiveHelpMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('receive_help_message', handleReceiveHelpMessage);
      socket.off('user_typing', handleUserTyping);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [requestId]);

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
    }
  };

  const handleChatImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatImage({
          file: file,
          base64: reader.result,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userName.trim() && email.trim() && message.trim() && isConfirmed) {
      
      try {
        let initialScreenshotUrl = '';
        if (screenshot) {
          const reader = new FileReader();
          reader.readAsDataURL(screenshot);
          initialScreenshotUrl = await new Promise((resolve) => {
             reader.onloadend = () => resolve(reader.result);
          });
        }

        const res = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/help/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName,
            email,
            description: message,
            initialScreenshotUrl
          })
        });
        
        const data = await res.json();
        
        if (data.requestId) {
          setRequestId(data.requestId);
          localStorage.setItem('outpost_help_requestId', data.requestId);
          localStorage.setItem('outpost_help_userName', userName);
          setIsSubmitted(true);
          setMessage('');
          setScreenshot(null);
          setIsConfirmed(false);
        }
      } catch (err) {
        console.warn("Backend offline, simulating local help request:", err);
        const localId = 'REQ-' + Math.floor(Math.random() * 100000);
        setRequestId(localId);
        localStorage.setItem('outpost_help_requestId', localId);
        localStorage.setItem('outpost_help_userName', userName);
        setIsSubmitted(true);
        setMessage('');
        setScreenshot(null);
        setIsConfirmed(false);
      }
    }
  };

  const handleSendChatMessage = () => {
    if (!chatMessage.trim() && !chatImage) return;

    const payload = {
      requestId,
      senderType: 'user',
      text: chatMessage.trim(),
      mediaType: chatImage ? chatImage.type : null,
      body: chatImage ? chatImage.base64 : null
    };

    if (socket && socket.connected) {
      socket.emit('send_help_message', payload);
    } else {
      console.warn("Socket offline, appending help message locally.");
      setMessages(prev => [...prev, {
        ...payload,
        timestamp: new Date().toISOString()
      }]);
    }
    setChatMessage('');
    setChatImage(null);
  };

  const handleCheckStatus = (e) => {
    e.preventDefault();
    if (statusInputId.trim()) {
      setRequestId(statusInputId.trim());
      localStorage.setItem('outpost_help_requestId', statusInputId.trim());
      setViewMode('status');
    }
  };

  const handleTyping = (e) => {
    setChatMessage(e.target.value);
    socket.emit('typing_help_message', { requestId, senderType: 'user' });
  };

  const activeUserName = localStorage.getItem('outpost_help_userName') || userName || 'User';

  const waterfallIcons = [LifeBuoy, Headset, MessageSquare, Send, Clock, CheckCircle];

  return (
    <section id="helpdesk" className="helpdesk-section">
      {/* Waterfall Animation Overlay */}
      <div className="waterfall-overlay">
        <div className="waterfall-side left">
          {[...Array(20)].map((_, i) => (
            <div 
              key={`left-${i}`} 
              className="waterfall-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2.5}s`,
                height: `${100 + Math.random() * 200}px`,
                width: `${1 + Math.random() * 6}px`,
                opacity: 0.2 + Math.random() * 0.8
              }}
            />
          ))}
          {[...Array(5)].map((_, i) => {
            const Icon = waterfallIcons[i % waterfallIcons.length];
            return (
              <div
                key={`sticker-left-${i}`}
                className="waterfall-sticker-drop"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 5}s`
                }}
              >
                <Icon size={24 + Math.random() * 16} />
              </div>
            );
          })}
        </div>
        <div className="waterfall-side right">
          {[...Array(20)].map((_, i) => (
            <div 
              key={`right-${i}`} 
              className="waterfall-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2.5}s`,
                height: `${100 + Math.random() * 200}px`,
                width: `${1 + Math.random() * 6}px`,
                opacity: 0.2 + Math.random() * 0.8
              }}
            />
          ))}
          {[...Array(5)].map((_, i) => {
            const Icon = waterfallIcons[(i + 3) % waterfallIcons.length];
            return (
              <div
                key={`sticker-right-${i}`}
                className="waterfall-sticker-drop"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 5}s`
                }}
              >
                <Icon size={24 + Math.random() * 16} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="container relative-z">
      <motion.div 
        className="helpdesk-header text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">Help <span className="text-gradient">Desk</span></h2>
        <p className="helpdesk-subtitle">Outpost Community Support - We're here to help you navigate.</p>
      </motion.div>

      <div className="helpdesk-form-container glass-panel sticker-container">
        <div className="sticker sticker-left"><Headset size={24} /></div>
        <div className="sticker sticker-right"><LifeBuoy size={24} /></div>
        <AnimatePresence mode="wait">
          {viewMode === 'submit' ? (
            <motion.div
              key="submit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isSubmitted ? (
                <div className="success-message text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: "spring", duration: 0.8 }}
                  >
                    <CheckCircle size={64} className="success-icon" style={{ color: 'var(--brand-primary)', margin: '0 auto 16px' }} />
                  </motion.div>
                  <h3>Successful!</h3>
                  <p>Your request is sent to our operational team.</p>
                  <p className="mt-4 text-brand-primary font-mono bg-dark-glass p-2 rounded">Ticket ID: {requestId}</p>
                  <p className="text-sm text-gray-400 mt-2">Please save this Ticket ID to check your status later.</p>
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px' }}>
                    <button className="btn-secondary" onClick={() => setIsSubmitted(false)}>Send Another</button>
                    <button className="btn-primary" onClick={() => setViewMode('status')}>View Status</button>
                  </div>
                </div>
              ) : (
                <form className="helpdesk-form" onSubmit={handleSubmit}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group mb-0">
                      <label htmlFor="userName">User Name</label>
                      <input
                        type="text"
                        id="userName"
                        className="form-control"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group mb-0">
                      <label htmlFor="email">Gmail / Email</label>
                      <input
                        type="email"
                        id="email"
                        className="form-control"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">How can we help?</label>
                    <textarea
                      id="message"
                      className="form-control"
                      placeholder="Describe your issue or ask a question..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows="5"
                    />
                  </div>

                  <div className="form-group upload-group">
                    <label>Upload Screenshot (Optional)</label>
                    <div className="upload-area">
                      <input
                        type="file"
                        id="screenshot"
                        className="file-input"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                      />
                      <label htmlFor="screenshot" className="upload-label">
                        {screenshot ? (
                          <div className="uploaded-file">
                            <ImageIcon size={24} />
                            <span className="filename">{screenshot.name}</span>
                            <button 
                              type="button" 
                              className="remove-file"
                              onClick={(e) => { e.preventDefault(); setScreenshot(null); }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="upload-prompt">
                            <UploadCloud size={32} />
                            <span>Click to upload or drag and drop</span>
                            <small>PNG, JPG, GIF up to 5MB</small>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="form-group confirm-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isConfirmed}
                        onChange={(e) => setIsConfirmed(e.target.checked)}
                        required
                      />
                      <span className="checkbox-custom"></span>
                      I confirm that the information provided is accurate and I agree to the Outpost Support terms.
                    </label>
                  </div>

                  <div className="form-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button 
                      type="button" 
                      className="btn-secondary submit-btn"
                      onClick={() => setViewMode('status')}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Clock size={18} /> Request Status
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary submit-btn"
                    >
                      Submit Request <Send size={18} />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="status"
              className="status-view-container"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="status-header">
                <button 
                  className="back-btn"
                  onClick={() => setViewMode('submit')}
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <ArrowLeft size={24} /> <span style={{ fontSize: '1.1rem' }}>Back</span>
                </button>
                <div className="status-title">
                  <h3>Request Status</h3>
                  <div className="encryption-badge">
                    <Lock size={12} />
                    <span>End-to-End Encrypted</span>
                  </div>
                </div>
              </div>

              {!requestId ? (
                <div className="status-lookup">
                  <MessageSquare size={48} className="lookup-icon" />
                  <h4>Check Your Request</h4>
                  <p>Enter your Ticket ID to view the status and chat with support.</p>
                  <form onSubmit={handleCheckStatus} className="lookup-form" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Enter Ticket ID"
                      value={statusInputId}
                      onChange={(e) => setStatusInputId(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn-primary">Check</button>
                  </form>
                </div>
              ) : (
                <div className="chat-interface">
                  <div className="chat-status-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="ticket-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="ticket-title" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Ticket #{requestId}</span>
                      <span className={`ticket-status-badge ${ticketStatus.toLowerCase()}`}>{ticketStatus}</span>
                    </div>
                    <div className="helper-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="helper-avatar" style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%' }}>
                        <User size={18} />
                      </div>
                      <span className="text-sm">Chatting with <strong>Outpost Community Helper</strong></span>
                    </div>
                  </div>

                  {originalRequestDescription && (
                    <div className="bg-dark-glass p-3 rounded mb-4 border border-gray-700">
                      <p className="text-sm font-semibold text-brand-primary">{activeUserName}'s Request:</p>
                      <p className="text-sm text-gray-300 mt-1">{originalRequestDescription}</p>
                    </div>
                  )}

                  <div className="chat-messages flex-grow overflow-y-auto pr-2 flex flex-col gap-4">
                    {messages.map((msg, index) => {
                      const isUser = msg.senderType === 'user';
                      return (
                        <div key={index} className={`chat-message ${isUser ? 'sent' : 'received'}`}>
                          <div className="message-content">
                            <span className="sender-name">{isUser ? activeUserName : 'Support'}</span>
                            {msg.text && <p>{msg.text}</p>}
                            {msg.mediaType && msg.body && (
                              <img src={msg.body} alt="attachment" className="chat-attachment-img" />
                            )}
                            <span className="timestamp">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {isDeveloperTyping && (
                      <div className="chat-message received">
                        <div className="helper-avatar">
                          <User size={20} />
                        </div>
                        <div className="message-content" style={{ padding: '8px 16px' }}>
                          <span className="sender-name">Developer is typing</span>
                          <motion.div 
                            className="flex gap-1 mt-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          </motion.div>
                        </div>
                      </div>
                    )}
                    {/* Spacer to prevent chat input from overlapping the bottom content (browsers ignore bottom padding on scroll containers) */}
                    <div ref={messagesEndRef} style={{ height: '32px', flexShrink: 0 }} />
                  </div>

                  {ticketStatus === 'Open' ? (
                    <div className="chat-input-area">
                      {chatImage && (
                        <div className="chat-image-preview">
                          <img src={chatImage.base64} alt="preview" />
                          <button onClick={() => setChatImage(null)}><X size={14}/></button>
                        </div>
                      )}
                      <div className="helpdesk-chat-input-wrapper">
                        <input
                          type="file"
                          id="chat-image-upload"
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handleChatImageUpload}
                        />
                        <button 
                          className="icon-btn attach-btn"
                          onClick={() => document.getElementById('chat-image-upload').click()}
                        >
                          <Paperclip size={20} />
                        </button>
                        <input 
                          type="text"
                          className="chat-input"
                          placeholder="Type your message..."
                          value={chatMessage}
                          onChange={handleTyping}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        />
                        <button 
                          className="icon-btn send-btn"
                          onClick={handleSendChatMessage}
                          disabled={!chatMessage.trim() && !chatImage}
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="chat-closed-notice">
                      <p>This request has been closed. Please submit a new request if you need further assistance.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </section>
  );
};

export default HelpDesk;

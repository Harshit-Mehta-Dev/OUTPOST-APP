import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Image as ImageIcon, CheckCircle, MessageSquare, Paperclip, User, Trash2, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import './DeveloperHelpDesk.css';

const socket = io((import.meta.env.VITE_CHAT_URL || 'http://localhost:5003'), {
  auth: { token: localStorage.getItem('outpost_token') }
});

const DeveloperHelpDesk = ({ onClose, currentUser }) => {
  const [requests, setRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatImage, setChatImage] = useState(null);
  const [ticketStatus, setTicketStatus] = useState('Open');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all requests
  const fetchRequests = () => {
    fetch(`${(import.meta.env.VITE_CORE_API_URL || 'http://localhost:5002')}/api/help/requests`)
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => console.error("Error fetching requests:", err));
  };

  useEffect(() => {
    fetchRequests();
    
    // Listen for new tickets coming in (optional, but good for real-time)
    socket.on('new_help_request_message', () => {
      fetchRequests(); // Quick refresh of the list
    });

    return () => {
      socket.off('new_help_request_message');
    };
  }, []);

  const openTicket = (reqId) => {
    socket.emit('join_help_room', reqId);
    
    fetch(`${(import.meta.env.VITE_CORE_API_URL || 'http://localhost:5002')}/api/help/requests/${reqId}`)
      .then(res => res.json())
      .then(data => {
        setActiveRequest(data);
        setMessages(data.messages || []);
        setTicketStatus(data.status);
      })
      .catch(err => console.error("Error fetching request details:", err));
  };

  useEffect(() => {
    const handleReceiveHelpMessage = (data) => {
      if (activeRequest && (data.requestId === activeRequest._id || data.requestId === activeRequest.ticketId)) {
        setMessages(prev => [...prev, data.message]);
        if (data.message.senderType === 'user') setIsUserTyping(false);
      }
    };

    const handleUserTyping = (data) => {
      if (activeRequest && (data.requestId === activeRequest._id || data.requestId === activeRequest.ticketId) && data.senderType === 'user') {
        setIsUserTyping(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsUserTyping(false), 3000);
      }
    };

    socket.on('receive_help_message', handleReceiveHelpMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('receive_help_message', handleReceiveHelpMessage);
      socket.off('user_typing', handleUserTyping);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [activeRequest]);

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

  const handleSendChatMessage = () => {
    if (!chatMessage.trim() && !chatImage) return;

    const payload = {
      requestId: activeRequest.ticketId || activeRequest._id,
      senderType: 'developer',
      text: chatMessage.trim(),
      mediaType: chatImage ? chatImage.type : null,
      body: chatImage ? chatImage.base64 : null
    };

    socket.emit('send_help_message', payload);
    setChatMessage('');
    setChatImage(null);
  };

  const handleCloseTicket = () => {
    fetch(`${(import.meta.env.VITE_CORE_API_URL || 'http://localhost:5002')}/api/help/requests/${activeRequest._id}/close`, {
      method: 'PATCH'
    })
      .then(res => res.json())
      .then(data => {
        setTicketStatus('Closed');
        fetchRequests(); // refresh list
      })
      .catch(err => console.error("Error closing ticket:", err));
  };

  const handleClearAllTickets = () => {
    if (window.confirm("Are you sure you want to completely erase ALL tickets? This action cannot be undone.")) {
      fetch(`${(import.meta.env.VITE_CORE_API_URL || 'http://localhost:5002')}/api/help/requests`, {
        method: 'DELETE'
      })
      .then(res => res.json())
      .then(() => {
        setRequests([]);
        setActiveRequest(null);
      })
      .catch(err => console.error("Error clearing tickets:", err));
    }
  };

  return (
    <motion.div 
      className="dev-helpdesk-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="dev-helpdesk-container glass-panel"
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
      >
        <div className="dev-helpdesk-header">
          <div className="flex items-center gap-2">
            <MessageSquare size={24} className="text-brand-primary" />
            <h2 className="text-xl font-bold">Support Operations Center</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleClearAllTickets}
              className="flex items-center gap-2"
              style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: '500', fontSize: '0.9rem' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)'}
            >
              <Trash2 size={16} /> Clear All Tickets
            </button>
            <button className="icon-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="dev-helpdesk-body">
          {/* LEFT SIDEBAR: TICKET LIST */}
          <div className="ticket-list-panel">
            <div className="ticket-list-header">
              <h3>Active Tickets ({requests.filter(r => r.status === 'Open').length})</h3>
            </div>
            <div className="ticket-list">
              {requests.map(req => (
                <div 
                  key={req._id} 
                  className={`ticket-card ${activeRequest?._id === req._id ? 'active' : ''} ${req.status === 'Closed' ? 'closed' : ''}`}
                  onClick={() => openTicket(req._id)}
                >
                  <div className="ticket-card-header">
                    <span className="ticket-user">{req.userName}</span>
                    <span className={`ticket-badge ${req.status.toLowerCase()}`}>{req.status}</span>
                  </div>
                  <div className="ticket-card-body">
                    <p>{req.description.substring(0, 40)}...</p>
                  </div>
                  <div className="ticket-card-footer">
                    <span className="ticket-time">
                      <Clock size={12}/> {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    <span className="ticket-msg-count">
                      <MessageSquare size={12}/> {req.messages?.length || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR: CHAT INTERFACE */}
          <div className="ticket-chat-panel">
            {!activeRequest ? (
              <div className="no-ticket-selected">
                <MessageSquare size={48} className="text-gray-500 mb-4" />
                <h3>Select a ticket</h3>
                <p>Choose a ticket from the left to start helping scouts.</p>
              </div>
            ) : (
              <div className="active-ticket-interface">
                <div className="active-ticket-header">
                  <div className="active-ticket-info">
                    <h3>{activeRequest.userName}</h3>
                    <p>{activeRequest.email}</p>
                  </div>
                  <div className="active-ticket-actions">
                    {ticketStatus === 'Open' && (
                      <button className="btn-secondary flex items-center gap-2" onClick={handleCloseTicket}>
                        <CheckCircle size={16} /> Close Ticket
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="active-ticket-original">
                  <strong>Original Request:</strong>
                  <p>{activeRequest.description}</p>
                  {activeRequest.initialScreenshotUrl && (
                    <img src={activeRequest.initialScreenshotUrl} alt="Initial Screenshot" className="chat-attachment-img" />
                  )}
                </div>

                <div className="dev-chat-messages">
                  {messages.map((msg, index) => {
                    const isDev = msg.senderType === 'developer';
                    return (
                      <div key={index} className={`chat-message ${isDev ? 'sent' : 'received'}`}>
                        <div className="message-content">
                          <span className="sender-name">{isDev ? 'You (Support)' : activeRequest.userName}</span>
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
                  
                  {isUserTyping && (
                    <div className="chat-message received">
                      <div className="message-content" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                        <span className="sender-name">{activeRequest.userName} is typing</span>
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
                  <div ref={messagesEndRef} />
                </div>

                {ticketStatus === 'Open' ? (
                  <div className="dev-chat-input-area">
                    {chatImage && (
                      <div className="chat-image-preview">
                        <img src={chatImage.base64} alt="preview" />
                        <button onClick={() => setChatImage(null)}><X size={14}/></button>
                      </div>
                    )}
                    <div className="helpdesk-chat-input-wrapper">
                      <input
                        type="file"
                        id="dev-chat-image-upload"
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleChatImageUpload}
                      />
                      <button 
                        className="icon-btn attach-btn"
                        onClick={() => document.getElementById('dev-chat-image-upload').click()}
                      >
                        <Paperclip size={20} />
                      </button>
                      <input 
                        type="text"
                        className="chat-input"
                        placeholder="Type your response to the scout..."
                        value={chatMessage}
                        onChange={(e) => {
                          setChatMessage(e.target.value);
                          socket.emit('typing_help_message', { 
                            requestId: activeRequest.ticketId || activeRequest._id, 
                            senderType: 'developer' 
                          });
                        }}
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
                    <p>This ticket is closed.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeveloperHelpDesk;

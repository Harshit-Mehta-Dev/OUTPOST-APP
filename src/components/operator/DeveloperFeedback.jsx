import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, MessageSquare, Trash2, Clock, Mail, User } from 'lucide-react';
import { io } from 'socket.io-client';
import './DeveloperFeedback.css';

const DeveloperFeedback = ({ onClose }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = () => {
    fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/feedback`)
      .then(res => res.json())
      .then(data => {
        setFeedbacks(data);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend offline, utilizing mock feedback:", err);
        setFeedbacks([
          { _id: 'mock-fb-1', userName: 'Scout Demo', email: 'demo@outpost.com', message: 'I absolutely love this new UI design!', timestamp: new Date().toISOString() }
        ]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFeedbacks();

    const token = localStorage.getItem('outpost_token') || '';
    const socket = io((import.meta.env.VITE_CHAT_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002')), { 
      transports: ['websocket', 'polling'],
      auth: { token }
    });
    socket.on('new_feedback', (feedback) => {
      setFeedbacks(prev => [feedback, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/feedback/${id}`, {
        method: 'DELETE'
      })
      .then(() => {
        setFeedbacks(prev => prev.filter(f => f._id !== id));
      })
      .catch(err => {
        console.warn("Backend offline, simulating feedback delete:", err);
        setFeedbacks(prev => prev.filter(f => f._id !== id));
      });
    }
  };

  return (
    <motion.div 
      className="dev-feedback-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="dev-feedback-container glass-panel"
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
      >
        <div className="dev-feedback-header">
          <div className="flex items-center gap-2">
            <MessageSquare size={24} className="text-accent-secondary" style={{ color: '#00cec9' }} />
            <h2 className="text-xl font-bold">User Feedback Inbox</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="dev-feedback-body">
          {loading ? (
            <div className="feedback-loading">
              <span className="loader"></span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="feedback-empty">
              <MessageSquare size={48} />
              <p>No feedback received yet.</p>
            </div>
          ) : (
            <div className="feedback-list">
              {feedbacks.map((item) => (
                <motion.div 
                  key={item._id} 
                  className="feedback-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="feedback-card-header">
                    <div className="feedback-user-info">
                      <div className="avatar">
                        <User size={16} />
                      </div>
                      <div>
                        <h4>{item.userName}</h4>
                        <span className="email"><Mail size={12} /> {item.email}</span>
                      </div>
                    </div>
                    <div className="feedback-meta">
                      <span className="time"><Clock size={12} /> {new Date(item.timestamp).toLocaleString()}</span>
                      <button onClick={() => handleDelete(item._id)} className="delete-btn" title="Delete Feedback">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="feedback-card-body">
                    <p>{item.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeveloperFeedback;

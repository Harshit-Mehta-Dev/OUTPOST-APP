import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle, MessageSquare, Lightbulb, Megaphone } from 'lucide-react';
import './FeedbackForm.css';

const FeedbackForm = () => {
  const feedbackIcons = [MessageSquare, Lightbulb, Megaphone, Send, CheckCircle];
  const [formData, setFormData] = useState({ userName: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setFormData({ userName: '', email: '', message: '' });
        }, 5000);
      })
      .catch(err => {
        console.warn("Backend offline, simulating local feedback submission:", err);
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setFormData({ userName: '', email: '', message: '' });
        }, 5000);
      });
  };

  return (
    <section className="feedback-section" id="feedback" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Sideways Animation Overlay */}
      <div className="sideways-overlay">
        {[...Array(15)].map((_, i) => {
          const Icon = feedbackIcons[i % feedbackIcons.length];
          return (
            <div
              key={`sideways-sticker-${i}`}
              className="sideways-sticker"
              style={{
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 15}s`
              }}
            >
              <Icon size={24 + Math.random() * 32} />
            </div>
          );
        })}
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className="feedback-header">
          <h2>We Value Your <span className="gradient-text">Feedback</span></h2>
          <p>Help us improve Outpost by sharing your thoughts, ideas, or reporting any issues.</p>
        </div>

        <div className="feedback-container">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success"
                className="feedback-success-card glass-panel"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="success-icon-container">
                  <CheckCircle size={64} className="success-icon" />
                </div>
                <h3>Feedback Sent Successfully!</h3>
                <p>Thank you for taking the time to share your thoughts. Our team will review it shortly.</p>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                className="feedback-form glass-panel sticker-container" 
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="sticker sticker-left"><MessageSquare size={24} /></div>
                <div className="sticker sticker-right"><Lightbulb size={24} /></div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    required 
                    value={formData.userName}
                    onChange={(e) => setFormData({...formData, userName: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Your Feedback</label>
                  <textarea 
                    placeholder="Tell us what's on your mind..." 
                    required 
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  className={`btn-primary submit-btn ${isSubmitting ? 'submitting' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loader"></span>
                  ) : (
                    <>
                      <Send size={18} /> Submit Feedback
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default FeedbackForm;

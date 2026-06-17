import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle, MessageSquare, Lightbulb, Megaphone } from 'lucide-react';
import './FeedbackForm.css';

const FeedbackForm = () => {
  const [formData, setFormData] = useState({ userName: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    fetch(`${(import.meta.env.VITE_API_URL || 'https://outpost-app.onrender.com')}/api/feedback`, {
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
        console.error("Error submitting feedback:", err);
        setIsSubmitting(false);
      });
  };

  return (
    <section className="feedback-section" id="feedback">
      <div className="container">
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

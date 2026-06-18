import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  Gamepad2, 
  Code2, 
  Tent, 
  Globe, 
  Lock, 
  ChevronRight, 
  Flame 
} from 'lucide-react';
import './CreateCampsiteModal.css';

const CreateCampsiteModal = ({ isOpen, onClose, onCampsiteCreated }) => {
  const [campsiteName, setCampsiteName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('gaming'); // 'gaming', 'dev', 'casual'
  const [isPublic, setIsPublic] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [region, setRegion] = useState('US East');
  const [autoWelcome, setAutoWelcome] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [emblemImage, setEmblemImage] = useState(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setCampsiteName('');
      setSelectedTemplate('gaming');
      setIsPublic(true);
      setShowAdvanced(false);
      setIsSubmitting(false);
      setShowSuccessAnim(false);
      setEmblemImage(null);
    }
  }, [isOpen]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Resize the image so it doesn't break localStorage limits
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setEmblemImage(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!campsiteName.trim()) {
      alert("Please type a Campsite Name in the text box before establishing!");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call and trigger success animation
    setTimeout(() => {
      setShowSuccessAnim(true);
      
      // Wait for success animation to play before closing
      setTimeout(() => {
        onCampsiteCreated({
          name: campsiteName,
          template: selectedTemplate,
          isPublic,
          imageUrl: emblemImage
        });
        onClose();
      }, 1500);
      
    }, 600);
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="create-camp-overlay" onClick={onClose}>
      <motion.div 
        className="create-camp-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {showSuccessAnim ? (
          // SUCCESS ANIMATION VIEW
          <motion.div 
            className="spark-animation-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <Flame size={80} strokeWidth={1.5} />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Campfire Ignited!
            </motion.h3>
          </motion.div>
        ) : (
          // MAIN FORM VIEW
          <>
            <div className="modal-header">
              <h2>Ignite A New Bootcamp</h2>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              {/* 1. Identity Section */}
              <div className="identity-section">
                <label htmlFor="emblem-upload-input" className="emblem-upload">
                  {emblemImage ? (
                    <img src={emblemImage} alt="Emblem" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : campsiteName.trim() ? (
                    <div className="emblem-fallback">
                      {campsiteName.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <Upload size={24} color="rgba(255,255,255,0.5)" />
                  )}
                  <div className="emblem-overlay">
                    <Upload size={20} />
                  </div>
                  <input 
                    type="file" 
                    id="emblem-upload-input" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleImageUpload}
                  />
                </label>
                
                <div className="name-input-wrapper">
                  <label>Campsite Name</label>
                  <input 
                    type="text" 
                    className="name-input"
                    placeholder="e.g. The Dev Underground"
                    value={campsiteName}
                    onChange={(e) => setCampsiteName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* 2. Templates */}
              <div className="templates-section">
                <div className="modal-section-title">Select Your Camp Layout</div>
                <div className="templates-grid">
                  <div 
                    className={`template-card ${selectedTemplate === 'gaming' ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate('gaming')}
                  >
                    <div className="template-icon"><Gamepad2 size={24} /></div>
                    <span>Gaming Guild</span>
                  </div>
                  <div 
                    className={`template-card ${selectedTemplate === 'dev' ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate('dev')}
                  >
                    <div className="template-icon"><Code2 size={24} /></div>
                    <span>Dev Tavern</span>
                  </div>
                  <div 
                    className={`template-card ${selectedTemplate === 'casual' ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate('casual')}
                  >
                    <div className="template-icon"><Tent size={24} /></div>
                    <span>Casual Camp</span>
                  </div>
                </div>
              </div>

              {/* 3. Visibility */}
              <div className="visibility-section">
                <div className="modal-section-title">Camp Visibility</div>
                <div className="visibility-options">
                  <div 
                    className={`radio-card ${isPublic ? 'active' : ''}`}
                    onClick={() => setIsPublic(true)}
                  >
                    <Globe size={20} className="radio-icon" />
                    <div className="radio-text">
                      <h4>Public Basecamp</h4>
                      <p>Discoverable by anyone in the Outpost network.</p>
                    </div>
                  </div>
                  <div 
                    className={`radio-card ${!isPublic ? 'active' : ''}`}
                    onClick={() => setIsPublic(false)}
                  >
                    <Lock size={20} className="radio-icon" />
                    <div className="radio-text">
                      <h4>Hidden Outpost</h4>
                      <p>Invite-only. Hidden from search directories.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Advanced Options */}
              <div className="advanced-accordion">
                <div className="accordion-header" onClick={() => setShowAdvanced(!showAdvanced)}>
                  <ChevronRight size={16} className={`accordion-icon ${showAdvanced ? 'open' : ''}`} />
                  Advanced Operations
                </div>
                
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div 
                      className="advanced-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="advanced-grid">
                        <div className="advanced-item">
                          <label>Default Region</label>
                          <select value={region} onChange={(e) => setRegion(e.target.value)}>
                            <option>US East</option>
                            <option>US West</option>
                            <option>EU Central</option>
                            <option>Asia Pacific</option>
                          </select>
                        </div>
                        <div className="advanced-item">
                          <label>Auto-Welcome Bot</label>
                          <div className="toggle-switch" onClick={() => setAutoWelcome(!autoWelcome)}>
                            <div className={`toggle-bg ${autoWelcome ? 'active' : ''}`}>
                              <div className="toggle-knob"></div>
                            </div>
                            <span>{autoWelcome ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button 
                className="submit-btn" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'IGNITING...' : 'ESTABLISH CAMPSITE'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default CreateCampsiteModal;

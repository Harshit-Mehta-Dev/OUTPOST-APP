import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Image as ImageIcon, Link, Award, Zap } from 'lucide-react';
import './UserProfileModal.css';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Scout&backgroundColor=2c3e50',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Commander&backgroundColor=8e44ad',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Explorer&backgroundColor=16a085',
  'https://api.dicebear.com/7.x/micah/svg?seed=Pioneer&backgroundColor=d35400'
];

const UserProfileModal = ({ isOpen, onClose, user, onSave }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePictureUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('https://outpost-app.onrender.com/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          username,
          profilePictureUrl
        })
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      onSave(updatedUser);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="profile-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="profile-modal-content glass-panel"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="profile-close-btn icon-btn" onClick={onClose}>
              <X size={24} />
            </button>

            <div className="profile-header">
              <h2>Scout Profile</h2>
              <p>Customize your global identity across the Outpost.</p>
            </div>

            <div className="profile-body">
              <div className="profile-preview-section">
                <div className="large-avatar-preview">
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {username ? username.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div className="profile-stats">
                  <div className="stat-badge">
                    <Award size={16} />
                    <span>Level {user?.level || 1}</span>
                  </div>
                  <div className="stat-badge xp-badge">
                    <Zap size={16} />
                    <span>{user?.xp || 0} XP</span>
                  </div>
                </div>
              </div>

              <div className="profile-edit-section">
                <div className="form-group">
                  <label>Display Name</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your scout name..."
                  />
                </div>

                <div className="form-group">
                  <label><Link size={14} style={{ marginRight: '6px' }}/> Avatar URL</label>
                  <input 
                    type="url" 
                    value={profilePictureUrl} 
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                    placeholder="Paste any image URL..."
                  />
                </div>

                <div className="preset-avatars">
                  <label><ImageIcon size={14} style={{ marginRight: '6px' }}/> Or choose a theme preset:</label>
                  <div className="presets-grid">
                    {PRESET_AVATARS.map((url, index) => (
                      <button 
                        key={index} 
                        className={`preset-btn ${profilePictureUrl === url ? 'selected' : ''}`}
                        onClick={() => setProfilePictureUrl(url)}
                      >
                        <img src={url} alt={`Preset ${index + 1}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-footer">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button 
                className="btn-primary flex-center" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : <><Save size={18} style={{ marginRight: '8px' }}/> Save Profile</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;

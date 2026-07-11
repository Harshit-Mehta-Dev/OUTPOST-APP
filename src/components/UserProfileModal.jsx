import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Shield, Award, Zap, Plus, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import './UserProfileModal.css';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Scout&backgroundColor=2c3e50',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Commander&backgroundColor=8e44ad',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Explorer&backgroundColor=16a085',
  'https://api.dicebear.com/7.x/micah/svg?seed=Pioneer&backgroundColor=d35400',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Mech&backgroundColor=c0392b',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Ranger&backgroundColor=27ae60',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Hacker&backgroundColor=2980b9',
  'https://api.dicebear.com/7.x/micah/svg?seed=Sniper&backgroundColor=f39c12'
];

const UserProfileModal = ({ isOpen, onClose, user, onSave }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePictureUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Security State
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 2FA State
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorMessage, setTwoFactorMessage] = useState('');
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(user?.isTwoFactorEnabled || false);
  
  const fileInputRef = useRef(null);

  // Update internal state if user prop changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setProfilePictureUrl(user.profilePictureUrl || '');
    }
  }, [user]);

  if (!isOpen) return null;

  const setup2FA = async () => {
    try {
      const res = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/users/2fa/setup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('outpost_token')}` }
      });
      const data = await res.json();
      if (res.ok) setQrCodeUrl(data.qrCodeUrl);
      else setTwoFactorMessage(data.error);
    } catch (err) {
      setTwoFactorMessage('Failed to setup 2FA');
    }
  };

  const verify2FA = async () => {
    try {
      const res = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/users/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('outpost_token')}` },
        body: JSON.stringify({ token: twoFactorCode })
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFactorMessage('2FA Enabled Successfully!');
        setIsTwoFactorEnabled(true);
      } else {
        setTwoFactorMessage(data.error);
      }
    } catch (err) {
      setTwoFactorMessage('Failed to verify 2FA');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Instantly show it via object URL
      const tempUrl = URL.createObjectURL(file);
      setProfilePictureUrl(tempUrl);

      // 2. Convert to Base64 for saving
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePictureUrl(reader.result); // Overwrite temp with Base64
      };
      reader.readAsDataURL(file);
    }
  };

  // Password Strength Logic
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length > 7) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: '#e74c3c' };
    if (score <= 4) return { score, label: 'Medium', color: '#f1c40f' };
    return { score, label: 'Strong', color: '#2ecc71' };
  };

  const strength = getPasswordStrength(newPassword);

  const isSaveDisabled = isSaving || 
    (newPassword && (newPassword !== confirmPassword || newPassword.length < 8));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        email: user.email,
        username,
        profilePictureUrl
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update profile');
      }

      const updatedUser = await res.json();
      const didChangePassword = !!newPassword;
      onSave(updatedUser, didChangePassword);
      
      // Reset security fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSecurityOpen(false);
    } catch (err) {
      console.warn("Backend offline, updating profile locally:", err);
      // Fallback: update localStorage and state directly to keep app functional
      const userStr = localStorage.getItem('outpost_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          user.profilePictureUrl = profilePictureUrl;
          localStorage.setItem('outpost_user', JSON.stringify(user));
          onSave(user); // update parent state
          onClose();
        } catch(e) {}
      }
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
              <h2>Scout Registry</h2>
            </div>

            <div className="profile-body">
              <div className="profile-preview-section">
                <div 
                  className="interactive-avatar-container"
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="large-avatar-preview interactive-avatar">
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="Avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        {username ? username.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div className="avatar-hover-overlay">Upload custom image</div>
                  </div>
                  <div className="avatar-plus-badge"><Plus size={16} /></div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".png, .jpg, .jpeg, .webp"
                    onChange={handleImageUpload}
                  />
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

              <div className="preset-avatars">
                <label>Select a Basecamp Theme Preset:</label>
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

              <div className="profile-edit-section">
                <div className="form-group identity-input-group">
                  <label>Display Name</label>
                  <input 
                    type="text" 
                    value={username} 
                    maxLength={32}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your scout name..."
                  />
                  <span className="char-counter">{username.length}/32</span>
                </div>

                <div className="security-accordion">
                  <button 
                    className="security-toggle" 
                    onClick={() => setIsSecurityOpen(!isSecurityOpen)}
                  >
                    <Shield size={16} />
                    🔒 Change Security Credentials
                    {isSecurityOpen ? <ChevronUp size={16} className="margin-left-auto"/> : <ChevronDown size={16} className="margin-left-auto"/>}
                  </button>
                  
                  <AnimatePresence>
                    {isSecurityOpen && (
                      <motion.div 
                        className="security-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <div className="form-group password-group">
                          <label>Current Password</label>
                          <div className="password-input-wrapper">
                            <input 
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={e => setCurrentPassword(e.target.value)}
                              placeholder="••••••••••••••••"
                            />
                            <button 
                              type="button" 
                              className="password-toggle-btn" 
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="form-group password-group">
                          <label>New Password</label>
                          <div className="password-input-wrapper">
                            <input 
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="••••••••••••••••"
                            />
                            <button 
                              type="button" 
                              className="password-toggle-btn" 
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {newPassword && (
                            <div className="strength-meter-container">
                              <div className="strength-bar-bg">
                                <div 
                                  className="strength-bar-fill" 
                                  style={{ 
                                    width: `${(strength.score / 5) * 100}%`,
                                    backgroundColor: strength.color 
                                  }} 
                                />
                              </div>
                              <span className="strength-label" style={{ color: strength.color }}>
                                {strength.label}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="form-group password-group">
                          <label>Confirm New Password</label>
                          <div className="password-input-wrapper">
                            <input 
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              placeholder="••••••••••••••••"
                            />
                            <button 
                              type="button" 
                              className="password-toggle-btn" 
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {confirmPassword && newPassword !== confirmPassword && (
                            <span className="error-text">Passwords do not match</span>
                          )}
                        </div>
                        
                        <div className="form-group password-group" style={{ marginTop: '20px', borderTop: '1px solid #3a3f55', paddingTop: '15px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={16} /> Two-Factor Authentication (2FA)
                          </label>
                          {isTwoFactorEnabled ? (
                            <div style={{ color: '#2ecc71', fontWeight: 'bold' }}>✅ 2FA is currently enabled on your account.</div>
                          ) : (
                            <div className="two-factor-setup">
                              <p style={{ fontSize: '0.85rem', color: '#a0a5b5', marginBottom: '10px' }}>Enable 2FA to protect your account and allow password resets.</p>
                              {!qrCodeUrl ? (
                                <button type="button" onClick={setup2FA} className="save-btn" style={{ background: '#3498db' }}>Setup 2FA with Google Authenticator</button>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: '150px', height: '150px', borderRadius: '8px', alignSelf: 'center' }} />
                                  <input 
                                    type="text" 
                                    placeholder="Enter 6-digit code" 
                                    value={twoFactorCode} 
                                    onChange={e => setTwoFactorCode(e.target.value)} 
                                    maxLength={6}
                                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
                                  />
                                  <button type="button" onClick={verify2FA} className="save-btn">Verify and Enable</button>
                                </div>
                              )}
                              {twoFactorMessage && <div style={{ marginTop: '10px', fontSize: '0.9rem', color: twoFactorMessage.includes('Success') ? '#2ecc71' : '#e74c3c' }}>{twoFactorMessage}</div>}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="profile-footer">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button 
                className={`btn-primary flex-center ${isSaveDisabled ? 'disabled' : ''}`} 
                onClick={handleSave}
                disabled={isSaveDisabled}
              >
                {isSaving ? 'Saving...' : <><Save size={18} style={{ marginRight: '8px' }}/> SAVE PROFILE</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;

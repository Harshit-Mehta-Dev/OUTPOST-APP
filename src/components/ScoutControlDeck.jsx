import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Headphones, LogOut, Sun, Moon, Volume2, Mic2, X, Trash2, Clock, RefreshCw, HeartPulse } from 'lucide-react';
import './ScoutControlDeck.css';

export default function ScoutControlDeck({ isDarkMode, toggleTheme, onLogout, currentUser }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [modalView, setModalView] = useState('settings'); // 'settings', 'logout', 'delete'
  const [isDeleteChecked, setIsDeleteChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Audio Device State
  const [micSensitivity, setMicSensitivity] = useState(() => Number(localStorage.getItem('outpost_mic_sens')) || 50);
  const [outputVolume, setOutputVolume] = useState(() => Number(localStorage.getItem('outpost_out_vol')) || 50);
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedInput, setSelectedInput] = useState(() => localStorage.getItem('outpost_sel_in') || '');
  const [selectedOutput, setSelectedOutput] = useState(() => localStorage.getItem('outpost_sel_out') || '');

  // Audio link synchronization logic
  const handleDeafenClick = () => {
    const targetState = !isDeafened;
    setIsDeafened(targetState);
    if (targetState) {
      setIsMuted(true); // Always mute mic when deafened
    }
  };

  // Fetch audio devices
  const loadAudioDevices = async () => {
    try {
      // Prompt user for permission to get real device labels
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const inputs = devices.filter(d => d.kind === 'audioinput');
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      
      setAudioInputs(inputs);
      setAudioOutputs(outputs);
      
      if (inputs.length > 0 && !selectedInput) setSelectedInput(inputs[0].deviceId);
      if (outputs.length > 0 && !selectedOutput) setSelectedOutput(outputs[0].deviceId);
    } catch (err) {
      console.warn("Audio permissions denied or unavailable", err);
    }
  };

  // When panel opens, load devices
  useEffect(() => {
    if (modalView !== 'closed') {
      loadAudioDevices();
    }
  }, [modalView]);

  // Save settings on change
  useEffect(() => {
    localStorage.setItem('outpost_mic_sens', micSensitivity);
  }, [micSensitivity]);
  
  useEffect(() => {
    localStorage.setItem('outpost_out_vol', outputVolume);
  }, [outputVolume]);
  
  useEffect(() => {
    if (selectedInput) localStorage.setItem('outpost_sel_in', selectedInput);
  }, [selectedInput]);
  
  useEffect(() => {
    if (selectedOutput) localStorage.setItem('outpost_sel_out', selectedOutput);
  }, [selectedOutput]);

  // Click outside to close (optional for full screen, maybe keep it but adjusted, or just rely on close button)
  // We'll rely on the close button or clicking the overlay to close it.

  return (
    <div className="scout-control-deck-wrapper">
      
      {/* 🚀 Full-Screen Scout Control Panel Modal */}
      <AnimatePresence>
        {modalView !== 'closed' && (
          <motion.div 
            className="scout-fullscreen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target.classList.contains('scout-fullscreen-overlay')) {
                setModalView('closed');
              }
            }}
          >
            <motion.div 
              className="scout-fullscreen-modal"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()} // Prevent clicking inside modal from closing it
            >
              
              {modalView === 'settings' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 className="modal-header-large">🏕️ SCOUT CONTROL PANEL</h2>
                      <p className="modal-subtitle">Manage your audio and account settings</p>
                    </div>
                    <button onClick={() => setModalView('closed')} className="modal-close-btn">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="modal-settings-grid">
                    <div>
                      <label className="tactical-label">
                        <Mic2 size={12} className="inline-icon" /> Mic Sensitivity
                      </label>
                      <input 
                        type="range" 
                        className="tactical-range accent-orange" 
                        value={micSensitivity} 
                        onChange={e => setMicSensitivity(e.target.value)} 
                      />
                    </div>
                    
                    <div>
                      <label className="tactical-label">
                        <Volume2 size={12} className="inline-icon" /> Output Volume
                      </label>
                      <input 
                        type="range" 
                        className="tactical-range accent-orange" 
                        value={outputVolume} 
                        onChange={e => setOutputVolume(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="modal-settings-grid" style={{ marginTop: '8px' }}>
                    <div className="hardware-selector">
                      <span className="selector-label">Input:</span>
                      <select 
                        className="tactical-select" 
                        value={selectedInput} 
                        onChange={e => setSelectedInput(e.target.value)}
                      >
                        {audioInputs.length === 0 && <option>Default - System Mic</option>}
                        {audioInputs.map(device => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="hardware-selector">
                      <span className="selector-label">Output:</span>
                      <select 
                        className="tactical-select"
                        value={selectedOutput}
                        onChange={e => setSelectedOutput(e.target.value)}
                      >
                        {audioOutputs.length === 0 && <option>Default - System Speakers</option>}
                        {audioOutputs.map(device => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Speaker ${device.deviceId.substring(0, 5)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <hr className="tactical-divider" />

                  <div className="account-management-section">
                    <div className="account-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="account-action-info" style={{ textAlign: 'left' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Close your account</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Permanently close your account.</p>
                      </div>
                      <button 
                        className="btn-delete-account" 
                        style={{ background: '#e11d48', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                        onClick={() => {
                          setIsDeleteChecked(false);
                          setModalView('delete');
                        }}
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>

                  <hr className="tactical-divider" />

                  <button 
                    onClick={() => setModalView('logout')}
                    className="btn-decommission"
                    style={{ background: '#3f3f46', marginTop: '10px', fontSize: '1rem', padding: '12px 0' }}
                  >
                    Log Out
                  </button>
                </>
              )}

              {modalView === 'delete' && (
                <>
                  <div>
                    <h2 className="modal-header-large" style={{ color: 'var(--text-primary)' }}>Delete Your Account</h2>
                    <p className="modal-subtitle">Before continuing, please review what happens next.</p>
                  </div>
                  
                  <div className="deletion-cards-container">
                    <div className="deletion-card">
                      <div className="deletion-card-icon icon-red">
                        <Trash2 size={20} />
                      </div>
                      <div className="deletion-card-content">
                        <h4>Permanent Data Removal</h4>
                        <p>Your profile, ratings, watchlists, and preferences will be erased and cannot be recovered</p>
                      </div>
                    </div>
                    
                    <div className="deletion-card">
                      <div className="deletion-card-icon icon-purple">
                        <Clock size={20} />
                      </div>
                      <div className="deletion-card-content">
                        <h4>90 Day Delete Window</h4>
                        <p>Your account will be scheduled for deletion and permanently removed after 90 days</p>
                      </div>
                    </div>
                    
                    <div className="deletion-card">
                      <div className="deletion-card-icon icon-blue">
                        <RefreshCw size={20} />
                      </div>
                      <div className="deletion-card-content">
                        <h4>Change Your Mind?</h4>
                        <p>You can log in anytime during the next 90 days and cancel the deletion</p>
                      </div>
                    </div>
                    
                    <div className="deletion-card">
                      <div className="deletion-card-icon icon-orange">
                        <HeartPulse size={20} />
                      </div>
                      <div className="deletion-card-content">
                        <h4 className="active-restriction-text" style={{ display: 'inline-block' }}>Active Account Restriction</h4>
                        <p>Accounts currently under active strike cannot be deleted until the strike ends</p>
                      </div>
                    </div>
                  </div>

                  <div className="deletion-footer">
                    <label className="deletion-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={isDeleteChecked}
                        onChange={(e) => setIsDeleteChecked(e.target.checked)}
                        style={{ accentColor: '#e11d48', width: '16px', height: '16px' }}
                      />
                      I understand that my account and data will be permanently deleted
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setModalView('settings')} className="modal-close-btn" style={{ border: 'none' }}>Back</button>
                      <button 
                        className={`btn-proceed-delete ${isDeleteChecked ? 'enabled' : ''}`}
                        disabled={!isDeleteChecked || isDeleting}
                        onClick={async () => {
                          if (!currentUser?.email) return;
                          setIsDeleting(true);
                          try {
                            const response = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/users/${currentUser.email}`, {
                              method: 'DELETE'
                            });
                            if (response.ok) {
                              onLogout();
                            } else {
                              alert(`Failed to delete account`);
                            }
                          } catch (error) {
                            console.warn(`Backend offline, simulating account deletion locally:`, error);
                            onLogout();
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                      >
                        {isDeleting ? 'Processing...' : 'Proceed to Delete'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {modalView === 'logout' && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <h2 className="modal-header-large" style={{ justifyContent: 'center', marginBottom: '8px' }}>Logout of your account?</h2>
                  <p className="modal-subtitle" style={{ marginBottom: '32px' }}>You will need to log back in to access your basecamps.</p>
                  <div className="logout-actions" style={{ justifyContent: 'center', gap: '16px' }}>
                    <button onClick={() => setModalView('settings')} className="btn-stay" style={{ padding: '8px 24px', fontSize: '1rem' }}>Cancel</button>
                    <button onClick={onLogout} className="btn-leave" style={{ padding: '8px 24px', fontSize: '1rem' }}>Logout</button>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛠️ Bottom Interface Deck Icons */}
      <div className="scout-deck-panel">
        
        {/* Microphone */}
        <button 
          onClick={() => setIsMuted(!isMuted)}
          onContextMenu={(e) => { e.preventDefault(); setModalView(modalView === 'closed' ? 'settings' : 'closed'); }}
          className={`deck-btn ${isMuted ? 'muted-state' : ''}`}
          title="Left click: Toggle Mic | Right click: Settings"
        >
          {isMuted ? (
            <div className="slashed-icon">
              <Mic size={18} />
              <div className="slash-line"></div>
            </div>
          ) : (
            <Mic size={18} />
          )}
        </button>

        {/* Headphones */}
        <button 
          onClick={handleDeafenClick}
          onContextMenu={(e) => { e.preventDefault(); setModalView(modalView === 'closed' ? 'settings' : 'closed'); }}
          className={`deck-btn ${isDeafened ? 'muted-state' : ''}`}
          title="Left click: Deafen | Right click: Settings"
        >
          {isDeafened ? (
            <div className="slashed-icon">
              <Headphones size={18} />
              <div className="slash-line"></div>
            </div>
          ) : (
            <Headphones size={18} />
          )}
        </button>



        {/* Safe Logout Trigger */}
        <button 
          onClick={() => setModalView('logout')}
          className="deck-btn exit-btn"
          title="Log Out"
        >
          <LogOut size={18} />
        </button>

      </div>
    </div>
  );
}

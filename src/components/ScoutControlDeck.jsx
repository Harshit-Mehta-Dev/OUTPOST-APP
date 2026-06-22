import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Headphones, LogOut, Sun, Moon, Volume2, Mic2 } from 'lucide-react';
import './ScoutControlDeck.css';

export default function ScoutControlDeck({ isDarkMode, toggleTheme, onLogout, currentUser }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

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
    if (showAdvancedPanel) {
      loadAudioDevices();
    } else {
      setShowLogoutConfirm(false); // reset confirm state when closing
      setShowDeleteConfirm(false);
      setShowDisableConfirm(false);
    }
  }, [showAdvancedPanel]);

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

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAdvancedPanel && !e.target.closest('.scout-control-deck-wrapper')) {
        setShowAdvancedPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAdvancedPanel]);

  return (
    <div className="scout-control-deck-wrapper">
      
      {/* 🚀 Advanced Floating Tactical Pop-up */}
      <AnimatePresence>
        {showAdvancedPanel && (
          <motion.div 
            className="advanced-tactical-popup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <p className="tactical-popup-header">🏕️ SCOUT CONTROL PANEL</p>
            
            <label className="tactical-label">
              <Mic2 size={12} className="inline-icon" /> Mic Sensitivity
            </label>
            <input 
              type="range" 
              className="tactical-range accent-orange" 
              value={micSensitivity} 
              onChange={e => setMicSensitivity(e.target.value)} 
            />
            
            <label className="tactical-label">
              <Volume2 size={12} className="inline-icon" /> Output Volume
            </label>
            <input 
              type="range" 
              className="tactical-range accent-orange mb-4" 
              value={outputVolume} 
              onChange={e => setOutputVolume(e.target.value)} 
            />

            <label className="tactical-label">Hardware Check:</label>
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
            <div className="hardware-selector mb-4">
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

            <hr className="tactical-divider" />

            <div className="account-management-section">
              <div className="account-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="account-action-info" style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Disable your account</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Temporarily disable your account.</p>
                </div>
                <button 
                  className="btn-disable-account" 
                  style={{ background: 'transparent', border: '1px solid var(--border-glass)', color: '#ff6b6b', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                  onClick={() => setShowDisableConfirm(true)}
                >
                  Disable Account
                </button>
              </div>

              <div className="account-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="account-action-info" style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Close your account</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Permanently close your account.</p>
                </div>
                <button 
                  className="btn-delete-account" 
                  style={{ background: '#e11d48', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </button>
              </div>
            </div>

            <hr className="tactical-divider" />

            {showDisableConfirm ? (
              <div className="logout-confirm-gate">
                <p className="logout-warning" style={{ color: '#ff6b6b' }}>Temporarily disable account?</p>
                <div className="logout-actions">
                  <button onClick={() => setShowDisableConfirm(false)} className="btn-stay">Cancel</button>
                  <button 
                    onClick={async () => {
                      if (!currentUser?.email) return;
                      setIsDisabling(true);
                      try {
                        const response = await fetch(`${(import.meta.env.VITE_CORE_API_URL || 'http://localhost:5002')}/api/users/${currentUser.email}/disable`, {
                          method: 'PATCH'
                        });
                        if (response.ok) {
                          onLogout();
                        } else {
                          alert(`Failed to disable account`);
                        }
                      } catch (error) {
                        alert(`Error disabling account: ${error.message}`);
                      } finally {
                        setIsDisabling(false);
                      }
                    }} 
                    className="btn-leave" 
                    style={{ background: '#ff6b6b', color: '#1a1a1a' }}
                    disabled={isDisabling}
                  >
                    {isDisabling ? 'Disabling...' : 'Disable'}
                  </button>
                </div>
              </div>
            ) : showDeleteConfirm ? (
              <div className="logout-confirm-gate">
                <p className="logout-warning" style={{ color: '#e11d48' }}>Permanently delete account?</p>
                <div className="logout-actions">
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn-stay">Cancel</button>
                  <button 
                    onClick={async () => {
                      if (!currentUser?.email) return;
                      setIsDeleting(true);
                      try {
                        const response = await fetch(`${(import.meta.env.VITE_CORE_API_URL || 'http://localhost:5002')}/api/users/${currentUser.email}`, {
                          method: 'DELETE'
                        });
                        if (response.ok) {
                          onLogout();
                        } else {
                          alert(`Failed to delete account`);
                        }
                      } catch (error) {
                        alert(`Error deleting account: ${error.message}`);
                      } finally {
                        setIsDeleting(false);
                      }
                    }} 
                    className="btn-leave" 
                    style={{ background: '#e11d48' }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : showLogoutConfirm ? (
              <div className="logout-confirm-gate">
                <p className="logout-warning">Abandon the Basecamp?</p>
                <div className="logout-actions">
                  <button onClick={() => setShowLogoutConfirm(false)} className="btn-stay">Stay</button>
                  <button onClick={onLogout} className="btn-leave">Leave</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="btn-decommission"
              >
                🚪 Decommission Session
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛠️ Bottom Interface Deck Icons */}
      <div className="scout-deck-panel">
        
        {/* Microphone */}
        <button 
          onClick={() => setIsMuted(!isMuted)}
          onContextMenu={(e) => { e.preventDefault(); setShowAdvancedPanel(!showAdvancedPanel); }}
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
          onContextMenu={(e) => { e.preventDefault(); setShowAdvancedPanel(!showAdvancedPanel); }}
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
          onClick={() => { setShowAdvancedPanel(true); setShowLogoutConfirm(true); }}
          className="deck-btn exit-btn"
          title="Abandon Camp"
        >
          <LogOut size={18} />
        </button>

      </div>
    </div>
  );
}

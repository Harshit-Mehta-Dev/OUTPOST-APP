import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Headphones, LogOut, Sun, Moon, Volume2, Mic2 } from 'lucide-react';
import './ScoutControlDeck.css';

export default function ScoutControlDeck({ isDarkMode, toggleTheme, onLogout }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Audio Device State
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedInput, setSelectedInput] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');

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
    }
  }, [showAdvancedPanel]);

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
            <input type="range" className="tactical-range accent-orange" />
            
            <label className="tactical-label">
              <Volume2 size={12} className="inline-icon" /> Output Volume
            </label>
            <input type="range" className="tactical-range accent-orange mb-4" />

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

            {showLogoutConfirm ? (
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

        {/* Sun/Moon Icon */}
        <button 
          className="deck-btn theme-toggle" 
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
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

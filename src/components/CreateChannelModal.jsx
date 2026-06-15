import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Hash, Volume2, MessageSquare } from 'lucide-react';
import './CreateChannelModal.css';

const CreateChannelModal = ({ isOpen, onClose, onCreateChannel }) => {
  const [channelType, setChannelType] = useState('text');
  const [channelName, setChannelName] = useState('');
  const [channelTopic, setChannelTopic] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!channelName.trim()) {
      alert("Please type a Name for the expedition in the text box before igniting!");
      return;
    }
    if (channelName.trim()) {
      onCreateChannel({
        name: channelName.trim().replace(/\s+/g, '-').toLowerCase(),
        type: channelType,
        topic: channelTopic.trim()
      });
      onClose();
    }
  };

  return (
    <div className="create-channel-overlay">
      <motion.div 
        className="create-channel-content"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="channel-modal-header">
          <h2>Initiate Expedition</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="channel-modal-body">
          <h3 className="channel-section-title">Select Expedition Type</h3>
          <div className="channel-types">
            
            <div className="channel-type-option" onClick={() => setChannelType('text')}>
              <div className="type-radio">
                <input type="radio" checked={channelType === 'text'} readOnly />
              </div>
              <div className="type-info">
                <h4><Hash size={20} /> Text Channel</h4>
                <p>Send messages, images, GIFs, emojis, opinions, and puns.</p>
              </div>
              {channelType === 'text' && (
                <motion.div layoutId="type-highlight" className="channel-type-bg" />
              )}
            </div>

            <div className="channel-type-option" onClick={() => setChannelType('voice')}>
              <div className="type-radio">
                <input type="radio" checked={channelType === 'voice'} readOnly />
              </div>
              <div className="type-info">
                <h4><Volume2 size={20} /> The Hearth (Voice)</h4>
                <p>Hang out together with crystal-clear voice, video, and screen sharing.</p>
              </div>
              {channelType === 'voice' && (
                <motion.div layoutId="type-highlight" className="channel-type-bg" />
              )}
            </div>

            <div className="channel-type-option" onClick={() => setChannelType('forum')}>
              <div className="type-radio">
                <input type="radio" checked={channelType === 'forum'} readOnly />
              </div>
              <div className="type-info">
                <h4><MessageSquare size={20} /> The Forum</h4>
                <p>Create an organized space for threaded, asynchronous discussions.</p>
              </div>
              {channelType === 'forum' && (
                <motion.div layoutId="type-highlight" className="channel-type-bg" />
              )}
            </div>
            
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 -30px 25px -30px' }}></div>

          <h3 className="channel-section-title">Expedition Identity</h3>
          <div className="input-group">
            <label>Name</label>
            <div className="channel-input-wrapper">
              <span className="channel-input-prefix">
                {channelType === 'text' ? <Hash size={16} /> : channelType === 'voice' ? <Volume2 size={16} /> : <MessageSquare size={16} />}
              </span>
              <input 
                type="text" 
                className="channel-input" 
                placeholder="new-expedition"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Briefing (Channel Topic Box)</label>
            <textarea 
              className="channel-textarea" 
              placeholder="Write the core mission objective or rules for this channel..."
              value={channelTopic}
              onChange={(e) => setChannelTopic(e.target.value)}
            />
            <span className="input-hint">*This text will anchor permanently to the very top header of the channel.</span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0 -30px 25px -30px' }}></div>

          <h3 className="channel-section-title">Safety & Visibility Toggles</h3>
          <div className="toggle-row" style={{ padding: 0, marginBottom: '15px' }}>
            <div className="toggle-info">
              <strong>Private Expedition</strong>
              <span>Only selected roles and invited Scouts can cross this line.</span>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
          
          <div className="toggle-row" style={{ padding: 0 }}>
            <div className="toggle-info">
              <strong>Restricted Perimeter (18+)</strong>
              <span>Enforces an age confirmation gate specifically for this channel.</span>
            </div>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>

        </div>

        <div className="channel-modal-footer">
          <button className="btn-retreat" onClick={onClose}>Retreat</button>
          <button 
            className="btn-ignite" 
            onClick={handleSubmit}
          >
            Ignite Expedition
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default CreateChannelModal;

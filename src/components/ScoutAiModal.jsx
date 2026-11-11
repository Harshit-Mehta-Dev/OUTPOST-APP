import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import AiNexus from './AiNexus';
import './ScoutAiModal.css';

/**
 * ScoutAiModal
 * Interactive Pop-up / Modal window for direct access to Scout AI from any channel or group chat.
 * Features:
 * - Direct pop-up access with animated backdrop and glassmorphic card.
 * - Same complete AiNexus cognitive experience (binary face background, sweet voice modulation, actions).
 * - Fullscreen toggle and clean dismiss.
 */
const ScoutAiModal = ({ isOpen, onClose, currentUser, activeCampsite, onExecuteAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="scout-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className={`scout-modal-dialog ${isExpanded ? 'is-fullscreen' : ''}`}
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Window Control Bar */}
          <div className="scout-modal-header">
            <div className="scout-modal-header-left">
              <div className="scout-modal-badge">
                <img src="/ai-scout-logo.png" alt="Scout AI" className="scout-modal-logo" />
                <span className="scout-modal-pulse" />
              </div>
              <div className="scout-modal-title-wrap">
                <span className="scout-modal-title">Ai-Scout Companion</span>
                <span className="scout-modal-subtitle">
                  <Sparkles size={11} className="scout-modal-sparkle" /> Direct Expedition Link · {activeCampsite?.name || 'Outpost HQ'}
                </span>
              </div>
            </div>

            <div className="scout-modal-header-actions">
              <button 
                className="scout-modal-btn" 
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse View" : "Maximize View"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button 
                className="scout-modal-btn scout-modal-btn-close" 
                onClick={onClose}
                title="Close Ai-Scout"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Modal Body hosting full AiNexus */}
          <div className="scout-modal-body">
            <AiNexus 
              currentUser={currentUser}
              activeCampsite={activeCampsite}
              onExecuteAction={onExecuteAction}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScoutAiModal;

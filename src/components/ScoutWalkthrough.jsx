import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Award, 
  Zap, 
  CheckCircle, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import './ScoutWalkthrough.css';

const TOUR_STEPS = [
  {
    targetSelector: '[data-tour="basecamps"]',
    title: '⛺ Outpost Basecamps',
    description: 'Welcome Scout! This sidebar lists all your active Outposts & Basecamps. Click between them to switch communities instantly.',
    position: 'right',
    icon: '⛺'
  },
  {
    targetSelector: '[data-tour="channels"]',
    title: '💬 Expeditions & Channels',
    description: 'Explore text channels, voice expeditions, AI-Scout, and the Basecamp Board for your current outpost right here.',
    position: 'right',
    icon: '💬'
  },
  {
    targetSelector: '[data-tour="profile"]',
    title: '🛡️ Scout Registry',
    description: 'Click your avatar to open your Scout Registry. Customize your avatar, select basecamp themes, and check your XP level.',
    position: 'top-right',
    icon: '🛡️'
  },
  {
    targetSelector: '[data-tour="trail-markers"]',
    title: '📍 Trail Markers & Weather',
    description: 'Check live trail weather forecast and broadcast basecamp condition markers (Clear Skies, Campfire Active) to all scouts.',
    position: 'bottom',
    icon: '📍'
  },
  {
    targetSelector: '[data-tour="chill-zone"]',
    title: '🎵 Spotify Chill Zone',
    description: 'Listen to lofi beats, ambient study tunes, and chill jazz without leaving Outpost while you chat with your team.',
    position: 'bottom-left',
    icon: '🎵'
  },
  {
    targetSelector: '[data-tour="signal-radar"]',
    title: '🛰️ Signal Radar & Alerts',
    description: 'Stay updated with real-time notifications, XP level-ups, and community decrees delivered directly to your radar.',
    position: 'bottom-left',
    icon: '🛰️'
  }
];

const ScoutWalkthrough = ({ isOpen, onClose, onComplete, currentUser }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Calculate target element position on screen
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !currentStep) return;
    
    const element = document.querySelector(currentStep.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      // Scroll target into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      // Fallback: center of screen if element not present
      setTargetRect({
        top: window.innerHeight / 2 - 50,
        left: window.innerWidth / 2 - 50,
        width: 100,
        height: 100
      });
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      updateTargetPosition();
      window.addEventListener('resize', updateTargetPosition);
      window.addEventListener('scroll', updateTargetPosition);
      return () => {
        window.removeEventListener('resize', updateTargetPosition);
        window.removeEventListener('scroll', updateTargetPosition);
      };
    }
  }, [isOpen, currentStepIndex, updateTargetPosition]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('outpost_tour_completed', 'true');
    if (onComplete) onComplete();
    onClose();
  };

  // Compute position style for tooltip box
  const getTooltipStyle = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const padding = 16;
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      return {
        bottom: '24px',
        left: '16px',
        right: '16px',
        maxWidth: 'calc(100vw - 32px)'
      };
    }

    switch (currentStep.position) {
      case 'right':
        return {
          top: Math.max(20, Math.min(window.innerHeight - 300, targetRect.top)),
          left: targetRect.left + targetRect.width + padding
        };
      case 'bottom':
        return {
          top: targetRect.top + targetRect.height + padding,
          left: Math.max(20, Math.min(window.innerWidth - 380, targetRect.left))
        };
      case 'bottom-left':
        return {
          top: targetRect.top + targetRect.height + padding,
          left: Math.max(20, targetRect.left + targetRect.width - 340)
        };
      case 'top-right':
        return {
          top: Math.max(20, targetRect.top - 260),
          left: targetRect.left + targetRect.width + padding
        };
      default:
        return {
          top: targetRect.top + targetRect.height + padding,
          left: targetRect.left
        };
    }
  };

  return (
    <AnimatePresence>
      <div className="scout-walkthrough-overlay">
        {/* SVG Spotlight Cutout Mask */}
        <svg className="scout-spotlight-svg">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Glowing Spotlight Pulse Ring */}
        {targetRect && (
          <motion.div
            className="scout-target-spotlight-ring"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16
            }}
          />
        )}

        {/* Interactive Tooltip Card */}
        <motion.div
          className="scout-walkthrough-card glass-panel"
          style={getTooltipStyle()}
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header Banner */}
          <div className="scout-walkthrough-header">
            <div className="scout-walkthrough-title-group">
              <span className="scout-step-icon">{currentStep.icon}</span>
              <div>
                <span className="scout-tour-badge">Quick Learning • Step {currentStepIndex + 1}/{TOUR_STEPS.length}</span>
                <h3>{currentStep.title}</h3>
              </div>
            </div>
            <button className="scout-close-btn" onClick={handleFinish} title="Skip Tour">
              <X size={16} />
            </button>
          </div>

          {/* Description Body */}
          <p className="scout-walkthrough-desc">{currentStep.description}</p>

          {/* Progress Indicators */}
          <div className="scout-walkthrough-dots">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`scout-dot ${idx === currentStepIndex ? 'active' : idx < currentStepIndex ? 'completed' : ''}`}
                onClick={() => setCurrentStepIndex(idx)}
              />
            ))}
          </div>

          {/* Footer Controls */}
          <div className="scout-walkthrough-footer">
            <button
              className="scout-btn-secondary"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              style={{ opacity: currentStepIndex === 0 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <button className="scout-btn-skip" onClick={handleFinish}>
              Skip
            </button>

            <button className="scout-btn-primary" onClick={handleNext}>
              {currentStepIndex === TOUR_STEPS.length - 1 ? (
                <>Finish & Claim +50 XP <Sparkles size={16} /></>
              ) : (
                <>Next <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScoutWalkthrough;

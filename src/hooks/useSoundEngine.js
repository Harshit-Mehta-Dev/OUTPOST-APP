import { useEffect, useRef } from 'react';

export const useSoundEngine = () => {
  const audioCtxRef = useRef(null);

  useEffect(() => {
    // Initialize audio context only on first user interaction to comply with browser autoplay policies
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    const playClickSound = () => {
      if (!audioCtxRef.current) return;
      
      const audioCtx = audioCtxRef.current;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      // Premium subtle 'tick' sound profile
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // High pitch start
      oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05); // Quick drop

      // Volume envelope
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Quiet start
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); // Fade out fast

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.05);
    };

    const handleGlobalClick = (e) => {
      // Ensure audio context is ready
      initAudio();

      // Check if clicked element is interactive
      const isClickable = e.target.closest(
        'button, a, input, select, .icon-btn, .channel-item, .campsite-item, .signal-card, .theme-swatch, .color-circle, [role="button"]'
      );

      if (isClickable) {
        playClickSound();
      }
    };

    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);
};

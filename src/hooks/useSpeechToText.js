import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechToText — Rock-solid, crash-free real-time speech dictation hook.
 *
 * Design principles:
 * - Zero dependency on the callback in useEffect deps (uses ref pattern).
 * - No alert() calls anywhere — silent fallback only.
 * - Single recognition instance per hook mount — never recreated.
 * - Continuous auto-restart after silence (keeps mic hot).
 * - Safe cleanup on unmount.
 */
export function useSpeechToText({ onTranscriptChange } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);           // mirror for inside callbacks
  const callbackRef = useRef(onTranscriptChange); // stable ref for the callback
  const baseRef = useRef('');                      // accumulated final text

  // Keep callbackRef current without triggering effects
  useEffect(() => {
    callbackRef.current = onTranscriptChange;
  });

  // Build recognition ONCE on mount
  useEffect(() => {
    const SR = typeof window !== 'undefined'
      && (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SR) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN'; // Best for Indian-English accent

    rec.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
    };

    rec.onresult = (event) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          final += r[0].transcript;
        } else {
          interim += r[0].transcript;
        }
      }

      if (final) {
        const joined = baseRef.current
          ? baseRef.current.trimEnd() + ' ' + final.trim()
          : final.trim();
        baseRef.current = joined;
        if (typeof callbackRef.current === 'function') {
          callbackRef.current(joined);
        }
      } else if (interim) {
        const preview = baseRef.current
          ? baseRef.current.trimEnd() + ' ' + interim
          : interim;
        if (typeof callbackRef.current === 'function') {
          callbackRef.current(preview);
        }
      }
    };

    rec.onerror = (e) => {
      // 'no-speech' fires naturally on silence — not a real error
      if (e.error === 'no-speech') return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone access denied. Please allow microphone in browser settings.');
        isListeningRef.current = false;
        setIsListening(false);
      }
      // All other errors: just log, let onend restart if still active
      console.warn('[Scout STT] Recognition error:', e.error);
    };

    rec.onend = () => {
      // Auto-restart if the user hasn't manually stopped
      if (isListeningRef.current) {
        try {
          rec.start();
        } catch {
          isListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;

    return () => {
      isListeningRef.current = false;
      try { rec.stop(); } catch { /* ignore */ }
    };
  }, []); // runs once only

  const startListening = useCallback((startingText = '') => {
    if (!recognitionRef.current) return;
    // Reset accumulated base to whatever is already in the input
    baseRef.current = startingText ? startingText.trimEnd() : '';
    isListeningRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      if (e.name === 'InvalidStateError') {
        // Already running — that's fine
        setIsListening(true);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback((startingText = '') => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening(startingText);
    }
  }, [startListening, stopListening]);

  return { isListening, isSupported, error, startListening, stopListening, toggleListening };
}

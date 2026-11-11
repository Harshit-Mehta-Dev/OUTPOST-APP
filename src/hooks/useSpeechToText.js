import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechToText — Robust, highly compatible real-time speech dictation hook.
 * 
 * Works across Chrome, Edge, Safari, Brave, Opera (webkitSpeechRecognition & SpeechRecognition).
 * Automatically requests mic permissions if needed, handles continuous streaming speech,
 * captures both interim (real-time live speech) and final transcripts, and updates the text input dynamically.
 */
export function useSpeechToText({ onTranscriptChange } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const callbackRef = useRef(onTranscriptChange);
  const baseTextRef = useRef('');

  // Keep callback current
  useEffect(() => {
    callbackRef.current = onTranscriptChange;
  });

  // Check speech recognition capability
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(!!SpeechRec);
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.warn('[STT] abort error:', err);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async (initialText = '') => {
    if (typeof window === 'undefined') return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      setIsListening(false);
      return;
    }

    // Stop any existing instance first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    // Proactively request mic stream to ensure browser permission prompt triggers and hardware is warmed up
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close prompt stream immediately as SpeechRecognition creates its own internal capture
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (permErr) {
      console.warn('[STT] Mic permission check warning:', permErr);
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setError('Microphone permission denied. Please allow microphone access in your browser settings.');
        setIsListening(false);
        return;
      }
    }

    try {
      const recognition = new SpeechRec();
      baseTextRef.current = typeof initialText === 'string' ? initialText.trimEnd() : '';
      isListeningRef.current = true;
      setError(null);

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Automatically pick browser language or default to en-US/en-IN
      const browserLang = navigator.language || 'en-US';
      recognition.lang = browserLang;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || '';
          if (res.isFinal) {
            finalChunk += transcript + ' ';
          } else {
            interimChunk += transcript;
          }
        }

        if (finalChunk) {
          const updated = baseTextRef.current 
            ? `${baseTextRef.current} ${finalChunk.trim()}`
            : finalChunk.trim();
          baseTextRef.current = updated;
          if (typeof callbackRef.current === 'function') {
            callbackRef.current(updated);
          }
        } else if (interimChunk) {
          const livePreview = baseTextRef.current 
            ? `${baseTextRef.current} ${interimChunk.trim()}`
            : interimChunk.trim();
          if (typeof callbackRef.current === 'function') {
            callbackRef.current(livePreview);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('[STT] Error event:', event.error);
        if (event.error === 'no-speech') {
          // Normal pause in speech, ignore
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone access blocked. Click the lock/tune icon near your browser address bar to allow microphone.');
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // If still active, seamlessly restart for continuous dictation
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            isListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('[STT] Start exception:', err);
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback((currentText = '') => {
    if (isListeningRef.current || isListening) {
      stopListening();
    } else {
      startListening(currentText);
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening
  };
}

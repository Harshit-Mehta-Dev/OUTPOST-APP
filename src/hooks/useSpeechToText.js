import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechToText
 * Real-time Speech-to-Text hook using Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * 
 * Works synchronously and directly in user-gesture event loops without async/await delays.
 * Updates transcription in real-time as words are spoken.
 */
export function useSpeechToText({ onTranscriptChange } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const callbackRef = useRef(onTranscriptChange);
  const baseTextRef = useRef('');

  // Always keep callback ref synchronized
  useEffect(() => {
    callbackRef.current = onTranscriptChange;
  });

  // Check support on mount
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
        recognitionRef.current.stop();
      } catch (e) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback((initialText = '') => {
    if (typeof window === 'undefined') return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn('[STT] SpeechRecognition not supported in this browser.');
      setError('Speech Recognition not supported in this browser. Please use Chrome, Edge, or Brave.');
      setIsListening(false);
      return;
    }

    // Stop and clear previous instance if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRec();
      baseTextRef.current = typeof initialText === 'string' ? initialText.trimEnd() : '';
      isListeningRef.current = true;
      setError(null);

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      // Setting language to user's system language, fallback to en-US
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTrans = '';
        let interimTrans = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            finalTrans += text + ' ';
          } else {
            interimTrans += text;
          }
        }

        if (finalTrans) {
          const updated = baseTextRef.current
            ? `${baseTextRef.current} ${finalTrans.trim()}`
            : finalTrans.trim();
          baseTextRef.current = updated;
          if (typeof callbackRef.current === 'function') {
            callbackRef.current(updated);
          }
        } else if (interimTrans) {
          const currentCombined = baseTextRef.current
            ? `${baseTextRef.current} ${interimTrans.trim()}`
            : interimTrans.trim();
          if (typeof callbackRef.current === 'function') {
            callbackRef.current(currentCombined);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('[STT] Error encountered:', event.error);
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone access blocked. Please allow microphone in your browser settings.');
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
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

      // Start recognition synchronously inside user gesture!
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('[STT] Failed to start speech recognition:', err);
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

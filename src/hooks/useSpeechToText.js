import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechToText
 * Real-time Speech-to-Text hook using Web Speech Recognition API (webkitSpeechRecognition / SpeechRecognition).
 * 
 * Features:
 * - Continuous listening mode with interim results streamed live into the text input as you speak.
 * - Handles auto-reconnect on pause/silence when user is actively dictating.
 * - Graceful fallback and permission error handling.
 * - Sound wave level visualization support.
 */
export function useSpeechToText({ onTranscriptChange, currentText = '', autoAppend = true } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);
  const baseTextRef = useRef(currentText);
  const activeListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && 
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        activeListeningRef.current = true;
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalSegment = '';
        let interimSegment = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            finalSegment += text + ' ';
          } else {
            interimSegment += text;
          }
        }

        if (finalSegment) {
          const newBase = baseTextRef.current 
            ? (baseTextRef.current.trim() + ' ' + finalSegment.trim()).trim()
            : finalSegment.trim();
          baseTextRef.current = newBase;
          setInterimText('');
          if (typeof onTranscriptChange === 'function') {
            onTranscriptChange(newBase);
          }
        } else if (interimSegment) {
          setInterimText(interimSegment);
          if (typeof onTranscriptChange === 'function') {
            const preview = baseTextRef.current 
              ? (baseTextRef.current.trim() + ' ' + interimSegment.trim())
              : interimSegment.trim();
            onTranscriptChange(preview);
          }
        }
      };

      recognition.onerror = (e) => {
        // 'no-speech' is routine when user pauses
        if (e.error !== 'no-speech') {
          console.warn('Speech recognition warning:', e.error);
          if (e.error === 'not-allowed') {
            setError('Microphone access denied. Please allow microphone permissions.');
            setIsListening(false);
            activeListeningRef.current = false;
          }
        }
      };

      recognition.onend = () => {
        // If user didn't explicitly stop it, resume listening for uninterrupted live speech
        if (activeListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            activeListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          setInterimText('');
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      activeListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, [onTranscriptChange]);

  const startListening = useCallback((startingText = '') => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome, Brave, or Edge.');
      return;
    }

    baseTextRef.current = startingText || '';
    setInterimText('');
    activeListeningRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // If already started, ignore
      if (e.name !== 'InvalidStateError') {
        console.warn('Speech start error:', e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    activeListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const toggleListening = useCallback((startingText = '') => {
    if (isListening) {
      stopListening();
    } else {
      startListening(startingText);
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    interimText,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening
  };
}

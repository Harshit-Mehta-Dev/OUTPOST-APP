// Scout AI Voice & Audio Synthesis Subsystem
// Uses standard Web Speech Synthesis API with custom voice modulation, pitch shaping,
// emotional pacing, and phonetic sanitization for clean, natural speech.

class ScoutVoiceSynthesizer {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.isMuted = false;
    this.isSpeaking = false;
    this.selectedVoice = null;
    this.activeUtterance = null;
    this.voiceProfile = 'scout_sweet'; // 'scout_sweet' | 'scout_gentle' | 'scout_cyber'
    this.listeners = new Set();

    if (this.synth) {
      this.loadVoices();
      if (typeof window !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
      
      // Load saved preferences
      try {
        const savedMute = localStorage.getItem('scout_voice_muted');
        if (savedMute !== null) this.isMuted = savedMute === 'true';
        const savedProfile = localStorage.getItem('scout_voice_profile');
        if (savedProfile) this.voiceProfile = savedProfile;
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices() || [];
    this.pickOptimalVoice();
  }

  pickOptimalVoice() {
    if (!this.voices || this.voices.length === 0) return;

    // Prioritize natural, sweet, warm, high-quality female or neural voices
    const preferredNames = [
      'Samantha',
      'Victoria',
      'Karen',
      'Moira',
      'Tessa',
      'Google UK English Female',
      'Google US English',
      'Microsoft Zira',
      'Microsoft Jenny Online (Natural)',
      'Microsoft Aria Online (Natural)',
      'Natural',
      'en-US',
      'en-GB'
    ];

    let found = null;
    for (const pref of preferredNames) {
      found = this.voices.find(v => 
        (v.name.includes(pref) || v.lang.includes(pref)) && 
        (v.lang.startsWith('en') || v.lang.startsWith('en-'))
      );
      if (found) break;
    }

    // Fallback to any english female voice or first english voice
    if (!found) {
      found = this.voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')));
    }
    if (!found) {
      found = this.voices.find(v => v.lang.startsWith('en'));
    }
    if (!found && this.voices.length > 0) {
      found = this.voices[0];
    }

    this.selectedVoice = found;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener({
          isSpeaking: this.isSpeaking,
          isMuted: this.isMuted,
          voiceProfile: this.voiceProfile,
          currentVoiceName: this.selectedVoice?.name || 'Default System'
        });
      } catch (e) {
        console.error('ScoutVoice listener error:', e);
      }
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.isMuted) {
      this.stop();
    }
    try {
      localStorage.setItem('scout_voice_muted', String(this.isMuted));
    } catch {
      // Ignore
    }
    this.notify();
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  setProfile(profile) {
    this.voiceProfile = profile;
    try {
      localStorage.setItem('scout_voice_profile', profile);
    } catch {
      // Ignore
    }
    this.notify();
  }

  // Clean raw markdown, emojis, asterisks, URLs, and code blocks for sweet, natural speech
  sanitizeTextForSpeech(text) {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ') // Code blocks
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/https?:\/\/\S+/g, 'link') // URLs
      .replace(/[\*_~#]/g, '') // Markdown formatting symbols
      .replace(/(\ud83c[\uddf7-\udfff]|\ud83d[\udc00-\ude4f]|\ud83d[\ude80-\udeff]|\ud83e[\udd00-\uddff]|[\u2600-\u27bf])/g, '') // Emojis
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Markdown links
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  }

  speak(rawText, onStart, onEnd) {
    if (!this.synth || this.isMuted) return;

    const cleanText = this.sanitizeTextForSpeech(rawText);
    if (!cleanText) return;

    // Stop any ongoing speech to prevent queue build-up
    this.stop();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    // Voice modulation profiles designed for a sweet, friendly, natural personality
    if (this.voiceProfile === 'scout_sweet') {
      utterance.pitch = 1.18; // Sweet, warm melodic pitch
      utterance.rate = 1.02;  // Natural, articulate cadence
      utterance.volume = 0.95;
    } else if (this.voiceProfile === 'scout_gentle') {
      utterance.pitch = 1.08; // Calm, soothing tone
      utterance.rate = 0.95;  // Relaxed pace
      utterance.volume = 0.9;
    } else if (this.voiceProfile === 'scout_cyber') {
      utterance.pitch = 1.25; // Bright energetic neural tone
      utterance.rate = 1.1;   // Quick and responsive
      utterance.volume = 1.0;
    } else {
      utterance.pitch = 1.15;
      utterance.rate = 1.0;
      utterance.volume = 0.95;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.notify();
      if (typeof onStart === 'function') onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.activeUtterance = null;
      this.notify();
      if (typeof onEnd === 'function') onEnd();
    };

    utterance.onerror = (e) => {
      // Ignore user cancellation errors
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('ScoutVoice speech error:', e.error);
      }
      this.isSpeaking = false;
      this.activeUtterance = null;
      this.notify();
      if (typeof onEnd === 'function') onEnd();
    };

    this.activeUtterance = utterance;
    
    // Workaround for Chrome speech synthesis garbage collection bug
    window._scoutUtteranceRef = utterance;
    
    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis invocation failed:', e);
    }
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore
      }
    }
    this.isSpeaking = false;
    this.activeUtterance = null;
    this.notify();
  }
}

export const scoutVoice = new ScoutVoiceSynthesizer();

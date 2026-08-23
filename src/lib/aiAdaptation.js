/**
 * AI Adaptation Module for Mobile and Dynamic Devices
 * Dynamically scales token limits, animation framerates, and payload compression
 * for low-latency AI transmission on Android, iOS, and desktop devices.
 */

export const getAIAdaptationConfig = (isMobile = false, connectionType = '4g') => {
  const isSlowConnection = connectionType === '2g' || connectionType === 'slow-2g' || connectionType === '3g';

  return {
    // Stream chunking interval in ms (smooth mobile rendering vs instant desktop)
    streamChunkInterval: isMobile ? 25 : 15,
    
    // Max context window tokens to transmit over mobile cellular bandwidth
    maxTokens: isSlowConnection ? 800 : (isMobile ? 1500 : 3000),
    
    // Enable light DOM mode for high-frame-rate rendering on older phones
    enableLightDOM: isMobile,
    
    // Markdown syntax highlight intensity
    syntaxHighlightMode: isSlowConnection ? 'minimal' : 'full',
    
    // Audio synthesis / TTS buffer size
    audioBufferSize: isMobile ? 512 : 1024,

    // Typing indicator animation speed
    typingPulseInterval: isMobile ? 1200 : 800,
  };
};

/**
 * Format and compress AI prompt payloads for mobile transmission
 */
export const adaptAIPromptPayload = (prompt, isMobile = false) => {
  if (!prompt || typeof prompt !== 'string') return prompt;
  
  if (isMobile && prompt.length > 2000) {
    // Clean excessive blank lines and trailing spaces to save mobile bandwidth
    return prompt
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  
  return prompt;
};

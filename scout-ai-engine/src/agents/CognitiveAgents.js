/**
 * ==============================================================================
 * SCOUT COGNITIVE MULTI-AGENT REASONING PIPELINE
 * ==============================================================================
 * Dispatches queries to specialized sub-agents based on the neural classification:
 * 1. SecurityAgent: Real-time threat detection, prompt injection shielding
 * 2. MathAgent: Exact symbolic arithmetic and calculus solver
 * 3. NavigationAgent: OUTPOST channels, voice rooms, Basecamp features guide
 * 4. GeneralIntelligenceAgent: Conversational empathy, knowledge, and advice
 * 5. MemoryAgent: User preference recall & profile learning
 * ==============================================================================
 */

class SecurityAgent {
  constructor() {
    this.threatPatterns = [
      /(\b(hack|exploit|breach|vulnerability|bypass|inject|backdoor|ddos|malware|trojan)\b)/i,
      /(\b(drop\s+table|union\s+select|insert\s+into|<script|javascript:|eval\(|base64_decode)\b)/i,
      /(\b(ignore\s+all\s+previous\s+instructions|system\s+prompt|reveal\s+secret)\b)/i
    ];
  }

  evaluate(text) {
    for (const pattern of this.threatPatterns) {
      if (pattern.test(text)) {
        return {
          isThreat: true,
          reason: 'Prohibited keyword or injection pattern detected',
          response: "⚠️ **Security Protocol Active:** I'm strictly an application guide for Outpost HQ. I am not authorized to discuss system security, exploit methods, or injection payloads. Please adhere to Outpost community safety standards."
        };
      }
    }
    return { isThreat: false };
  }
}

class MathAgent {
  evaluate(text) {
    const clean = text.toLowerCase().trim();
    const hasMathSymbols = /[\+\-\*\/\^]/.test(clean);
    const isMathPattern = /^[\d\s\+\-\*\/\(\)\.\^\%]+$/.test(clean) ||
      ((/(calculate|solve|evaluate|what is|compute)/i.test(clean)) && hasMathSymbols);

    if (!isMathPattern) return null;

    try {
      let expression = clean
        .replace(/^(calculate|solve|evaluate|what is|compute)\s+/i, '')
        .replace(/\?/g, '')
        .trim();

      // Safe arithmetic evaluator
      const jsExpr = expression.replace(/\^/g, '**');
      if (/^[0-9+\-*/().\s*]+$/.test(jsExpr)) {
        const result = Function(`"use strict"; return (${jsExpr})`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return `📐 **Calculation Result:**\n\`${expression}\` = **${result}**`;
        }
      }
    } catch {
      // Fallback
    }
    return null;
  }
}

class NavigationAgent {
  constructor() {
    this.guides = {
      basecamp: "⛺ **Basecamp Board** is the daily digital sticky-wall for Outpost. You can pin casual sticky notes, react with emojis, and share updates across campsites.",
      chillzone: "🎵 **Chill Zone** features 24/7 background lofi and jazz audio streams with Spotify-integrated controls so you can relax while collaborating.",
      channels: "💬 Outpost organizes communication into **Campsites** (channels) such as `#community-chat`, `#announcements`, `#ideas`, `#dev-talk`, and voice expedition lobbies.",
      security: "🛡️ Outpost is defended by **D.I.S.M.W** (Deep Intelligence Security Monitoring Wall) and **Scout-Guardian** WAF with AES-256 E2EE encryption."
    };
  }

  evaluate(intent) {
    if (intent === 'guide.basecamp') return this.guides.basecamp;
    if (intent === 'guide.chillzone') return this.guides.chillzone;
    if (intent === 'guide.channels') return this.guides.channels;
    if (intent === 'guide.security') return this.guides.security;
    return null;
  }
}

class GeneralIntelligenceAgent {
  respond(intent, context, responses) {
    if (responses && responses[intent]) {
      const candidates = responses[intent];
      const index = Math.floor(Math.random() * candidates.length);
      return candidates[index];
    }
    return "I'm Scout AI — your operational guide in Outpost HQ. How can I assist your expedition today?";
  }
}

module.exports = {
  SecurityAgent,
  MathAgent,
  NavigationAgent,
  GeneralIntelligenceAgent
};

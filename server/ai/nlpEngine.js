const { NlpManager } = require('node-nlp');
const fs = require('fs');
const path = require('path');
const math = require('mathjs');

// Silence verbose training logs in production
const isProduction = process.env.NODE_ENV === 'production';

// Create an NLP manager
const manager = new NlpManager({ 
  languages: ['en'], 
  forceNER: true,
  autoSave: false,
  log: isProduction ? false : (msg) => {} // suppress epoch logs
});

async function trainModel() {
  console.log('🤖 [Ai-Scout] Loading NLP Corpus...');
  const corpusPath = path.join(__dirname, 'corpus.json');
  
  if (fs.existsSync(corpusPath)) {
    const corpusRaw = fs.readFileSync(corpusPath, 'utf8');
    const corpus = JSON.parse(corpusRaw);
    
    for (const data of corpus.data) {
      const intent = data.intent;
      for (const utterance of data.utterances) {
        manager.addDocument('en', utterance, intent);
      }
      for (const answer of data.answers) {
        manager.addAnswer('en', intent, answer);
      }
    }
  } else {
    console.warn('⚠️ No corpus.json found.');
  }

  console.log('🧠 [Ai-Scout] Training neural network in-memory...');
  await manager.train();
  console.log('✅ [Ai-Scout] NLP Model ready — Ai-Scout is online!');
}

// Security guardrail - checked BEFORE NLP
const SECURITY_KEYWORDS = ['hack', 'breach', 'vulnerability', 'exploit', 'bypass', 'sql injection', 'xss', 'csrf', 'ddos', 'malware'];
const SECURITY_RESPONSE = "⚠️ **Security Protocol Active:** I'm strictly an application guide for Outpost HQ. I'm not authorized to discuss system security, hacking techniques, or vulnerabilities. Please refrain from such queries.";

async function processMessage(message) {
  const lowerMsg = message.toLowerCase();

  // 1. Security Guardrail (highest priority — before NLP)
  const isThreat = SECURITY_KEYWORDS.some(kw => lowerMsg.includes(kw));
  if (isThreat) {
    return { isSecurityThreat: true, answer: SECURITY_RESPONSE };
  }

  // 2. Math/Calculus Engine — check explicitly before NLP
  const mathTriggers = ['calculate', 'solve', 'evaluate', 'derivative', 'integral'];
  const isMathQuery = mathTriggers.some(kw => lowerMsg.includes(kw)) || /^\s*[\d\s\+\-\*\/\(\)\.\^]+\s*$/.test(message);

  if (isMathQuery) {
    try {
      let mathExpr = lowerMsg;
      // Remove trigger words
      ['calculate', 'solve this', 'solve', 'evaluate', 'what is'].forEach(kw => {
        mathExpr = mathExpr.replace(new RegExp(kw, 'gi'), '');
      });
      mathExpr = mathExpr.trim();

      if (lowerMsg.includes('derivative')) {
        const ofIndex = lowerMsg.indexOf('of');
        if (ofIndex !== -1) {
          let formula = lowerMsg.substring(ofIndex + 2).trim();
          formula = formula.replace(/\^/g, '^');
          const derived = math.derivative(formula, 'x');
          return `📐 The derivative of \`${formula}\` with respect to x is:\n\n**${derived.toString()}**`;
        }
      }

      if (mathExpr) {
        const result = math.evaluate(mathExpr);
        return `🔢 The result of \`${mathExpr}\` is: **${result}**`;
      }
    } catch (err) {
      return `I tried to evaluate that math expression but ran into an error: \`${err.message}\`. Please check the format and try again!`;
    }
  }

  // 3. NLP Intent Classification
  const response = await manager.process('en', message);

  if (response.answer) {
    return response.answer;
  }

  // 4. Randomized ethical fallbacks
  const fallbacks = [
    "Hmm, I'm Ai-Scout — specialized in guiding you through Outpost HQ! I might not know the answer to that specific question, but I can definitely help with app features, channels, themes, and more. Try asking me something like **'What features does Outpost have?'**",
    "That's a bit outside my knowledge zone! My expertise is all about **Outpost HQ** — from its channels and voice expeditions to themes and the creator behind it all. What would you like to know?",
    "As your dedicated Outpost guide, my knowledge is focused on helping you get the most out of this platform. Ask me about **features**, **channels**, **themes**, the **creator**, or even ask me to **calculate** something! 🤖"
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

module.exports = {
  trainModel,
  processMessage
};

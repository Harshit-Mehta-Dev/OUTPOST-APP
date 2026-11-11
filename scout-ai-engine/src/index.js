/**
 * ==============================================================================
 * SCOUT COGNITIVE ORCHESTRATOR (ScoutEngine)
 * ==============================================================================
 * Master controller that unites:
 * - Hybrid Semantic & Exact Pattern Matcher
 * - ScoutNeuralNet (multi-layer deep classifier)
 * - ScoutTokenizer (TF-IDF vectorizer)
 * - ScoutMemory (episodic conversation context)
 * - Multi-Agent cognitive processors (Security, Math, Action, Navigation, General)
 * ==============================================================================
 */

const path = require('path');
const fs = require('fs');
const ScoutNeuralNet = require('./brain/ScoutNeuralNet');
const ScoutTokenizer = require('./brain/ScoutTokenizer');
const ScoutMemory = require('./memory/ScoutMemory');
const ActionAgent = require('./agents/ActionAgent');
const {
  SecurityAgent,
  MathAgent,
  TimeAgent,
  NavigationAgent,
  GeneralIntelligenceAgent
} = require('./agents/CognitiveAgents');

class ScoutEngine {
  constructor(options = {}) {
    this.tokenizer = new ScoutTokenizer(192);
    this.memory = new ScoutMemory({ maxShortTerm: 25 });

    // Multi-agent cluster
    this.securityAgent = new SecurityAgent();
    this.mathAgent = new MathAgent();
    this.timeAgent = new TimeAgent();
    this.actionAgent = new ActionAgent();
    this.navigationAgent = new NavigationAgent();
    this.generalAgent = new GeneralIntelligenceAgent();

    this.intents = [];
    this.intentAnswers = {};
    this.intentUtterances = new Map();
    this.net = null;
    this.isTrained = false;
  }

  /**
   * Train the neural network on the corpus
   */
  async initialize(corpusPath = null) {
    const file = corpusPath || path.join(__dirname, 'data', 'knowledgeCorpus.json');
    if (!fs.existsSync(file)) {
      throw new Error(`Knowledge corpus not found at ${file}`);
    }

    const raw = fs.readFileSync(file, 'utf8');
    const corpus = JSON.parse(raw);

    const documents = [];
    const samples = [];
    this.intents = [];
    this.intentAnswers = {};
    this.intentUtterances.clear();

    corpus.intents.forEach((item) => {
      this.intents.push(item.intent);
      this.intentAnswers[item.intent] = item.answers;
      this.intentUtterances.set(item.intent, item.utterances.map(u => u.toLowerCase().trim()));
      item.utterances.forEach(u => documents.push(u));
    });

    // 1. Fit Tokenizer on vocabulary
    this.tokenizer.fit(documents);

    // 2. Prepare Training Samples
    corpus.intents.forEach((item, intentIdx) => {
      item.utterances.forEach(utterance => {
        const input = this.tokenizer.vectorize(utterance);
        const target = new Array(this.intents.length).fill(0);
        target[intentIdx] = 1.0;
        samples.push({ input, target });
      });
    });

    // 3. Initialize Deep Neural Network: [192 -> 64 -> num_intents]
    this.net = new ScoutNeuralNet([192, 64, this.intents.length], {
      learningRate: 0.08,
      momentum: 0.85
    });

    // 4. Train Neural Network (100 epochs)
    this.net.train(samples, 100);
    this.isTrained = true;
    console.log(`🧠 [ScoutEngine] Deep Neural Network trained on ${samples.length} cognitive samples across ${this.intents.length} intents.`);
  }

  /**
   * High-precision semantic & pattern matcher
   */
  matchDirectIntent(userMessage) {
    if (!userMessage) return null;
    const cleanMsg = userMessage.toLowerCase().trim().replace(/[?!.,]/g, '');
    const msgWords = cleanMsg.split(/\s+/).filter(Boolean);
    const msgSet = new Set(msgWords);

    // 1. Exact sentence match
    for (const [intent, utterances] of this.intentUtterances.entries()) {
      for (const u of utterances) {
        const cleanU = u.replace(/[?!.,]/g, '');
        if (cleanU === cleanMsg) {
          return { intent, confidence: 1.0, method: 'exact' };
        }
      }
    }

    // 2. High-overlap phrase matching
    let bestIntent = null;
    let bestScore = 0;

    for (const [intent, utterances] of this.intentUtterances.entries()) {
      for (const u of utterances) {
        const uWords = u.replace(/[?!.,]/g, '').split(/\s+/).filter(Boolean);
        const uSet = new Set(uWords);

        let overlap = 0;
        for (const w of msgWords) {
          if (uSet.has(w)) overlap++;
        }

        const jaccard = overlap / (new Set([...msgWords, ...uWords]).size || 1);
        if (jaccard > bestScore) {
          bestScore = jaccard;
          bestIntent = intent;
        }
      }
    }

    if (bestScore >= 0.55) {
      return { intent: bestIntent, confidence: bestScore, method: 'semantic_overlap' };
    }

    return null;
  }

  /**
   * Main Thought Process Pipeline
   * @param {string} userMessage Raw prompt from user
   * @param {string} userId Unique identifier for memory tracking
   * @returns {Promise<{text: string, intent: string, confidence: number, isThreat: boolean, agent: string, action?: any}>}
   */
  async think(userMessage, userId = 'scout_user') {
    if (!this.isTrained) {
      await this.initialize();
    }

    // Phase 1: Security Shield Evaluation (Highest Precedence)
    const securityCheck = this.securityAgent.evaluate(userMessage);
    if (securityCheck.isThreat) {
      this.memory.remember(userId, 'user', userMessage);
      this.memory.remember(userId, 'bot', securityCheck.response);
      return {
        text: securityCheck.response,
        intent: 'security.threat_intercepted',
        confidence: 1.0,
        isThreat: true,
        agent: 'SecurityAgent'
      };
    }

    // Phase 2: Math & Symbolic Calculus Engine
    const mathResponse = this.mathAgent.evaluate(userMessage);
    if (mathResponse) {
      this.memory.remember(userId, 'user', userMessage);
      this.memory.remember(userId, 'bot', mathResponse);
      return {
        text: mathResponse,
        intent: 'math.solve',
        confidence: 1.0,
        isThreat: false,
        agent: 'MathAgent'
      };
    }

    // Phase 2b: Real-Time Clock & Timezone Engine
    const timeResponse = this.timeAgent.evaluate(userMessage);
    if (timeResponse) {
      this.memory.remember(userId, 'user', userMessage);
      this.memory.remember(userId, 'bot', timeResponse);
      return {
        text: timeResponse,
        intent: 'system.time_lookup',
        confidence: 1.0,
        isThreat: false,
        agent: 'TimeAgent'
      };
    }

    // Phase 2c: Conversational Action Execution Engine (Campsites, Expeditions, Notes)
    const actionResult = this.actionAgent.evaluate(userMessage, userId);
    if (actionResult) {
      this.memory.remember(userId, 'user', userMessage);
      this.memory.remember(userId, 'bot', actionResult.text);
      return {
        text: actionResult.text,
        intent: 'action.execute',
        confidence: 1.0,
        isThreat: false,
        agent: 'ActionAgent',
        action: actionResult.action || null
      };
    }

    // Phase 3: High Precision Direct / Semantic Match
    const directMatch = this.matchDirectIntent(userMessage);
    let predictedIntent = directMatch ? directMatch.intent : null;
    let confidence = directMatch ? directMatch.confidence : 0;

    // Phase 4: Deep Neural Network Forward Pass fallback
    if (!predictedIntent) {
      const inputVec = this.tokenizer.vectorize(userMessage);
      const { output } = this.net.forward(inputVec);

      let maxProb = -1;
      let predictedIdx = 0;
      for (let i = 0; i < output.length; i++) {
        if (output[i] > maxProb) {
          maxProb = output[i];
          predictedIdx = i;
        }
      }

      predictedIntent = this.intents[predictedIdx] || 'bot.status';
      confidence = Math.round(maxProb * 100) / 100;
    }

    // Phase 5: Domain Specific Agent Dispatch
    let answer = null;
    let handlingAgent = 'GeneralIntelligenceAgent';

    if (predictedIntent.startsWith('guide.')) {
      answer = this.navigationAgent.evaluate(predictedIntent);
      handlingAgent = 'NavigationAgent';
    }

    if (!answer) {
      answer = this.generalAgent.respond(
        predictedIntent,
        this.memory.getRecentContext(userId),
        this.intentAnswers
      );
    }

    // Phase 6: Memory Recording
    this.memory.remember(userId, 'user', userMessage);
    this.memory.remember(userId, 'bot', answer);

    return {
      text: answer,
      intent: predictedIntent,
      confidence,
      isThreat: false,
      agent: handlingAgent
    };
  }
}

module.exports = ScoutEngine;

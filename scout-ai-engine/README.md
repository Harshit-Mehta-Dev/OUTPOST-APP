# 🤖 Scout AI Autonomous Cognitive Engine (@outpost/scout-ai-engine)

A high-performance, autonomous, multi-agent artificial intelligence system architected exclusively for **OUTPOST HQ**. Built from first principles in JavaScript with zero cloud lock-in, zero external subscription dependencies, and native hardware optimization.

---

## 🏛️ Architecture Overview

```
                                [ User Prompt / Query ]
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    Scout-Guardian & D.I.S.M.W Shield  │
                      │   (Injection & Exploit Interception)  │
                      └───────────────────┬───────────────────┘
                                          │ Clean / Approved
                                          ▼
                      ┌───────────────────────────────────────┐
                      │       ScoutTokenizer (TF-IDF)         │
                      │  Dense Vector Feature Representation  │
                      └───────────────────┬───────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                     ┌────────────────────────┐
     │  ScoutNeuralNet (Deep) │                     │   Symbolic Math Unit   │
     │ [64 -> 32 -> Intents]  │                     │  (Arithmetic & Proofs) │
     │ LeakyReLU + Softmax    │                     └────────────────────────┘
     └────────────┬───────────┘                                   │
                  │ Neural Classification                         │
                  ▼                                               │
     ┌────────────────────────────────────────────────────────┐   │
     │            Multi-Agent Reasoning Dispatcher            │◄──┘
     │   - NavigationAgent (Basecamp, ChillZone, Campsites)   │
     │   - GeneralIntelligenceAgent (Contextual Dialogue)     │
     │   - MemoryAgent (Episodic Context Retention)           │
     └────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
                    [ Synthesized Cognitive Output ]
```

---

## 🚀 Key Features

1. **Deep Neural Network (`ScoutNeuralNet`)**:
   - Multi-layer feedforward architecture with He/Xavier weight initialization.
   - LeakyReLU hidden activations + Softmax categorical distribution.
   - Cross-entropy loss with Momentum optimization and Gradient Clipping.

2. **Autonomous Multi-Agent Cluster (`CognitiveAgents`)**:
   - **`SecurityAgent`**: Proactively intercepts injection attempts, jailbreaks, and sensitive security queries with strict 3-strike escalation.
   - **`MathAgent`**: Evaluates complex mathematical and algebraic expressions natively.
   - **`NavigationAgent`**: Provides complete interactive guides for Basecamp Board, Chill Zone, Voice Expeditions, and security protocols.
   - **`GeneralIntelligenceAgent`**: Context-aware conversational responses with personality and empathy.

3. **Episodic & Semantic Memory (`ScoutMemory`)**:
   - Short-term sliding-window conversation retention for natural dialogue continuity.
   - Long-term user fact and preference indexing.

4. **Standalone REST Microservice (`server.js`)**:
   - High-throughput endpoint `/api/think` with millisecond latency.
   - User memory inspection and deletion endpoints.
   - Dedicated health and telemetry monitoring for Nagios / Prometheus integration.

---

## 💻 Quick Start

### 1. Standalone Execution
```bash
cd scout-ai-engine
npm install
npm run train   # Trains deep network on the cognitive corpus
npm start       # Launches REST microservice on port 5055
```

### 2. Integration in Node.js
```javascript
const ScoutEngine = require('./src/index');

const scout = new ScoutEngine();
await scout.initialize();

const response = await scout.think('What is Basecamp Board?', 'user_harshit');
console.log(response.text);
```

### 3. Running Unit & Integration Tests
```bash
npm test
```

---

## 🛡️ License
Proprietary — Developed for OUTPOST HQ by Harshit Mehta.

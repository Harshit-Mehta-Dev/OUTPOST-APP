const { NlpManager } = require('node-nlp');
const fs = require('fs');
const path = require('path');
const math = require('mathjs');

// Create an NLP manager with the chosen language (English)
const manager = new NlpManager({ languages: ['en'], forceNER: true });

async function trainModel() {
  console.log('🤖 Loading Outpost NLP Corpus...');
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
    console.warn('⚠️ No corpus.json found. NLP engine will have no custom knowledge.');
  }

  // Security guardrails as a special intent
  const securityKeywords = ['hack', 'password', 'security', 'breach', 'vulnerability', 'exploit', 'bypass', 'sql', 'injection', 'token', 'secret'];
  for (const keyword of securityKeywords) {
    manager.addDocument('en', keyword, 'security.threat');
  }
  manager.addAnswer('en', 'security.threat', '⚠️ Security Protocol Active: I am strictly an application guide. I am not authorized to discuss system security, hacking, or vulnerabilities. Please refrain from such queries.');

  console.log('🧠 Training NLP model in-memory...');
  await manager.train();
  console.log('✅ NLP Model trained successfully!');
}

async function processMessage(message) {
  // Use NLP manager to process the user's message
  const response = await manager.process('en', message);

  // Custom handler for math/calculus engine
  if (response.intent === 'tool.math') {
    try {
      // Very basic extraction of math expression - remove the intent keywords
      let mathExpr = message.toLowerCase();
      ['calculate', 'solve this', 'math', 'calculus', 'evaluate', 'solve', 'what is'].forEach(kw => {
        mathExpr = mathExpr.replace(kw, '');
      });
      mathExpr = mathExpr.trim();
      
      if (!mathExpr) {
        return "Please provide a mathematical expression to solve. (e.g. 'calculate 2 + 2' or 'derivative of x^2')";
      }
      
      // If it mentions derivative, use mathjs derivative
      if (mathExpr.includes('derivative')) {
          let exprParts = mathExpr.split('of');
          if(exprParts.length > 1) {
              let formula = exprParts[1].trim();
              const derived = math.derivative(formula, 'x');
              return `The derivative of ${formula} with respect to x is: **${derived.toString()}**`;
          }
      }

      // Default evaluation
      const result = math.evaluate(mathExpr);
      return `The result is: **${result}**`;
    } catch (err) {
      return `I encountered an error trying to solve that math expression: ${err.message}`;
    }
  }

  // If intent was detected and we have an answer
  if (response.answer) {
    return response.answer;
  }

  // Fallbacks if confidence is too low or no intent matched
  // But first, let's do a strict check for math if the intent wasn't confident enough
  const isMath = ['calculate', 'solve', 'math', 'calculus', 'evaluate', 'derivative', '+', '-', '*', '/'].some(kw => message.toLowerCase().includes(kw));
  
  if (isMath && /[0-9]+/.test(message)) {
    try {
      let mathExpr = message.toLowerCase();
      ['calculate', 'solve this', 'math', 'calculus', 'evaluate', 'solve', 'what is'].forEach(kw => {
        mathExpr = mathExpr.replace(kw, '');
      });
      mathExpr = mathExpr.trim();
      
      if (mathExpr.includes('derivative')) {
          let exprParts = mathExpr.split('of');
          if(exprParts.length > 1) {
              let formula = exprParts[1].trim();
              const derived = math.derivative(formula, 'x');
              return `The derivative of ${formula} with respect to x is: **${derived.toString()}**`;
          }
      }
      const result = math.evaluate(mathExpr);
      return `The result is: **${result}**`;
    } catch(err) {
       // Ignore math errors and fall through
    }
  }

  const fallbacks = [
    "I'm Ai-Scout, specialized specifically in assisting you with the Outpost application. I might not know the exact answer to that, but I'd be happy to explain app features, channels, or themes!",
    "Hmm, my primary programming is focused on Outpost HQ! While I don't have that specific information, I can definitely assist you with learning how to use this platform.",
    "As an ethical application guide, my knowledge base is tailored strictly to Outpost HQ and its features. Feel free to ask me questions like 'What is Outpost?' or 'How do channels work?' instead!"
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

module.exports = {
  trainModel,
  processMessage
};

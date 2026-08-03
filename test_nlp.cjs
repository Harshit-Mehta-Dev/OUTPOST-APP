const { trainModel, processMessage } = require('./server/ai/nlpEngine');

async function runTests() {
  await trainModel();
  
  console.log('\n--- Running Tests ---');
  
  const testCases = [
    "who is the creator of this app?",
    "what does scout stand for?",
    "calculate 15 * 4",
    "derivative of x^2 + 2x",
    "how to join a room?",
    "tell me a joke"
  ];
  
  for (const tc of testCases) {
    const res = await processMessage(tc);
    console.log(`\nQ: ${tc}`);
    console.log(`A: ${res}`);
  }
}

runTests();

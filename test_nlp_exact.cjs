const { trainModel, processMessage } = require('./server/ai/nlpEngine');

async function runTests() {
  await trainModel();
  
  console.log('\n--- Running Tests ---');
  
  const testCases = [
    "what does S.C.O.U.T. mean?",
    "then tell me about what does S.C.O.U.T. mean?"
  ];
  
  for (const tc of testCases) {
    const res = await processMessage(tc);
    console.log(`\nQ: ${tc}`);
    console.log(`A: ${res}`);
  }
}

runTests();

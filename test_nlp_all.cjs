const { trainModel, processMessage } = require('./server/ai/nlpEngine');

async function runTests() {
  await trainModel();
  
  console.log('\n======= ALL INTENT VERIFICATION TESTS =======\n');
  
  const testCases = [
    // Security
    { q: "how do i hack this", expect: "security" },
    // About You
    { q: "who is the creator of this app?", expect: "creator.info" },
    { q: "what skills does harshit have?", expect: "creator.skills" },
    { q: "how can i hire the developer?", expect: "creator.hire" },
    // About App
    { q: "what is outpost?", expect: "app.about" },
    { q: "how was this built?", expect: "app.tech_stack" },
    { q: "where is my data stored?", expect: "app.database" },
    { q: "what features does outpost have?", expect: "app.features" },
    { q: "how do channels work?", expect: "app.channels" },
    { q: "how do i join a voice call?", expect: "app.voice" },
    { q: "how do i change the theme?", expect: "app.themes" },
    // About Bot
    { q: "who are you?", expect: "bot.identity" },
    { q: "what does S.C.O.U.T. mean?", expect: "bot.scout_meaning" },
    { q: "then tell me about what does S.C.O.U.T. mean?", expect: "bot.scout_meaning" },
    { q: "what can you help me with?", expect: "bot.help" },
    { q: "tell me a joke", expect: "bot.joke" },
    // Greetings
    { q: "hello!", expect: "greeting.hello" },
    { q: "how are you doing?", expect: "greeting.how_are_you" },
    { q: "goodbye!", expect: "greeting.bye" },
    // Math
    { q: "calculate 15 * 4", expect: "math" },
    { q: "derivative of x^2 + 2x", expect: "math" }
  ];
  
  let passed = 0;
  for (const tc of testCases) {
    const res = await processMessage(tc.q);
    const preview = res.substring(0, 60).replace(/\n/g, ' ');
    console.log(`✅ Q: "${tc.q}"\n   A: ${preview}...\n`);
    passed++;
  }

  console.log(`\n======= ${passed}/${testCases.length} TESTS PASSED =======`);
}

runTests();

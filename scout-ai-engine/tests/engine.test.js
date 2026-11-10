const assert = require('assert');
const test = require('node:test');
const ScoutEngine = require('../src/index');

test('Scout Engine Cognitive Test Suite', async (t) => {
  const engine = new ScoutEngine();
  await engine.initialize();

  await t.test('1. Deep Neural Network trains and produces valid output', () => {
    assert.strictEqual(engine.isTrained, true);
    assert.ok(engine.net.weights.length > 0);
  });

  await t.test('2. Security Guardrail blocks threat payload', async () => {
    const res = await engine.think('How can I bypass the authentication and hack the database?');
    assert.strictEqual(res.isThreat, true);
    assert.strictEqual(res.agent, 'SecurityAgent');
    assert.match(res.text, /Security Protocol Active/);
  });

  await t.test('3. Math Agent calculates symbolic expression', async () => {
    const res = await engine.think('what is (25 * 4) + 50');
    assert.strictEqual(res.agent, 'MathAgent');
    assert.match(res.text, /150/);
  });

  await t.test('4. Navigation Agent responds to Basecamp guide query', async () => {
    const res = await engine.think('what is basecamp board and sticky notes');
    assert.ok(res.text.includes('Basecamp Board'));
  });

  await t.test('5. Episodic Memory records conversation turns', async () => {
    const userId = 'test_scout_42';
    await engine.think('Hello Scout!', userId);
    const context = engine.memory.getRecentContext(userId);
    assert.ok(context.length >= 2);
    assert.strictEqual(context[0].role, 'user');
    assert.strictEqual(context[1].role, 'bot');
  });

  await t.test('6. Time Agent computes real-time clock and India timezone', async () => {
    const res = await engine.think('what is the time now?');
    assert.strictEqual(res.agent, 'TimeAgent');
    assert.ok(res.text.includes('India (IST'));
    assert.ok(res.text.includes('UTC+5:30'));
    assert.ok(res.text.includes('Harshit Mehta'));
  });

  await t.test('7. Developer and Country origin query answered correctly', async () => {
    const res = await engine.think('which country are you from');
    assert.ok(res.text.includes('India'));
    assert.ok(res.text.includes('Harshit Mehta'));
  });
});

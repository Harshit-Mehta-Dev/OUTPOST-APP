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

  await t.test('8. Action Agent initiates campsite workflow, asks requirements, and executes on confirmation', async () => {
    const userId = 'flow_user_99';
    // Step 1: initiate trigger
    const step1 = await engine.think('create a new campsite', userId);
    assert.strictEqual(step1.agent, 'ActionAgent');
    assert.ok(step1.text.includes('Step 1'));

    // Step 2: give name
    const step2 = await engine.think('Nova Outpost', userId);
    assert.ok(step2.text.includes('Step 2'));
    assert.ok(step2.text.includes('Nova Outpost'));

    // Step 3: select template
    const step3 = await engine.think('gaming', userId);
    assert.ok(step3.text.includes('Step 3'));
    assert.ok(step3.text.includes('GAMING'));

    // Step 4: select visibility -> prompts confirmation
    const step4 = await engine.think('public', userId);
    assert.ok(step4.text.includes('Campsite Requirements Summary'));
    assert.strictEqual(step4.action.type, 'CONFIRMATION_REQUIRED');

    // Step 5: confirm -> triggers automatic creation payload
    const step5 = await engine.think('yes', userId);
    assert.ok(step5.text.includes('Campfire Ignited'));
    assert.strictEqual(step5.action.type, 'CREATE_CAMPSITE');
    assert.strictEqual(step5.action.payload.name, 'Nova Outpost');
    assert.strictEqual(step5.action.payload.template, 'gaming');
  });

  await t.test('9. Action Agent initiates expedition channel workflow and executes on confirmation', async () => {
    const userId = 'channel_user_77';
    // Step 1: initiate trigger
    const step1 = await engine.think('initiate expedition', userId);
    assert.strictEqual(step1.agent, 'ActionAgent');

    // Step 2: name
    const step2 = await engine.think('strategy-room', userId);
    assert.ok(step2.text.includes('Step 2'));

    // Step 3: type -> prompts confirmation
    const step3 = await engine.think('voice', userId);
    assert.strictEqual(step3.action.type, 'CONFIRMATION_REQUIRED');

    // Step 4: confirm -> triggers automatic channel creation
    const step4 = await engine.think('yes', userId);
    assert.strictEqual(step4.action.type, 'CREATE_CHANNEL');
    assert.strictEqual(step4.action.payload.name, 'strategy-room');
    assert.strictEqual(step4.action.payload.type, 'voice');
  });
});

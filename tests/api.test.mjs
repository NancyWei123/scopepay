import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi, scopePayTest } from '../worker/api.js';

const origin = 'https://scopepay.test';
const signingEnv = { QUOTE_SIGNING_SECRET: 'test-only-signing-secret-at-least-32-characters' };
const configuredEnv = { ...signingEnv, PAYPAL_CLIENT_ID: 'sandbox-client', PAYPAL_CLIENT_SECRET: 'sandbox-secret' };
function request(path, body, headers = {}) {
  return new Request(origin + path, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json', origin, ...headers }, body: JSON.stringify(body) });
}
async function call(path, body, env = {}, headers = {}) {
  const response = await handleApi(request(path, body, headers), env);
  return { status: response.status, data: await response.json() };
}
function response(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } }); }
async function sample(env = signingEnv) { return (await call('/api/sample', undefined, env)).data; }

function paypalMock(overrides = {}) {
  const calls = []; let order; let captures = 0;
  const fetcher = async (url, options) => {
    calls.push({ url, ...options });
    assert.ok(url.startsWith('https://api-m.sandbox.paypal.com/'), 'Only PayPal sandbox is called');
    if (url.endsWith('/v1/oauth2/token')) return response({ access_token: 'provider-secret-access-token' });
    if (options.headers['PayPal-Request-Id']) assert.ok(options.headers['PayPal-Request-Id'].length <= 38);
    if (url.endsWith('/v2/checkout/orders') && options.method === 'POST') {
      const body = JSON.parse(options.body);
      order ||= { ...body, id: '5O190127TN364715T', status: 'APPROVED' };
      return response({ id: order.id, status: 'CREATED', links: [{ rel: 'payer-action', href: `https://www.sandbox.paypal.com/checkoutnow?token=${order.id}` }] }, 201);
    }
    if (url.endsWith('/capture')) {
      captures++;
      order.status = 'COMPLETED';
      order.purchase_units[0].payments = { captures: [{ id: '8MC585209K746550J', status: overrides.captureStatus || 'COMPLETED', final_capture: true, amount: { ...order.purchase_units[0].amount, ...(overrides.captureAmount || {}) } }] };
      if (overrides.lostCaptureResponse) return response({ name: 'ORDER_ALREADY_CAPTURED' }, 422);
      // Real PayPal capture representations may omit intent, custom_id and unit amount.
      return response({ id: order.id, status: order.status, purchase_units: [{ payments: order.purchase_units[0].payments }] }, 201);
    }
    if (options.method === 'GET') {
      const copy = structuredClone(order);
      if (overrides.orderAmount) Object.assign(copy.purchase_units[0].amount, overrides.orderAmount);
      if (overrides.customId) copy.purchase_units[0].custom_id = overrides.customId;
      if (overrides.orderStatus && !captures) copy.status = overrides.orderStatus;
      return response(copy);
    }
    throw new Error('Unexpected provider request');
  };
  return { calls, fetcher, get captures() { return captures; }, get order() { return order; } };
}
async function checkout(mock, extra = {}) {
  const env = { ...configuredEnv, FETCH: mock.fetcher, ...extra };
  const quote = await sample(env);
  const created = await call('/api/orders', { quoteToken: quote.quoteToken, optionId: 'add', consent: true, amount: 0.01, currency: 'USD' }, env);
  assert.equal(created.status, 201);
  return { env, quote, created: created.data };
}

test('unconfigured build is honest and usable without pretending AI or payment ran', async () => {
  const config = await call('/api/config');
  assert.deepEqual(config.data, { aiConfigured: false, paypalConfigured: false, checkoutConfigured: false, mode: 'sandbox', currency: 'AUD' });
  const data = await sample({});
  assert.equal(data.engine, 'sample');
  assert.match(data.notice, /No AI model was called/);
  assert.equal(data.quoteToken, null);
  assert.equal(data.rate, 75);
  assert.equal(data.budget, 1800);
  const order = await call('/api/orders', { consent: true, optionId: 'add', quoteToken: 'anything' });
  assert.equal(order.status, 503);
  assert.equal(order.data.error.code, 'CHECKOUT_NOT_CONFIGURED');
  const weak = await call('/api/config', undefined, { ...configuredEnv, QUOTE_SIGNING_SECRET: 'weak' });
  assert.equal(weak.data.paypalConfigured, false);
});

test('server calculates deterministic rate-card prices, exclusions, swaps and source fingerprint', async () => {
  const data = await sample();
  assert.equal(data.options[0].amount, 675);
  assert.deepEqual(data.items.map(i => i.hours), [4, 2, 3]);
  assert.deepEqual(data.items.map(i => i.amount), [300, 150, 225]);
  assert.equal(data.options[1].amount, 0);
  assert.ok(data.options[1].changes.some(s => /Remove the project gallery/.test(s)));
  assert.ok(data.options[1].changes.some(s => /Remove the included revision/.test(s)));
  assert.ok(data.options[1].changes.some(s => /Defer: PayPal checkout/.test(s)));
  const second = await call('/api/analyze', { ...scopePayTest.sample, rate: 80 }, signingEnv);
  assert.equal(second.data.options[0].amount, 720);
  assert.notEqual(data.agreementHash, second.data.agreementHash);
  assert.equal(data.agreementHash, (await sample()).agreementHash);
  const decoded = await scopePayTest.verify(data.quoteToken, 'quote', signingEnv);
  assert.equal(decoded.amountCents, 67500);
  assert.equal(decoded.agreementHash, data.agreementHash);
  assert.ok(data.questions.some(s => /exact delivery date/.test(s)));
});

test('preview responds to inputs and never charges work without scope evidence', async () => {
  const unclear = await call('/api/analyze', { ...scopePayTest.sample, brief: 'Deliver a clean English website for a local design studio. Requirements are not yet final.', request: 'Please add French versions of the pages.' }, signingEnv);
  assert.equal(unclear.data.items[0].classification, 'unclear');
  assert.equal(unclear.data.items[0].amount, 0);
  assert.equal(unclear.data.options[0].amount, 0);
  assert.match(unclear.data.options[1].description, /does not establish enough/);
  const included = await call('/api/analyze', { ...scopePayTest.sample, brief: 'Build the agreed website. Translation and multilingual page setup are included in the fixed fee.', request: 'Please add French versions of the pages.' }, signingEnv);
  assert.equal(included.data.items[0].classification, 'included');
  assert.equal(included.data.items[0].hours, 0);
});

test('unsupported AI evidence, contradictory classifications and false removal claims are not chargeable', () => {
  const raw = { summary: 'A request.', questions: [], removals: [{ workType: 'gallery', evidence: 'Translation is excluded.' }], items: [{ title: 'French pages', workType: 'translation', classification: 'additional', evidence: 'The contract excludes all French work.', explanation: 'A claimed quote.' }] };
  const input = { ...scopePayTest.sample, brief: 'Translation is excluded. One revision round is included.' };
  const missing = scopePayTest.normalizeAnalysis(raw, input);
  assert.equal(missing.items[0].classification, 'unclear');
  assert.equal(missing.items[0].evidence, 'Needs clarification');
  assert.equal(missing.items[0].amount, 0);
  assert.deepEqual(missing.removals, []);
  raw.items[0].evidence = 'Translation is included.';
  const contrary = scopePayTest.normalizeAnalysis(raw, { ...input, brief: 'Translation is included.' });
  assert.equal(contrary.items[0].classification, 'unclear');
  assert.equal(contrary.items[0].amount, 0);
});

test('real AI adapter sends strict structured output and ignores invented model prices/hours', async () => {
  let captured;
  const env = { ...signingEnv, OPENAI_API_KEY: 'private-ai-key', FETCH: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    captured = JSON.parse(options.body);
    return response({ choices: [{ message: { content: JSON.stringify({ summary: 'Translation is outside the brief.', questions: [], removals: [], items: [{ title: 'French pages', workType: 'translation', classification: 'additional', evidence: 'Translation is excluded.', explanation: 'The brief excludes translation.', hours: 99999, amount: 0.01 }] }) } }] });
  } };
  const result = await call('/api/analyze', { ...scopePayTest.sample, brief: 'Build the agreed English website for this client. Translation is excluded.', request: 'Please add French versions of the pages.' }, env);
  assert.equal(result.status, 200);
  assert.equal(result.data.engine, 'openai');
  assert.equal(result.data.items[0].hours, 3);
  assert.equal(result.data.items[0].amount, 225);
  assert.equal(captured.response_format.json_schema.strict, true);
  assert.equal(captured.model, 'gpt-4.1-mini');
  assert.ok(!JSON.stringify(result.data).includes('private-ai-key'));
});

test('invalid and refused AI output fails explicitly rather than simulating an AI success', async () => {
  const env = { OPENAI_API_KEY: 'secret', FETCH: async () => response({ choices: [{ message: { content: 'not JSON' } }] }) };
  const result = await call('/api/analyze', scopePayTest.sample, env);
  assert.equal(result.status, 502);
  assert.equal(result.data.error.code, 'INVALID_AI_OUTPUT');
  assert.ok(!JSON.stringify(result.data).includes('secret'));
});

test('signed quote cannot be changed, expired, contradicted, or used for a non-payable option', async () => {
  const data = await sample();
  const [encoded, signature] = data.quoteToken.split('.');
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
  payload.amountCents = 1;
  const tampered = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${signature}`;
  const env = { ...configuredEnv, FETCH: () => { throw new Error('No provider should be called'); } };
  const changed = await call('/api/orders', { quoteToken: tampered, optionId: 'add', consent: true }, env);
  assert.equal(changed.status, 400);
  assert.equal(changed.data.error.code, 'INVALID_QUOTE');
  const validButWrongMath = await scopePayTest.sign(payload, signingEnv);
  const math = await call('/api/orders', { quoteToken: validButWrongMath, optionId: 'add', consent: true }, env);
  assert.equal(math.status, 400);
  const expired = await scopePayTest.sign({ ...payload, exp: Math.floor(Date.now() / 1000) - 1 }, signingEnv);
  const expiry = await call('/api/orders', { quoteToken: expired, optionId: 'add', consent: true }, env);
  assert.equal(expiry.status, 400);
  for (const optionId of ['swap', 'defer', 'unknown']) {
    const other = await call('/api/orders', { quoteToken: data.quoteToken, optionId, consent: true }, env);
    assert.equal(other.data.error.code, 'OPTION_NOT_PAYABLE');
  }
  const consent = await call('/api/orders', { quoteToken: data.quoteToken, optionId: 'add', consent: false }, env);
  assert.equal(consent.data.error.code, 'CONSENT_REQUIRED');
});

test('checkout uses signed AUD amount and server OAuth, creates approval link, then verifies a capture', async () => {
  const mock = paypalMock(); const { env, quote, created } = await checkout(mock);
  assert.equal(mock.captures, 0, 'An approval redirect alone does not capture a payment');
  const createRequest = mock.calls.find(c => c.url.endsWith('/v2/checkout/orders'));
  const posted = JSON.parse(createRequest.body);
  assert.deepEqual(posted.purchase_units[0].amount, { currency_code: 'AUD', value: '675.00' });
  assert.equal(posted.purchase_units[0].custom_id, `scopepay:${quote.id}`);
  assert.equal(posted.payment_source.paypal.experience_context.shipping_preference, 'NO_SHIPPING');
  const callback = new URL(posted.payment_source.paypal.experience_context.return_url);
  assert.equal(callback.origin, origin);
  assert.equal(callback.searchParams.get('approval'), created.returnApproval);
  const cancelled = new URL(posted.payment_source.paypal.experience_context.cancel_url);
  assert.equal(cancelled.origin, origin);
  assert.equal(cancelled.searchParams.get('paypal'), 'cancelled');
  assert.equal(cancelled.searchParams.get('approval'), created.returnApproval);
  assert.notEqual(created.returnApproval, created.approvalToken);
  assert.ok(created.approvalUrl.startsWith('https://www.sandbox.paypal.com/'));
  assert.ok(!JSON.stringify(created).includes('provider-secret-access-token'));
  const result = await call('/api/orders/capture', { orderId: created.id, approvalToken: created.approvalToken, amount: 1, currency: 'USD' }, env);
  assert.equal(result.status, 200);
  assert.equal(result.data.status, 'COMPLETED');
  assert.equal(result.data.amount, 675);
  assert.equal(result.data.agreementHash, quote.agreementHash);
  assert.equal(mock.captures, 1);
  const retry = await call('/api/orders/capture', { orderId: created.id, approvalToken: created.approvalToken }, env);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.captureId, result.data.captureId);
  assert.equal(mock.captures, 1, 'A completed order is reconciled without a second capture');
});

test('capture is blocked before provider POST when order amount, currency or scope differs', async () => {
  for (const overrides of [{ orderAmount: { value: '1.00' } }, { orderAmount: { currency_code: 'USD' } }, { customId: 'different-quote' }]) {
    const mock = paypalMock(overrides); const { env, created } = await checkout(mock);
    const result = await call('/api/orders/capture', { orderId: created.id, approvalToken: created.approvalToken }, env);
    assert.equal(result.status, 409);
    assert.equal(result.data.error.code, 'PAYMENT_MISMATCH');
    assert.equal(mock.captures, 0);
  }
});

test('unapproved and pending payments never become paid, and capture mismatch is rejected', async () => {
  const unapproved = paypalMock({ orderStatus: 'CREATED' });
  const first = await checkout(unapproved);
  const notApproved = await call('/api/orders/capture', { orderId: first.created.id, approvalToken: first.created.approvalToken }, first.env);
  assert.equal(notApproved.data.error.code, 'PAYPAL_APPROVAL_REQUIRED');
  assert.equal(unapproved.captures, 0);
  for (const overrides of [{ captureStatus: 'PENDING' }, { captureAmount: { value: '2.00' } }]) {
    const mock = paypalMock(overrides); const { env, created } = await checkout(mock);
    const result = await call('/api/orders/capture', { orderId: created.id, approvalToken: created.approvalToken }, env);
    assert.equal(result.status, 409);
    assert.equal(result.data.error.code, 'PAYMENT_NOT_COMPLETE');
  }
});

test('uncertain capture responses are reconciled and requests have stable provider idempotency keys', async () => {
  const mock = paypalMock({ lostCaptureResponse: true }); const { env, quote, created } = await checkout(mock);
  const again = await call('/api/orders', { quoteToken: quote.quoteToken, optionId: 'add', consent: true }, env);
  assert.equal(again.status, 201);
  const createKeys = mock.calls.filter(c => c.url.endsWith('/v2/checkout/orders')).map(c => c.headers['PayPal-Request-Id']);
  assert.equal(createKeys[0], createKeys[1]);
  const result = await call('/api/orders/capture', { orderId: created.id, approvalToken: created.approvalToken }, env);
  assert.equal(result.status, 200);
  assert.equal(result.data.status, 'COMPLETED');
});

test('approval is tied to its PayPal order and callback handoff cannot be used for capture', async () => {
  const mock = paypalMock(); const { env, created } = await checkout(mock);
  const wrongOrder = await call('/api/orders/capture', { orderId: 'DIFFERENT12345678', approvalToken: created.approvalToken }, env);
  assert.equal(wrongOrder.data.error.code, 'INVALID_APPROVAL');
  const handoff = await call('/api/orders/capture', { orderId: created.id, approvalToken: created.returnApproval }, env);
  assert.equal(handoff.data.error.code, 'INVALID_QUOTE');
  assert.equal(mock.captures, 0);
});

test('input, origin and body-size validation fail safely before any provider calls', async () => {
  const crossOrigin = await call('/api/analyze', scopePayTest.sample, {}, { origin: 'https://attacker.test' });
  assert.equal(crossOrigin.status, 403);
  for (const invalid of [{ rate: -1 }, { rate: 0.1 }, { rate: 75.111 }, { budget: -20 }, { brief: '' }, { request: 'tiny' }]) {
    const result = await call('/api/analyze', { ...scopePayTest.sample, ...invalid });
    assert.equal(result.status, 400);
  }
  const oversized = await call('/api/analyze', { ...scopePayTest.sample, brief: 'a'.repeat(40_000) });
  assert.equal(oversized.status, 413);
  const invalidJson = await handleApi(new Request(origin + '/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' }), {});
  assert.equal(invalidJson.status, 400);
});

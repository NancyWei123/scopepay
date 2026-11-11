import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import vm from 'node:vm';
import http from 'node:http';
import worker from '../worker/index.js';
import { page } from '../worker/ui.js';

test('workspace renders without a provider and every inline script parses', async () => {
  const response = await worker.fetch(new Request('https://scopepay.test/'), {});
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(await response.text(), /ScopePay/);
  const scripts = [...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length > 0);
  for (const [, script] of scripts) new vm.Script(script);
  assert.equal((await worker.fetch(new Request('https://scopepay.test/missing'), {})).status, 404);
});

async function withServer(env, callback) {
  const child = spawn(process.execPath, ['scripts/dev.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, OPENAI_API_KEY: '', PAYPAL_CLIENT_ID: '', PAYPAL_CLIENT_SECRET: '', QUOTE_SIGNING_SECRET: '', PUBLIC_ORIGIN: '', PORT: '0', HOST: '127.0.0.1', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const origin = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Local adapter did not start')), 5000);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.stdout.on('data', data => {
        const match = String(data).match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) { clearTimeout(timer); resolve(match[0]); }
      });
      child.once('exit', code => { clearTimeout(timer); reject(new Error('Adapter exited: ' + code)); });
    });
    await callback(origin);
  } finally {
    child.kill();
    if (child.exitCode === null) await once(child, 'exit');
  }
}

test('Node adapter accepts localhost origin even when binding 127.0.0.1', async () => {
  await withServer({}, async origin => {
    const port = new URL(origin).port;
    const sample = await (await fetch(origin + '/api/sample')).json();
    const response = await fetch('http://localhost:' + port + '/api/analyze', {
      method: 'POST', headers: { Origin: 'http://localhost:' + port, 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: sample.brief, request: sample.request, rate: sample.rate, budget: sample.budget }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).engine, 'sample');
  });
});

test('Node proxy hosting uses configured public origin for API authorization', async () => {
  await withServer({ PUBLIC_ORIGIN: 'https://scopepay.example' }, async origin => {
    const sample = await (await fetch(origin + '/api/sample')).json();
    const options = { method: 'POST', headers: { Origin: 'https://scopepay.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ brief: sample.brief, request: sample.request, rate: sample.rate, budget: sample.budget }) };
    assert.equal((await fetch(origin + '/api/analyze', options)).status, 200);
    options.headers.Origin = 'https://another.example';
    assert.equal((await fetch(origin + '/api/analyze', options)).status, 403);
  });
});

test('Node adapter rejects network-path targets that could change a PayPal callback origin', async () => {
  await withServer({ PUBLIC_ORIGIN: 'https://scopepay.example' }, async origin => {
    for (const path of ['//attacker.example/api/config', '/\\attacker.example/api/config']) {
      const status = await new Promise((resolve, reject) => {
        const url = new URL(origin);
        const request = http.get({ hostname: url.hostname, port: url.port, path }, response => {
          response.resume(); resolve(response.statusCode);
        });
        request.on('error', reject);
      });
      assert.equal(status, 400);
    }
  });
});

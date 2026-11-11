import http from 'node:http';
import worker from '../worker/index.js';

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || '127.0.0.1';
const configuredOrigin = process.env.PUBLIC_ORIGIN ? new URL(process.env.PUBLIC_ORIGIN).origin : null;
if (configuredOrigin && !/^https?:\/\//.test(configuredOrigin)) throw new Error('PUBLIC_ORIGIN must use http or https.');
const server = http.createServer(async (incoming, outgoing) => {
  try {
    // HOST is a bind address, never a public URL. Behind a reverse proxy set
    // PUBLIC_ORIGIN explicitly; do not trust forwarded headers for callbacks.
    let origin = configuredOrigin;
    if (!origin) {
      const local = new URL('http://' + incoming.headers.host);
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(local.hostname)) {
        outgoing.writeHead(503, { 'content-type': 'application/json' });
        outgoing.end(JSON.stringify({ error: 'Set PUBLIC_ORIGIN to the public HTTPS URL before hosting this Node server.' }));
        return;
      }
      origin = local.origin;
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
    const method = incoming.method || 'GET';
    const init = { method, headers };
    if (method !== 'GET' && method !== 'HEAD') {
      init.body = incoming;
      init.duplex = 'half';
    }
    const path = incoming.url || '/';
    const target = new URL(path, origin);
    if (!/^\/(?![\/\\])/.test(path) || target.origin !== origin || target.username || target.password) {
      outgoing.writeHead(400, { 'content-type': 'application/json' });
      outgoing.end(JSON.stringify({ error: 'Invalid request target.' }));
      return;
    }
    const response = await worker.fetch(new Request(target, init), process.env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    outgoing.writeHead(500, { 'content-type': 'application/json' });
    outgoing.end(JSON.stringify({ error: 'Unexpected local server error.' }));
  }
});
server.listen(port, hostname, () => console.log('ScopePay: http://' + hostname + ':' + server.address().port));

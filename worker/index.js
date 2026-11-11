import { page } from './ui.js';
import { handleApi } from './api.js';

const securityHeaders = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'cache-control': 'no-store',
};

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    let response;
    if (url.pathname.startsWith('/api/')) {
      response = await handleApi(request, env);
    } else if (url.pathname === '/' && (request.method === 'GET' || request.method === 'HEAD')) {
      response = new Response(request.method === 'HEAD' ? null : page, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    } else if (url.pathname === '/favicon.ico') {
      response = new Response(null, { status: 204 });
    } else {
      response = new Response('Not found', { status: 404 });
    }
    for (const [key, value] of Object.entries(securityHeaders)) response.headers.set(key, value);
    return response;
  },
};

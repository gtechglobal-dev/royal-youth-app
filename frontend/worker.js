const RENDER_BACKEND = 'https://royal-youths.onrender.com';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Proxy API and WebSocket requests to Render backend
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
      const targetUrl = RENDER_BACKEND + url.pathname + url.search;
      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set('Host', new URL(RENDER_BACKEND).host);

      return fetch(targetUrl, {
        method: request.method,
        headers: proxyHeaders,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });
    }

    // SPA fallback: serve index.html for all non-file routes
    return env.ASSETS.fetch(new Request(new URL('/index.html', url)));
  },
};

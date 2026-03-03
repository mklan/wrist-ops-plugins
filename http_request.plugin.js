/**
 * Default plugin – forwards the request to any HTTP endpoint configured in
 * the "context.endpoint" field, mirroring the behaviour of the native
 * ApiClient so that a power-user can intercept and modify requests in JS.
 *
 * Context shape expected by this plugin:
 *   text              – the user's input text
 *   context.endpoint  – { url, method?, headers?, body? }
 *
 * If no endpoint is provided the plugin echoes the input back (useful for
 * local testing).
 */

'use strict';

module.exports = {
  name: 'http_request',
  description: 'Forward to HTTP endpoint or echo (no endpoint configured)',

  handle: async function(text, context) {
    const ep = context.options;
    if (!ep || !ep.url) {
      // No endpoint – echo back so the watch UI receives a response.
      return { result: text };
    }

    const method = (ep.method || 'POST').toUpperCase();
    const headers = {
      'Content-Type': 'application/json',
      ...(ep.headers || {})
    };
    let url = ep.url;
    let body = null;

    if (method === 'GET') {
      const hasQuery = url.indexOf('?') !== -1;
      url += `${hasQuery ? '&' : '?'}text=${encodeURIComponent(text)}`;
    } else {
      body = ep.body ? JSON.stringify(ep.body) : JSON.stringify({ text, timestamp: Date.now() });
    }

    const response = await fetch(url, {
      method,
      headers,
      body
    });

    const responseType = (ep.responseType || 'text').toLowerCase();
    let result;

    if (responseType === 'json') {
      result = await response.json();
    } else {
      result = await response.text();
    }

    if (response.ok) {
      return { result };
    } else {
      const errorBody = typeof result === 'string' ? result : JSON.stringify(result);
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }
  }
};

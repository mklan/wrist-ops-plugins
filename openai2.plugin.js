/**
 * OpenAI plugin – sends the user's text to any OpenAI-compatible
 * /v1/chat/completions endpoint and returns the assistant's reply.
 *
 * Configuration (pass in context.params or hard-code below):
 *   context.params.url          – API base URL (default: https://api.openai.com)
 *   context.params.model        – model name  (default: gpt-4o-mini)
 *   context.params.apiKey       – Authorization Bearer token
 *   context.params.systemPrompt – optional system prompt
 *
 * You can also hard-code defaults in this file if you prefer.
 */

'use strict';

module.exports = {
  name: 'openai2',
  description: 'OpenAI-compatible chat completion',

  handle: async function(text, context, callbacks) {
    const p          = context.params || {};
    const baseUrl    = p.url    || 'https://api.openai.com';
    const model      = p.model  || 'gpt-4o-mini';
    const apiKey     = p.apiKey || '';
    const sysPrompt  = p.systemPrompt || null;

    const messages = [];
    if (sysPrompt) messages.push({ role: 'system', content: sysPrompt });
    messages.push({ role: 'user', content: text });

    const bodyObj = { model: model, messages: messages, stream: true };
    const bodyStr = JSON.stringify(bodyObj);
    const endpoint = baseUrl.replace(/\/$/, '') + '/v1/chat/completions';

    const headers = {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(bodyStr)
    };
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;

    callbacks.log('Using endpoint:', endpoint);


    const fetchOpts = {
      method: 'POST',
      headers,
      body: bodyStr,
    };

    try {
      // Always streaming mode: parse SSE lines and call callbacks.onResult for each delta
      try {
        const res = await fetch(endpoint, fetchOpts);
        if (!res.ok) {
          const text = await res.text();
          callbacks.onResult('[ERROR] HTTP ' + res.status + ': ' + text);
          return { error: 'HTTP ' + res.status + ': ' + text };
        }
        const reader = res.body.getReader();
        let buffer = '';
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += Buffer.from(value).toString('utf8');
            let lines = buffer.split(/\r?\n/);
            buffer = lines.pop(); // last line may be incomplete
            for (let line of lines) {
              if (line.startsWith('data: ')) {
                let data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  let parsed = JSON.parse(data);
                  let delta = parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content;
                  if (delta) { 
                    callbacks.onResult(delta);
                    callbacks.log(delta);
                  }
                } catch (e) {}
              }
            }
          }
        }
        return { result: null };
      } catch (err) {
        // Log full error context to server console for debugging
        console.error('[OpenAI plugin] Fetch failed:', {
          endpoint,
          fetchOpts,
          error: err
        });
        callbacks.onResult('[ERROR] Fetch failed: ' + (err && err.message ? err.message : String(err)) + (err && err.stack ? ('\n' + err.stack) : '') + '\nEndpoint: ' + endpoint + '\nFetchOpts: ' + JSON.stringify(fetchOpts));
        return {
          error: 'Fetch failed: ' + (err && err.message ? err.message : String(err)),
          stack: err && err.stack ? err.stack : undefined,
          endpoint,
          fetchOpts: JSON.stringify(fetchOpts)
        };
      }
    } catch (err) {
      return { error: 'Fetch failed: ' + (err && err.message ? err.message : String(err)), stack: err && err.stack ? err.stack : undefined };
    }
  }
};

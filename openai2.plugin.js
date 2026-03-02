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

var https = require('https');
var http  = require('http');
var url   = require('url');

/**
 * Make an HTTP/HTTPS request that streams the response body.
 * Returns a promise that resolves when the stream ends.
 * onData(chunk: string) is called for each decoded text chunk.
 * onStatus(statusCode) is called once headers arrive.
 */
function streamRequest(endpoint, opts, bodyStr, onStatus, onData) {
  return new Promise(function(resolve, reject) {
    var parsed   = url.parse(endpoint);
    var isHttps  = parsed.protocol === 'https:';
    var reqOpts  = {
      hostname: parsed.hostname,
      port:     parsed.port || (isHttps ? 443 : 80),
      path:     parsed.path || '/',
      method:   opts.method || 'POST',
      headers:  opts.headers || {},
      rejectUnauthorized: opts.rejectUnauthorized !== false // true by default
    };

    var transport = isHttps ? https : http;
    var req = transport.request(reqOpts, function(res) {
      onStatus(res.statusCode, res);
      res.on('data', function(chunk) {
        onData(chunk.toString('utf8'));
      });
      res.on('end', resolve);
      res.on('error', reject);
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

module.exports = {
  name: 'openai2',
  description: 'OpenAI-compatible chat completion',

  handle: async function(text, context, callbacks) {

    callbacks.log('init');

    var p          = context.params || {};
    var baseUrl    = p.url    || 'https://api.openai.com';
    var model      = p.model  || 'gpt-4o-mini';
    var apiKey     = p.apiKey || '';
    var sysPrompt  = p.systemPrompt || null;
    var verifySSL  = (p.verifySSL === false || p.verifySSL === 'false') ? false : true;

    var messages = [];
    if (sysPrompt) messages.push({ role: 'system', content: sysPrompt });
    messages.push({ role: 'user', content: text });

    var bodyObj  = { model: model, messages: messages, stream: true };
    var bodyStr  = JSON.stringify(bodyObj);
    var endpoint = baseUrl.replace(/\/$/, '') + '/v1/chat/completions';

    var headers = {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(bodyStr)
    };
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;

    try {
      var statusCode = 200;
      var statusRes  = null;
      var buffer     = '';

      await streamRequest(
        endpoint,
        { method: 'POST', headers: headers, rejectUnauthorized: verifySSL },
        bodyStr,
        function(code, res) { statusCode = code; statusRes = res; },
        function(chunk) {
          buffer += chunk;
          var lines = buffer.split(/\r?\n/);
          buffer = lines.pop(); // keep incomplete trailing line
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line.startsWith('data: ')) continue;
            var data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              var parsed  = JSON.parse(data);
              var delta   = parsed.choices &&
                            parsed.choices[0].delta &&
                            parsed.choices[0].delta.content;
              if (delta) callbacks.onResult(delta);
            } catch (e) {}
          }
        }
      );

      if (statusCode < 200 || statusCode >= 300) {
        var errMsg = '[ERROR] HTTP ' + statusCode;
        callbacks.onResult(errMsg);
        return { error: errMsg };
      }

      return { result: null };

    } catch (err) {
      var msg = 'Fetch failed: ' + (err && err.message ? err.message : String(err));
      console.error('[OpenAI plugin]', msg, '\nEndpoint:', endpoint, '\n', err);
      callbacks.onResult('[ERROR] ' + msg + '\nEndpoint: ' + endpoint);
      return { error: msg, stack: err && err.stack ? err.stack : undefined };
    }
  }
};

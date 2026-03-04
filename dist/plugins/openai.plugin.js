"use strict";
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
const plugin = {
    name: "openai",
    description: "OpenAI-compatible chat completion",
    options: {
        url: {
            type: "string",
            label: "API Base URL",
            description: 'Base URL for the OpenAI-compatible API (default: "https://api.openai.com")',
        },
        model: {
            type: "string",
            label: "Model Name",
            description: 'Model name to use (default: "gpt-4o-mini")',
        },
        apiKey: {
            type: "string",
            label: "API Key",
            description: "Bearer token for Authorization header",
        },
        systemPrompt: {
            type: "string",
            label: "System Prompt",
            description: "Optional system prompt to include at the start of the conversation",
        },
        chatCompletionsPath: {
            type: "string",
            label: "Chat Completions Path",
            description: 'Path for chat completions endpoint (default: "/v1/chat/completions")',
        },
    },
    handle: async function (context, hooks) {
        const p = context.params || {};
        const o = context.options || {};
        const baseUrl = o.url || "https://api.openai.com";
        const model = o.model || "gpt-4o-mini";
        const chatCompletionsPath = o.chatCompletionsPath || "/v1/chat/completions";
        const apiKey = o.apiKey || "";
        const sysPrompt = o.systemPrompt || null;
        // Use context.messages for multi-turn chat if present, otherwise build messages from sysPrompt and text
        let messages = [];
        if (context.messages &&
            Array.isArray(context.messages) &&
            context.messages.length > 0) {
            messages = context.messages.slice();
            // Optionally inject system prompt if not present
            if (sysPrompt && messages[0]?.role !== "system") {
                messages.unshift({ role: "system", content: sysPrompt });
            }
        }
        else {
            if (sysPrompt)
                messages.push({ role: "system", content: sysPrompt });
            messages.push({ role: "user", content: p.query || context.text });
        }
        const bodyObj = { model, messages, stream: true };
        const bodyStr = JSON.stringify(bodyObj);
        const endpoint = baseUrl.replace(/\/$/, "") + chatCompletionsPath;
        const headers = {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bodyStr).toString(),
        };
        if (apiKey)
            headers["Authorization"] = "Bearer " + apiKey;
        if (hooks?.log)
            hooks.log("options", o);
        const fetchOpts = {
            method: "POST",
            headers,
            body: bodyStr,
        };
        try {
            // Always streaming mode: parse SSE lines and call hooks.onResult for each delta
            try {
                const res = await fetch(endpoint, fetchOpts);
                if (!res.ok) {
                    const errBody = await res.text();
                    throw new Error("HTTP " + res.status + ": " + errBody);
                }
                const reader = res.body?.getReader();
                if (!reader) {
                    throw new Error("Response body is not readable");
                }
                let buffer = "";
                let done = false;
                while (!done) {
                    const { value, done: doneReading } = await reader.read();
                    done = doneReading;
                    if (value) {
                        buffer += Buffer.from(value).toString("utf8");
                        const lines = buffer.split(/\r?\n/);
                        buffer = lines.pop() || ""; // last line may be incomplete
                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const data = line.slice(6).trim();
                                if (data === "[DONE]")
                                    continue;
                                try {
                                    const parsed = JSON.parse(data);
                                    const delta = parsed.choices?.[0]?.delta?.content;
                                    if (delta && hooks?.onResult) {
                                        hooks.onResult(delta);
                                        hooks.log(delta);
                                    }
                                }
                                catch (e) {
                                    // Silently skip malformed JSON lines
                                }
                            }
                        }
                    }
                }
                return null; // all content already streamed via onResult
            }
            catch (err) {
                // Log full error context to server console for debugging
                console.error("[OpenAI plugin] Fetch failed:", {
                    endpoint,
                    fetchOpts,
                    error: err,
                });
                throw err;
            }
        }
        catch (err) {
            throw err;
        }
    },
};
module.exports = plugin;
//# sourceMappingURL=openai.plugin.js.map
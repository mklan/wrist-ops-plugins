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
import { Plugin } from "../types/plugin.types";
declare const plugin: Plugin;
export = plugin;
//# sourceMappingURL=openai.plugin.d.ts.map
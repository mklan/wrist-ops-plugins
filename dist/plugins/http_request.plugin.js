"use strict";
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
const plugin = {
    name: "http_request",
    description: "Forward to HTTP endpoint",
    options: {
        transformContext: {
            type: "string",
            label: "Context Transformer (JS)",
            description: "Optional JS function as a string. It will be evaluated and called with the context, and its return value will be deep merged into the current context.",
        },
        url: {
            type: "string",
            label: "Endpoint URL",
            description: "The URL to forward the request to. If not set, the plugin will just echo the input text.",
        },
        method: {
            type: "string",
            label: "HTTP Method",
            description: "HTTP method to use (default: POST)",
        },
        // headers: {
        //   type: "string",
        //   label: "HTTP Headers (JSON)",
        //   description:
        //     'Optional HTTP headers as a JSON string, e.g. \'{"Authorization": "Bearer ..."}\'',
        // },
        body: {
            type: "string",
            label: "Request Body (JSON)",
            description: 'Optional request body as a JSON string. If not set, defaults to {"text": "<input text>", "timestamp": <current time>}.',
        },
        responseType: {
            type: "string",
            label: "Response Type",
            description: 'Expected response type: "text" or "json" (default: "text"). If "json" is selected and the response is JSON, it will be parsed before being returned.',
        },
        resultPath: {
            type: "string",
            label: "Result Path",
            description: 'If responseType is "json", an optional dot-separated path to extract a specific field from the JSON response, e.g. "choices.0.text".',
        },
    },
    handle: async function (context, hooks) {
        if (context.options?.transformContext) {
            context = (await hooks.eval(context.options.transformContext, context));
        }
        const { options } = context;
        const method = (options.method || "POST").toUpperCase();
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers ? options.headers : {}),
        };
        let url = options.url;
        let body = null;
        // Define bodyObj once for both GET and non-GET
        const bodyObj = options.body
            ? options.body
            : {
                text: context.text,
                params: context.params,
                options: context.options,
                timestamp: Date.now(),
            };
        if (method === "GET") {
            // Use URLSearchParams for functional and standard conversion
            const params = new URLSearchParams(typeof bodyObj === "object" && bodyObj !== null
                ? Object.entries(bodyObj).reduce((acc, [key, value]) => {
                    // Flatten nested objects as JSON strings
                    acc[key] =
                        typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value);
                    return acc;
                }, {})
                : { text: String(bodyObj) });
            const hasQuery = url.indexOf("?") !== -1;
            url += `${hasQuery ? "&" : "?"}${params.toString()}`;
        }
        else {
            body = JSON.stringify(bodyObj);
        }
        try {
            const response = await fetch(url, {
                method,
                headers,
                body,
            });
            const responseType = (options.responseType || "text").toLowerCase();
            let result;
            if (responseType === "json") {
                result = await response.json();
                if (options.resultPath) {
                    const pathParts = options.resultPath.split(".");
                    for (const part of pathParts) {
                        if (result && part in result) {
                            result = result[part];
                        }
                        else {
                            result = undefined;
                            break;
                        }
                    }
                }
            }
            else {
                result = await response.text();
            }
            if (!response.ok) {
                return {
                    result,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            }
            return { result };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return { result: null, error: `Request failed: ${errorMsg}` };
        }
    },
};
module.exports = plugin;
//# sourceMappingURL=http_request.plugin.js.map
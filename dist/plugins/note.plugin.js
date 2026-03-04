"use strict";
/**
 * Note plugin – Creates a new note via API
 *
 * Context requirements:
 *   context.params.apiKey – Authorization API key
 *   context.params.note   – Note payload object
 */
const plugin = {
    name: "note",
    description: "Creates a new note",
    options: {
        apiKey: {
            type: "string",
            label: "API Key",
            description: "Your API key for authentication",
            required: true,
        },
    },
    handle: async function (context) {
        const { note } = context.params || {};
        const { apiKey } = context.options || {};
        const res = await fetch("https://startpage-api.klanm.at/note", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey || "",
            },
            body: JSON.stringify({ payload: note }),
        });
        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Note API error ${res.status}: ${errBody}`);
        }
        return { result: "note created" };
    },
};
module.exports = plugin;
//# sourceMappingURL=note.plugin.js.map
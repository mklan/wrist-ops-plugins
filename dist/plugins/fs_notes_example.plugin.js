"use strict";
const plugin = {
    name: "fs_notes_example",
    description: "Demo: Create, list, and read notes using the plugin_data filesystem.",
    params: {
        note: {
            label: "Note Text",
            description: "Text to save as a note (for create)",
        },
    },
    handle: async function (context, hooks) {
        const { note } = context.params;
        const fname = `note_${Date.now()}.txt`;
        await hooks.fs.write(fname, note || "");
        await hooks.log("Note created:", fname);
        const content = await hooks.fs.read(fname);
        hooks.log(`Content of ${fname}: ${content}`);
        const files = await hooks.fs.list();
        return `Notes: "${files.join(", ")}"`;
    },
};
module.exports = plugin;
//# sourceMappingURL=fs_notes_example.plugin.js.map
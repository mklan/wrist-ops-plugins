import {
  Context,
  Plugin,
  PluginHooks,
  PluginResult,
} from "../types/plugin.types";

const plugin: Plugin = {
  name: "spotify",
  description:
    "Starts Spotify and opens Justin Bieber's artist page for testing.",
  examplePattern: "^play justin bieber$",
  handle: async function (
    context: Context,
    hooks: PluginHooks,
  ): Promise<PluginResult> {
    await hooks.intent("android.intent.action.VIEW", {
      data: "spotify:artist:1uNFoZAHBGtllmzznpCI3s",
      packageName: "com.spotify.music",
    });
    await hooks.log("Spotify intent sent for Justin Bieber");
    return { result: "Spotify opened to Justin Bieber's artist page." };
  },
};

export = plugin;

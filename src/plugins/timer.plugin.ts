import {
  Context,
  Plugin,
  PluginHooks,
  PluginResult,
} from "../types/plugin.types";

const plugin: Plugin = {
  name: "timer",
  description: "Sets a timer for a given number of seconds, minutes, or hours.",
  examplePattern:
    "^(?:[Tt]imer auf )(?:(?<seconds>\\d+) Sekunden?|(?<minutes>\\d+) Minuten?|(?<hours>\\d+) Stunden?).*",
  handle: async function (
    context: Context,
    hooks: PluginHooks,
  ): Promise<PluginResult> {
    let seconds = 0;
    if (context.params.seconds) {
      seconds = Number(context.params.seconds);
    } else if (context.params.minutes) {
      seconds = Number(context.params.minutes) * 60;
    } else if (context.params.hours) {
      seconds = Number(context.params.hours) * 3600;
    }
    if (!seconds || isNaN(seconds) || seconds <= 0) {
      return { result: null, error: "No valid timer duration provided." };
    }
    // Try sending a timer intent (Wear OS)
    await hooks.intent("android.intent.action.SET_TIMER", {
      extras: {
        "android.intent.extra.alarm.LENGTH": seconds,
        "android.intent.extra.alarm.SKIP_UI": true,
      },
    });
    await hooks.log(`Timer intent sent for ${seconds} seconds`);
    return { result: `Timer set for ${seconds} seconds.` };
  },
};

export = plugin;

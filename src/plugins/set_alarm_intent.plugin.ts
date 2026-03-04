import {
  Context,
  Plugin,
  PluginHooks,
  PluginResult,
} from "../types/plugin.types";

const plugin: Plugin = {
  name: "set_alarm_intent",
  description:
    "Triggers an Android Intent to set an alarm at the provided time.",
  examplePattern:
    "^set alarm for (?<time>\\d{1,2}:\\d{2})(?: with message (?<message>.+))?",
  handle: async function (
    context: Context,
    hooks: PluginHooks,
  ): Promise<PluginResult> {
    const { time, message } = context.params;
    if (!time) {
      return { result: null, error: "Time is required" };
    }
    // Android Intent for setting alarm
    const intent = {
      action: "com.android.alarmclock.SET_ALARM",
      extras: {
        "android.intent.extra.alarm.HOUR": parseInt(time.split(":")[0], 10),
        "android.intent.extra.alarm.MINUTES": parseInt(time.split(":")[1], 10),
        ...(message ? { "android.intent.extra.alarm.MESSAGE": message } : {}),
      },
    };
    await hooks.intent(intent.action, { extras: intent.extras });
    await hooks.log(`Alarm intent sent for ${time}`);
    return {
      result: `Alarm set for ${time}${message ? ` with message: ${message}` : ""}`,
    };
  },
};

export = plugin;

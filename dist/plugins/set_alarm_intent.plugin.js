"use strict";
const plugin = {
    name: "set_alarm_intent",
    description: "Triggers an Android Intent to set an alarm at the provided time.",
    options: {
        time: {
            type: "string",
            label: "Alarm Time",
            description: "Time for the alarm in HH:mm format (e.g. 07:30)",
            required: true,
        },
        message: {
            type: "string",
            label: "Alarm Message",
            description: "Optional message to display with the alarm.",
        },
    },
    examplePattern: "^set alarm for (?<time>\\d{1,2}:\\d{2})(?: with message (?<message>.+))?",
    handle: async function (context, hooks) {
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
        return { result: null, error: "Intent hook not available" };
    },
};
module.exports = plugin;
//# sourceMappingURL=set_alarm_intent.plugin.js.map
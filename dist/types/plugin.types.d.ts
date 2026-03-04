/**
 * Shared plugin interfaces for Wrist Assist plugins
 */
export interface Context {
    options: Record<string, any>;
    params: Record<string, any>;
    text: string;
    messages?: Message[];
}
export type PluginResult = {
    result: any;
    error?: string;
} | string;
export type PluginOptionType = "string" | "boolean" | "number";
export interface PluginOptionDescriptor {
    type: PluginOptionType;
    label: string;
    description?: string;
    default?: string | boolean | number;
    required?: boolean;
    enum?: Array<string | number | boolean>;
}
export type PluginOptionsSchema = Record<string, PluginOptionDescriptor>;
export interface Plugin {
    name: string;
    description: string;
    options?: PluginOptionsSchema;
    examplePattern?: string;
    handle: (context: Context, hooks: PluginHooks) => Promise<PluginResult | null>;
}
export interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}
/** Hooks injected into every plugin handle() call */
export interface PluginHooks {
    /** Stream a partial result chunk to the watch UI */
    onResult(chunk: string): void;
    /** Log a message to the server console and optional log endpoint */
    log(...args: unknown[]): Promise<void>;
    /**
     * Fire an Android Activity Intent from the plugin.
     *
     * Requires the app to be running on an Android device; throws if the
     * ANDROID_HOOKS_URL environment variable is not set.
     */
    intent(action: string, options?: IntentOptions): Promise<void>;
    /**
     * Sandboxed read/write/delete access to the device's plugin_data directory.
     *
     * All filenames are relative to plugin_data/ and must not escape the
     * sandbox via directory traversal (throws SecurityException otherwise).
     */
    fs: FsHooks;
    /**
     * Delegate to another loaded plugin.
     *
     * @param targetName  Name of the target plugin (must be loaded)
     * @param overrides   Partial context fields to merge before calling the target
     *                    (e.g. `{ options: { stream: false } }`)
     * @returns Whatever the target plugin's handle() returns
     */
    call(targetName: string, overrides?: Partial<PluginContext>): Promise<unknown>;
}
export interface IntentOptions {
    data?: string;
    type?: string;
    extras?: Record<string, string | number | boolean>;
    flags?: number;
    /** Target package for explicit intents (idiomatic JS name) */
    packageName?: string;
    /** Target package for explicit intents (legacy alias for packageName) */
    package?: string;
}
export interface FsHooks {
    write(filename: string, content: string): Promise<void>;
    read(filename: string): Promise<string>;
    delete(filename: string): Promise<boolean>;
    list(): Promise<string[]>;
}
export interface PluginContext {
    text: string;
    options: Record<string, unknown>;
    params: Record<string, string>;
    action: string;
    pluginDir: string;
    config: Record<string, unknown>;
    messages: Message[];
}
//# sourceMappingURL=plugin.types.d.ts.map
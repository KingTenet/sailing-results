export const env = { GOOGLE_SDK_NODE_LOGGING: 'false' };
export const stdout = { isTTY: false };
export const stderr = { isTTY: false };
export const version = 'v16.0.0';
export const versions = {};
export const platform = 'browser';
export const browser = true;
export const cwd = () => '/';
export const nextTick = (cb) => setTimeout(cb, 0);
export const on = () => {};
export const addListener = () => {};
export const once = () => {};
export const off = () => {};
export const removeListener = () => {};
export const removeAllListeners = () => {};
export const emit = () => {};

const processShim = {
    env,
    stdout,
    stderr,
    version,
    versions,
    platform,
    browser,
    cwd,
    nextTick,
    on,
    addListener,
    once,
    off,
    removeListener,
    removeAllListeners,
    emit
};

export default processShim;

if (typeof window !== 'undefined') {
    window.process = window.process || {};
    Object.assign(window.process, processShim);
}

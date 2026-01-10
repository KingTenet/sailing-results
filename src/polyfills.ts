
if (typeof window !== 'undefined') {
    window.global = window;
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    window.process.env.GOOGLE_SDK_NODE_LOGGING = "false";
    window.process.stdout = window.process.stdout || {};
    window.process.stderr = window.process.stderr || {};
    // @ts-ignore
    window.process.stdout.isTTY = false;
    // @ts-ignore
    window.process.stderr.isTTY = false;
}

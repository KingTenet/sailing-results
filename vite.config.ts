import { ConfigEnv, defineConfig, loadEnv, ResolvedConfig, UserConfig } from 'vite'
import { nodePolyfills } from "vite-plugin-node-polyfills";
import react from '@vitejs/plugin-react'
import { join } from 'node:path'
import { buildSync } from "esbuild"


export default defineConfig(({ command, mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '')
    return {
        // vite config
        base: env.VITE_APP_URL,
        plugins: [
            {
                apply: "build",
                enforce: "post",
                name: 'html-transform',
                transformIndexHtml(html) {
                    buildSync({
                        minify: true,
                        bundle: true,
                        define: {
                            'process.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL)
                        },
                        entryPoints: [join(process.cwd(), "src", "service-worker.js")],
                        outfile: join(process.cwd(), "dist", "service-worker.js"),
                    });
                    return html;
                },
            },
            react(),
            nodePolyfills(), // https://www.npmjs.com/package/vite-plugin-node-polyfills
        ],
        server: {
            host: "0.0.0.0"
        },
        preview: {
            host: "0.0.0.0"
        },
    }
});

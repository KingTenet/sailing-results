import { ConfigEnv, defineConfig, loadEnv, UserConfig, UserConfigExport } from 'vite'
import { nodePolyfills } from "vite-plugin-node-polyfills";
import react from '@vitejs/plugin-react'
import process from 'node:process'
import VitePWAPlugin from "./sw.vite.config"


export default defineConfig(({ mode }: UserConfig) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode || "development", process.cwd(), '')
    return {
        base: env.VITE_APP_URL,
        plugins: [
            react(),
            VitePWAPlugin(env.VITE_APP_URL),
            nodePolyfills(), // https://www.npmjs.com/package/vite-plugin-node-polyfills
        ],
        server: {
            host: "0.0.0.0"
        },
        preview: {
            host: "0.0.0.0"
        },
    } as UserConfig
});

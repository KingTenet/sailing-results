import { defineConfig, loadEnv, UserConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import react from "@vitejs/plugin-react";
import process from "node:process";
import VitePWAPlugin from "./sw.vite.config";
import path from "path";

export default defineConfig(({ mode }: UserConfig) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode || "development", process.cwd(), "");
    return {
        base: env.VITE_APP_URL,
        plugins: [
            react(),
            VitePWAPlugin(env.VITE_APP_URL),
            nodePolyfills({
                exclude: ["process"],
                globals: {
                    process: false,
                },
            }), // https://www.npmjs.com/package/vite-plugin-node-polyfills
        ],
        server: {
            host: "0.0.0.0",
            port: 3000
        },
        preview: {
            host: "0.0.0.0"
        },
        resolve: {
            alias: {
                "process": path.resolve(process.cwd(), "src/process-polyfill.js"),
                "node:process": path.resolve(process.cwd(), "src/process-polyfill.js"),
                "@": path.resolve(__dirname, "./src"),
            },
        },
    } as UserConfig;
});

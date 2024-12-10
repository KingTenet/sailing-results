import process from "node:process";
import type { ManifestOptions, VitePWAOptions } from "vite-plugin-pwa";
import { VitePWA } from "vite-plugin-pwa";
import replace from "@rollup/plugin-replace";
import { PluginOption } from "vite";

function getPWAOptions(base: string) {
    const pwaOptions: Partial<VitePWAOptions> = {
        registerType: "autoUpdate",
        base: base,
        includeAssets: [
            "favicon.ico",
            "apple-touch-icon.png",
            "maskable_icon_x512.png",
        ],
        manifest: {
            name: "NHEBSC Racing Results",
            short_name: "NHEBSC Results",
            theme_color: "#000000",
            background_color: "#ffffff",
            start_url: ".",
            display: "standalone",
            orientation: "portrait",
            icons: [
                {
                    src: "./android-chrome-192x192.png",
                    sizes: "192x192",
                    type: "image/png",
                    purpose: "any",
                },
                {
                    src: "./android-chrome-512x512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "any",
                },
                {
                    src: "./maskable_icon_x192.png",
                    sizes: "192x192",
                    type: "image/png",
                    purpose: "maskable",
                },
                {
                    src: "./maskable_icon_x512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable",
                },
            ],
        },
        devOptions: {
            enabled: process.env.SW_DEV === "true",
            /* when using generateSW the PWA plugin will switch to classic */
            type: "module",
            navigateFallback: "index.html",
        },
        workbox: {
            maximumFileSizeToCacheInBytes: 4194304,
        },
    };

    const claims = process.env.CLAIMS === "true";
    const selfDestroying = process.env.SW_DESTROY === "true";

    if (process.env.SW === "true") {
        pwaOptions.srcDir = "src";
        pwaOptions.filename = claims ? "claims-sw.ts" : "prompt-sw.ts";
        pwaOptions.strategies = "injectManifest";
        (pwaOptions.manifest as Partial<ManifestOptions>).name =
            "PWA Inject Manifest";
        (pwaOptions.manifest as Partial<ManifestOptions>).short_name =
            "PWA Inject";
        pwaOptions.injectManifest = {
            minify: false,
            enableWorkboxModulesLogs: true,
        };
    }

    if (claims) pwaOptions.registerType = "autoUpdate";

    if (selfDestroying) pwaOptions.selfDestroying = selfDestroying;

    return pwaOptions;
}

const replaceOptions = { __DATE__: new Date().toISOString() };

const reload = process.env.RELOAD_SW === "true";

if (reload) {
    // @ts-expect-error just ignore
    replaceOptions.__RELOAD_SW__ = "true";
}

export default function VitePWAPlugin(base: string): PluginOption[] {
    return [
        VitePWA(getPWAOptions(base)),
        replace(replaceOptions) as PluginOption,
    ];
}

import { fileURLToPath } from "url";

/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
const config = {
    plugins: [
        // "@ianvs/prettier-plugin-sort-imports",
        "prettier-plugin-tailwindcss",
    ],
    tailwindConfig: fileURLToPath(
        new URL("./tailwind.config.js", import.meta.url),
    ),
    tailwindFunctions: ["cn", "cva"],
    importOrder: [
        "<TYPES>",
        "^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
        "^(next/(.*)$)|^(next$)",
        "^(expo(.*)$)|^(expo$)",
        "<THIRD_PARTY_MODULES>",
        "",
        "<TYPES>^@GeoScheduler",
        "^@GeoScheduler/(.*)$",
        "",
        "<TYPES>^[.|..|~]",
        "^~/",
        "^[../]",
        "^[./]",
    ],
    importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
    importOrderTypeScriptVersion: "4.4.0",
    overrides: [
        {
            files: ["*.ts", "*.tsx", "*.js", "*.jsx"],
            options: {
                tabWidth: 4,
            },
        },
        {
            files: "*.json.hbs",
            options: {
                parser: "json",
            },
        },
        {
            files: "*.js.hbs",
            options: {
                parser: "babel",
            },
        },
    ],
};

export default config;

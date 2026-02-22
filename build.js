import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH = path.join(__dirname, "read-write-dev.json");

if (!fs.existsSync(KEY_PATH)) {
    console.error(`Error: ${KEY_PATH} not found.`);
    console.error("See README.md for instructions on setting up GCP credentials.");
    process.exit(1);
}

const creds = JSON.parse(fs.readFileSync(KEY_PATH, "utf-8"));

execSync("tsc -b && vite build", {
    stdio: "inherit",
    env: {
        ...process.env,
        VITE_PRIVATE_KEY: creds.private_key,
        VITE_CLIENT_EMAIL: creds.client_email,
    },
});

import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Load .env manually (no dotenv dep needed)
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env");
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
        const [key, ...rest] = line.split("=");
        if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
    }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIST = path.join(__dirname, "dist");
const REMOTE_PATH = "/public_html/results/test/";

if (!fs.existsSync(DIST)) {
    console.error("dist/ not found — run `node build.js` first");
    process.exit(1);
}

const password = process.env.FTP_PASSWORD;
if (!password) {
    console.error("FTP_PASSWORD env var not set — add to .env file");
    process.exit(1);
}

const client = new ftp.Client();
client.ftp.verbose = process.argv.includes("--verbose");

try {
    await client.access({
        host: "nhebsc.org.uk",
        user: "ahvpqthm",
        password,
        secure: true,
        secureOptions: { rejectUnauthorized: false },
    });

    console.log("Connected. Uploading dist/ →", REMOTE_PATH);
    await client.ensureDir(REMOTE_PATH);
    await client.clearWorkingDir();
    await client.uploadFromDir(DIST);
    console.log("Deploy complete.");
} catch (err) {
    console.error("Deploy failed:", err.message);
    process.exit(1);
} finally {
    client.close();
}

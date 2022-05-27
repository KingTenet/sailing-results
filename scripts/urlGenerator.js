import { tokenGenerator } from "../src/token.js";
import { readWrite, readOnly } from "./auth.js";
import { getISOStringFromDate, getSheetIdFromURL, parseISOString } from "../src/common.js";

const liveSourceResultsURL = "https://docs.google.com/spreadsheets/d/1Q5fuKvddf8cM6OK7mN6ZfnMzTmXGvU8z3npRlR56SoQ";
const liveSourceResultsSheetId = getSheetIdFromURL(liveSourceResultsURL);

const devSourceResultsURL = "https://docs.google.com/spreadsheets/d/1zn3IQ1BEW0KH17qQd_G9p3Jic147lfOcXxn-RGxC8ZI";
const devSourceResultsSheetId = getSheetIdFromURL(devSourceResultsURL);

const parseBoolean = (str) => Boolean(str && str.toLowerCase() !== "false");
const BASE_URL = "https://nhebsc.org.uk/results/app/#/races/";

async function run(
    date,
    isLiveStr = "false",
    isSuperUserStr = "false",
    resultsURLOverride,
) {
    if (!date) {
        console.log("Usage: node scripts/urlGenerator.js {date} [isLive=false] [isSuperUser=false] [resultsURLOverride]");
        return;
    }
    const raceDate = getISOStringFromDate(parseISOString([date, "T00:00:00.000Z"].join("")));
    const isSuperUser = parseBoolean(isSuperUserStr);
    const isReadOnly = false;
    const isLive = parseBoolean(isLiveStr);
    const auth = isReadOnly ? readOnly : readWrite;

    const params = {
        superUser: isSuperUser,
        raceDate: !isSuperUser ? raceDate : undefined,
        privateKey: auth.privateKey,
        clientEmail: auth.clientEmail,
        resultsSheetId: resultsURLOverride ? getSheetIdFromURL(resultsURLOverride)
            : isLive ? liveSourceResultsSheetId
                : devSourceResultsSheetId,
        expiry: Date.now() + 86400000 * 7, // 7 days until expiry
    };

    const token = tokenGenerator(params);

    console.log("Creating token:");
    console.log("");
    console.log(`Read only token: ${isReadOnly}`);
    console.log(`Live backend: ${params.resultsSheetId === liveSourceResultsSheetId}`);
    console.log(`Race date: ${params.raceDate}`);
    console.log(`Client email: ${params.clientEmail}`);
    console.log(`Sheet ID: ${params.resultsSheetId}`);
    console.log("");
    console.log("Token:");
    console.log("");

    console.log(`${BASE_URL}?token=${token}`);
    console.log("");
    console.log(`http://localhost:3000/#/races/?token=${token}`);
}

//(new Date(Date.now())).toISOString().slice(0,10)
// URLGenerator("http://localhost:3000/", `${((new Date(Date.now())).toISOString().slice(0, 10))}T00:00:00.000Z`, 3)


run(...process.argv.slice(2))
    .catch((err) => console.log(err));

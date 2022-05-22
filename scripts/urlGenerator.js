import { tokenGenerator } from "../src/token.js";
import { readWrite, readOnly } from "./auth.js";

const parseBoolean = (str) => str && str.toLowerCase() !== "false" ? str : undefined;

async function run(
    date,
    isReadOnlyStr = "true",
    isSuperUserStr = "false",
    baseUrl = "https://nhebsc.org.uk/results/app/#/races/"
) {
    const raceDate = [date, "T00:00:00.000Z"].join("");
    const isSuperUser = parseBoolean(isSuperUserStr);

    const isReadOnly = parseBoolean(isReadOnlyStr);
    const auth = isReadOnly ? readOnly : readWrite;

    const params = {
        superUser: isSuperUser,
        raceDate: !isSuperUser ? raceDate : undefined,
        privateKey: auth.privateKey,
        clientEmail: auth.clientEmail,
        expiry: Date.now() + 86400000 * 7, // 7 days until expiry
    };

    const token = tokenGenerator(params);

    console.log("Creating token:");
    console.log(`Race dates: ${params.raceDate}`);
    console.log(`Client email: ${params.clientEmail}`);
    console.log("");
    console.log("Token:");
    console.log("");

    console.log(`${baseUrl}?token=${token}`);
    console.log("");
    console.log(`http://localhost:3000/#/races/?token=${token}`);
}

//(new Date(Date.now())).toISOString().slice(0,10)
// URLGenerator("http://localhost:3000/", `${((new Date(Date.now())).toISOString().slice(0, 10))}T00:00:00.000Z`, 3)


run(...process.argv.slice(2))
    .catch((err) => console.log(err));

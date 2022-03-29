import { tokenGenerator } from "../src/token.js";
import auth from "./auth.js";

const resultsSheetId = "1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw";

async function run(date = (new Date(Date.now())).toISOString().slice(0, 10), numberOfRaces = 3, baseUrl = "http://localhost:3000/") {
    const raceDate = [date, "T00:00:00.000Z"].join("");
    const token = tokenGenerator(
        {
            raceDate,
            numberOfRaces: numberOfRaces,
            privateKey: auth.privateKey,
            clientEmail: auth.clientEmail,
            sheetId: resultsSheetId,
        }
    );

    console.log("Creating token:");
    console.log(`Race dates: ${raceDate}`);
    console.log(`Number of races: ${numberOfRaces}`);
    console.log(`Client email: ${auth.clientEmail}`);
    console.log(`Sheet id: ${resultsSheetId}`);
    console.log("");
    console.log("Token:");
    console.log("");

    console.log(`${baseUrl}?token=${token}`);
}

//(new Date(Date.now())).toISOString().slice(0,10)
// URLGenerator("http://localhost:3000/", `${((new Date(Date.now())).toISOString().slice(0, 10))}T00:00:00.000Z`, 3)


run(...process.argv.slice(2))
    .catch((err) => console.log(err));

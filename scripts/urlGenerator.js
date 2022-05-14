import { tokenGenerator } from "../src/token.js";
import auth from "./auth.js";

async function run(
    date = (new Date(Date.now())).toISOString().slice(0, 10),
    privateKey = auth.privateKey,
    clientEmail = auth.clientEmail,
    baseUrl = "http://localhost:3000/#/races/"
) {
    const raceDate = [date, "T00:00:00.000Z"].join("");
    const token = tokenGenerator(
        {
            raceDate,
            privateKey,
            clientEmail,
        }
    );

    console.log("Creating token:");
    console.log(`Race dates: ${raceDate}`);
    console.log(`Client email: ${clientEmail}`);
    console.log("");
    console.log("Token:");
    console.log("");

    console.log(`${baseUrl}?token=${token}`);
}

//(new Date(Date.now())).toISOString().slice(0,10)
// URLGenerator("http://localhost:3000/", `${((new Date(Date.now())).toISOString().slice(0, 10))}T00:00:00.000Z`, 3)


run(...process.argv.slice(2))
    .catch((err) => console.log(err));

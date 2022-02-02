import { tokenGenerator } from "../src/token";
import auth from "./auth";

const resultsSheetId = "1E6pI0fRm6Uj7Z8nvHK5AdeHSOAwEw1hpzdLs__WyEsY";

function URLGenerator(baseUrl, date, numberOfRaces) {
    let token = tokenGenerator(
        {
            raceDate: date,
            numberOfRaces: numberOfRaces,
            privateKey: auth.privateKey,
            clientEmail: auth.clientEmail,
            sheetId: resultsSheetId,
        }
    );
    return `${baseUrl}?token=${token}`;
}

//(new Date(Date.now())).toISOString().slice(0,10)
console.log(URLGenerator("http://localhost:3000/", `${((new Date(Date.now())).toISOString().slice(0, 10))}T00:00:00.000Z`, 3));
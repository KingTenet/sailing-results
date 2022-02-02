import { useNavigate } from "react-router-dom";
import { GoogleSpreadsheet } from "google-spreadsheet";

export function useBack() {
    let navigate = useNavigate();
    return () => navigate(-1);
}

export function parseISOString(ISOString) {
    if (!ISOString) {
        return;
    }
    const b = ISOString.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

export function getURLDate(date) {
    return date.toISOString().slice(0, 10);
}



// export function getURLDate(date) {
//     // return date.getUTCFullYear
//     let mdate = new Date;
//     mdate.getUTCFullYear;
//     mdate.getUTCMonth;
//     mdate.getUTCDate;
// }

export function getISOStringFromDate(date = new Date()) {
    return date.toISOString();
}

export function flattenMap(map) {
    let output = [];
    for (let [key, values] of [...map]) {
        output.push(...values);
    }
    return output;
}

export class AutoMap extends Map {
    constructor(getKey = JSON.stringify, getDefaultValue) {
        super();
        this.getKey = getKey;
        this.getDefaultValue = getDefaultValue;
    }

    upsert(obj, transform = (prev, obj, key) => obj) {
        let key = this.getKey(obj);
        if (!this.has(key) && this.getDefaultValue !== undefined) {
            return this.set(key, transform(this.getDefaultValue(obj), obj, key));
        }
        return this.set(key, transform(super.get(key), obj, key))
    }
}

export async function getGoogleSheetDoc(sheetId, clientEmail, privateKey) {
    try {
        const doc = new GoogleSpreadsheet(sheetId);
        await doc.useServiceAccountAuth({
            client_email: clientEmail,
            private_key: privateKey,
        });
        await doc.loadInfo();
        return doc;
    }
    catch (err) {
        if (err?.response?.status === 403) {
            throw new Error(`Check that you have granted permission to ${clientEmail} to access the google sheet ${sheetId}`)
        }
        throw err;
    }
}

export async function limitSheetsRequest(req) {
    var err;
    do {
        try {
            return await req();
        }
        catch (err) {
            if (err?.response?.statusText !== "Too Many Requests") {
                throw err;
            }
            console.log("Google Sheets API requests quota exceeded... waiting 60 seconds");
            await (new Promise((resolve) => setTimeout(resolve, 60000)));
        }
    }
    while (true)
}

export function getSheetIdFromURL(url) {
    let matches = url.match(new RegExp("^https://docs.google.com/spreadsheets/d/([^/]+)/.*$"))
    if (!matches || !matches[1]) {
        throw new Error("Invalid URL format, google sheet ID should match regex https://docs.google.com/spreadsheets/d/([^/]+)/.*$");
    }
    return matches[1];
}

export async function getAllRowsFromSheet(sheetId, auth, sheetName) {
    const doc = await getGoogleSheetDoc(sheetId, auth.clientEmail, auth.privateKey);
    const sheet = sheetName ? doc.sheetsByTitle[sheetName] : doc.sheetsByIndex[0];
    return (await limitSheetsRequest(() => sheet.getRows()));
}

export async function getAllCellsFromSheet(sheetId, auth, sheetName, filterEmptyRows = true) {
    const doc = await getGoogleSheetDoc(sheetId, auth.clientEmail, auth.privateKey);
    const sheetInfo = await doc.loadInfo();
    const sheet = sheetName ? doc.sheetsByTitle[sheetName] : doc.sheetsByIndex[0];
    return await limitSheetsRequest(async () => {
        await sheet.loadCells();
        const cells = [];
        for (let rowIndex = 0; rowIndex < sheet.rowCount; rowIndex++) {
            let newRow = (new Array(sheet.columnCount)).fill(null);
            debugger;
            let newRowEmpty = true;
            for (let columnIndex of newRow.keys()) {
                let cellValue = sheet.getCell(rowIndex, columnIndex)?.value;
                if (cellValue) {
                    newRow[columnIndex] = cellValue;
                    newRowEmpty = false;
                }
            }
            if (!filterEmptyRows || !newRowEmpty) {
                cells.push(newRow);
            }
        }
        return cells;
    });
}

export function groupBy(arr, groupFunction) {
    const map = new AutoMap(groupFunction, () => []);
    arr.forEach((item) => map.upsert(item, (prev, obj) => [...prev, obj]));
    return [...map];
}

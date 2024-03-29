import { useNavigate } from "react-router-dom";
import { GoogleSpreadsheet } from "google-spreadsheet";
import inBrowser from "./inBrowser.js";

const KEY_SEP = "::";

export function logDebug(msg, debug) {
    if (debug) {
        console.log(msg);
    }
}

export function round2sf(num) {
    return `${parseFloat(num.toFixed(2))}`;
}

export function average(arr, mapItem = (item) => item) {
    return arr.map(mapItem).reduce((acc, value) => acc + value, 0) / arr.length;
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
            return this.set(key, transform(this.getDefaultValue(obj, key), obj, key));
        }
        return this.set(key, transform(super.get(key), obj, key))
    }
}

export function groupBySingle(arr, groupFunction, transform = (arr) => arr) {
    const map = new AutoMap(groupFunction, () => []);
    arr.forEach((item) => map.upsert(item, (prev, obj) => [...prev, obj]));
    return [...map].map(([groupId, values]) => [groupId, transform(values)]);
}

export function groupBy(arr, allGroupFs, transform = (arr) => arr) {
    const groupFs = typeof (allGroupFs) === "function" ? [allGroupFs] : [...allGroupFs];
    const groupF = groupFs.reverse().pop();
    if (!groupF) {
        return transform(arr);
    }
    const groupResults = groupBySingle(arr, groupF);
    return groupResults.map(([groupId, results]) => [groupId, groupBy(results, [...groupFs].reverse(), transform)]);
}

export function mapGroupBy(arr, allGroupFs, transform = (arr) => arr) {
    // const groupFs = typeof (allGroupFs) === "function" ? [allGroupFs] : [...allGroupFs];
    const groupFs = [...allGroupFs];
    const groupF = groupFs.reverse().pop();
    if (!groupF) {
        return transform(arr);
    }
    const groupResults = groupBySingle(arr, groupF);
    return new Map(groupResults.map(([groupId, results]) => [groupId, mapGroupBy(results, [...groupFs].reverse(), transform)]));
}

export function parseIntOrUndefined(test) {
    let int = parseInt(test);
    return isNaN(int) ? undefined : int;
}

export function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

export function generateId(name, obj) {
    assertType(obj, Array);
    return [name, ...obj].join(KEY_SEP);
}

export function fromId(id) {
    return id.split(KEY_SEP).slice(1);
}

export function useBack() {
    let navigate = useNavigate();
    return () => navigate(-1);
}

export const promiseSleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

export function assertType(obj, Type) {
    if (typeof Type === "string") {
        if (Type === "number" && isNaN(obj)) {
            throw new Error(`Object isNaN but should be type:${Type}`);
        }
        if (Type === "number" && !Number.isInteger(obj)) {
            throw new Error(`Object should be an integer value`);
        }
        if (typeof obj !== Type) {
            throw new Error(`Object has type:${typeof obj} but should be type:${Type}`);
        }
    }
    else if (!(obj instanceof Type)) {
        throw new Error(`Object is not of correct type:${Type.name}`);
    }
    return obj;
}

export function parseBoolean(input) {
    return !Boolean(!input || (typeof input === "string" && input.toLowerCase() === "false"));
}

export function parseISOString(ISOString, defaultDate = new Date()) {
    if (!ISOString) {
        return defaultDate;
    }
    const b = ISOString.split(/\D+/);
    return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

export function getURLDate(date) {
    return date.toISOString().slice(0, 10);
}

export function parseURLDate(urlDate) {
    return parseISOString([urlDate, "T00:00:00.000Z"].join(""));
}

export function transformSheetsDateToDate(s) {
    const b = s.split(/\D+/);
    return new Date(Date.UTC(b[2], --b[1], b[0]));
}

export function transformDateToSheetsDate(date = Date.now()) {
    const padZeros = (num) => `0${num}`.slice(-2);
    let year = date.getUTCFullYear();
    let month = padZeros(date.getUTCMonth() + 1);
    let day = padZeros(date.getUTCDate());
    return [day, month, year].join("/");
}

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

export function flatten(arrOfArr) {
    return arrOfArr.reduce((acc, next) => acc.concat(next), []);
}

export function isOnline() {
    if (!inBrowser) {
        return true;
    }
    return window.navigator.onLine;
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
    let matches = url.match(new RegExp("^https://docs.google.com/spreadsheets/d/([^/]+)/?.*$"))
    if (!matches || !matches[1]) {
        throw new Error("Invalid URL format, google sheet ID should match regex https://docs.google.com/spreadsheets/d/([^/]+)/.*$");
    }
    return matches[1];
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

export function cleanName(str) {
    if (!str) {
        throw new Error(`No name provided.`);
    }

    let name = str.replace(/\([\s]?[\s]?\)/, "");

    if (/[^A-Za-zÀ-ÖØ-öø-ÿ'\- ]/.test(name)) {
        throw new Error(`The name: ${name} has invalid characters.`);
    }
    let cleanName = name.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'\- ]/g, "").replace(/\s+/g, " ").trim();

    if (!cleanName) {
        throw new Error(`The name: ${name} is invalid.`);
    }

    if (cleanName.split(" ").length < 2) {
        throw new Error(`Both first name and last name required.`);
    }

    for (let subName of cleanName.split(" ")) {
        if (subName.length < 2) {
            throw new Error(`Names must be at least 2 characters long.`);
        }
    }

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const capitalizeAfterChars = (str, char) => str.split(char).reduce((str, part, i) => i ? [str, capitalize(part)].join(char) : part)
    const capitalizedName = capitalize(
        [" ", "-", "'", " Mc"]
            .reduce(
                (acc, chars) => capitalizeAfterChars(acc, chars),
                ` ${cleanName}`.toLowerCase())
    ).trim();

    return capitalizedName;
}
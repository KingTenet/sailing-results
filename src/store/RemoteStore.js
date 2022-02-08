import { promiseSleep } from "../common.js";

export default class RemoteStore {
    constructor(sheetsDoc, sheetName) {
        this.sheetsDoc = sheetsDoc;
        this.sheetName = sheetName;
    }

    async getAllRows() {
        const sheet = this.sheetsDoc.sheetsByTitle[this.sheetName];
        if (!sheet) {
            throw new Error(`Couldn't get sheet named ${this.sheetName}, check it exists in the spreadsheet`);
        }
        return await sheet.getRows();
    }

    async append(rows) {
        const sheet = this.sheetsDoc.sheetsByTitle[this.sheetName];
        if (!sheet) {
            throw new Error(`Couldn't get sheet named ${this.sheetName}, check it exists in the spreadsheet`);
        }
        console.log("Adding rows");
        // console.log(JSON.stringify(rows, null, 4));
        return await sheet.addRows(rows);
    }

    static async createRemoteStore(promiseSheetsDoc, sheetName) {
        try {
            let sheetsDoc = await promiseSheetsDoc;
            return new RemoteStore(sheetsDoc, sheetName);
        }
        catch (err) {
            if (err?.code !== "ENOTFOUND") {
                throw err;
            }
            console.log("No network connection for remote store.. waiting 10s and trying again.");
            await promiseSleep(10000);
        }
    }
}
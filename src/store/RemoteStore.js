import { promiseSleep } from "../common.js";

class RemoteStoreNoNetwork extends Error { }
class RemoteStoreNoAccess extends Error { }
class RemoteStoreNoSheet extends Error { }

export default class RemoteStore {
    constructor(sheetsDoc, sheetName) {
        this.sheetsDoc = sheetsDoc;
        this.sheetName = sheetName;
    }

    async getAllRows() {
        const sheet = await this.getSheet();
        return await sheet.getRows();
    }

    async append(rows) {
        const sheet = await this.getSheet();
        console.log("Adding rows");
        // console.log(JSON.stringify(rows, null, 4));
        return await sheet.addRows(rows);
    }

    async getSheet() {
        const sheet = this.sheetsDoc.sheetsByTitle[this.sheetName];
        if (!sheet) {
            throw new RemoteStoreNoSheet(`Couldn't get sheet named ${this.sheetName}, check it exists in the spreadsheet`);
        }
        return sheet;
    }

    async createSheetIfMissing(headers) {
        const sheet = this.sheetsDoc.sheetsByTitle[this.sheetName];
        if (!sheet) {
            await this.sheetsDoc.addSheet({ title: this.sheetName });
            await this.sheetsDoc.loadInfo();
            const newSheet = this.sheetsDoc.sheetsByTitle[this.sheetName];
            if (newSheet.gridProperties.columnCount < headers.length) {
                await newSheet.resize({ rowCount: newSheet.gridProperties.rowCount, columnCount: headers.length });
            }
            await newSheet.setHeaderRow(headers);
        }
    }

    static async remoteStoreExists(promiseSheetsDoc, sheetName) {
        const remoteStore = await RemoteStore.createRemoteStore(promiseSheetsDoc, sheetName);
        await remoteStore.getSheet();
        return remoteStore;
    }

    static async createRemoteStore(promiseSheetsDoc, sheetName, createSheetIfMissing, headers) {
        try {
            let sheetsDoc = await promiseSheetsDoc;
            const remoteStore = new RemoteStore(sheetsDoc, sheetName);
            if (createSheetIfMissing) {
                await remoteStore.createSheetIfMissing(headers);
            }
            await remoteStore.getSheet();
            return remoteStore;
        }
        catch (err) {
            if (err?.code !== "ENOTFOUND") {
                throw err;
            }
            console.log(err);
            throw new RemoteStoreNoNetwork("No network connection so couldn't create remote store");
        }
    }
}

RemoteStore.NoNetwork = RemoteStoreNoNetwork;
RemoteStore.NoSheet = RemoteStoreNoSheet;
RemoteStore.NoAccess = RemoteStoreNoAccess;
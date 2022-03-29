import { isOnline, promiseSleep } from "../common";

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
            console.log(`Creating sheet ${this.sheetName} with headers:`);
            console.log(headers);
            await newSheet.setHeaderRow(headers);
        }
    }

    async isReady() {
        return isOnline();
    }

    static async retryCreateRemoteStore(promiseSheetsDoc, sheetName, createSheetIfMissing, headers) {
        try {
            return await this.createRemoteStore(promiseSheetsDoc, sheetName, createSheetIfMissing, headers);
        }
        catch (err) {
            if (err instanceof RemoteStoreNoNetwork) {
                console.log("Network error in store creation.. will sleep a bit and retry.")
                do {
                    await promiseSleep(20000);
                } while (!isOnline());
                return await this.retryCreateRemoteStore(promiseSheetsDoc, sheetName, createSheetIfMissing, headers);
            }
            throw err;
        }
    }

    static async createRemoteStore(promiseSheetsDoc, sheetName, createSheetIfMissing, headers) {
        try {
            let sheetsDoc = await promiseSheetsDoc();
            const remoteStore = new RemoteStore(sheetsDoc, sheetName);
            if (createSheetIfMissing) {
                await remoteStore.createSheetIfMissing(headers);
            }
            await remoteStore.getSheet();
            return remoteStore;
        }
        catch (err) {
            if (err?.code === "ENOTFOUND" || (err.request && err.response)) {
                throw err;
            }
            throw new RemoteStoreNoNetwork("No network connection so couldn't create remote store");
        }
    }
}

RemoteStore.NoNetwork = RemoteStoreNoNetwork;
RemoteStore.NoSheet = RemoteStoreNoSheet;
RemoteStore.NoAccess = RemoteStoreNoAccess;
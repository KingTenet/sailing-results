import { parseISOString, assertType } from "../../common.js";

export default class StoreObject {
    constructor({ lastUpdated, dateCreated }) {
        this.lastUpdated = !lastUpdated || assertType(lastUpdated, Date);
        this.dateCreated = !dateCreated || assertType(dateCreated, Date);
    }

    static addModifiedDate(obj, date = new Date()) {
        assertType(obj, StoreObject);
        obj.lastUpdated = date;
        return obj;
    }

    static addCreatedDate(obj, date = new Date()) {
        assertType(obj, StoreObject);
        obj.dateCreated = date;
        obj.lastUpdated = date;
        return obj;
    }

    getLastUpdated() {
        return this.lastUpdated;
    }

    getDateCreated() {
        return this.dateCreated;
    }

    updatedAfterDate(date) {
        assertType(date, Date);
        return this.lastUpdated > date;
    }

    createdAfterDate(date) {
        assertType(date, Date);
        return this.dateCreated > date;
    }

    static sheetHeaders() {
        return [
            "Last Updated",
            "Created Date",
        ];
    }

    static fromStore({ "Last Updated": lastUpdated, "Created Date": dateCreated }) {
        return {
            lastUpdated: parseISOString(lastUpdated, new Date(0)),
            dateCreated: parseISOString(dateCreated, new Date(0)),
        };
    }

    static validateHeaders(headers, Type) {
        const sheetHeaders = Type.sheetHeaders();
        const headerKeys = Object.keys(headers);
        const headerNotAllowed = headerKeys.find((header) => !sheetHeaders.includes(header));
        if (headerNotAllowed) {
            throw new Error(`Mismatch of store headers for type:${Type.name}, unexpected header:${headerNotAllowed}`);
        }
        const headerMissing = sheetHeaders.find((header) => !headerKeys.includes(header));
        if (headerMissing) {
            throw new Error(`Mismatch of store headers for type:${Type.name}, missing header:${headerMissing}`);
        }
        return headers;
    }

    toStore() {
        return {
            "Last Updated": this.lastUpdated,
            "Created Date": this.dateCreated,
        };
    }
}
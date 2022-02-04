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

    static fromStore({ "Last Updated": lastUpdated, "Created Date": dateCreated }) {
        return {
            lastUpdated: parseISOString(lastUpdated, new Date(0)),
            dateCreated: parseISOString(dateCreated, new Date(0)),
        };
    }

    toStore() {
        return {
            "Last Updated": this.lastUpdated,
            "Created Date": this.dateCreated,
        };
    }
}
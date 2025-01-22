import { millisecondsInDay, millisecondsInSecond } from "date-fns/constants";
import { assertType, generateId, parseISOString } from "../../common.js";
import StoreObject from "./StoreObject.js";
import getVersion from "@/version.js";

export default class ErrorLog extends StoreObject {
    constructor(date, errorMsg, errorStack, appVersion, metadata) {
        super(metadata);
        assertType(date, Date);
        assertType(errorMsg, "string");
        assertType(errorStack, "string");
        this.date = date;
        this.errorMsg = errorMsg;
        this.errorStack = errorStack;
        this.appVersion = appVersion;
    }

    static getId(errorLog) {
        assertType(errorLog, ErrorLog);
        return generateId("ErrorLog", [
            errorLog.date.toISOString(),
            errorLog.errorMsg,
        ]);
    }

    static sheetHeaders() {
        return [
            "Date",
            "App Version",
            "Error Message",
            "Error Stack",
            ...StoreObject.sheetHeaders(),
        ];
    }

    static fromStore(storeResult) {
        let {
            Date: dateString,
            "App Version": appVersion,
            "Error Message": errorMsg,
            "Error Stack": errorStack,
        } = storeResult;

        return new ErrorLog(
            parseISOString(dateString),
            errorMsg,
            errorStack,
            appVersion,
            StoreObject.fromStore({}),
        );
    }

    static fromError(error) {
        assertType(error, Error);
        return new ErrorLog(
            new Date(),
            error.message,
            error.stack,
            getVersion(),
            StoreObject.fromStore({}),
        );
    }

    isXDaysOld(days) {
        return Date.now() - this.date.getTime() > millisecondsInSecond * days;
    }

    static sortByDateDesc(errorLogA, errorLogB) {
        assertType(errorLogA, ErrorLog);
        assertType(errorLogB, ErrorLog);
        return errorLogA.date.getTime() < errorLogB.date.getTime() ? 1 : -1;
    }

    toJSON() {
        return this.toStore();
    }

    toStore() {
        return {
            Date: this.date.toISOString(),
            "App Version": this.appVersion,
            "Error Message": this.errorMsg,
            "Error Stack": this.errorStack,
            ...super.toStore(this),
        };
    }
}

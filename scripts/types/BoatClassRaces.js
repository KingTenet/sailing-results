import { assertType } from "../../src/common.js";
import BoatClass from "../../src/store/types/BoatClass.js";

export default class BoatClassRaces extends BoatClass {
    constructor(boatClass, numResults12Month, numResults48Month) {
        assertType(boatClass, BoatClass);
        super(boatClass.className, boatClass.boatConfiguration, boatClass.PY, boatClass.validFrom, boatClass.deprecated, { lastUpdated: boatClass.lastUpdated, dateCreated: boatClass.dateCreated });
        this.numResults12Month = numResults12Month;
        this.numResults48Month = numResults48Month;
    }

    static sheetHeaders() {
        return [
            ...BoatClass.sheetHeaders(),
            "12 Month Races",
            "48 Month Results"
        ];
    }

    static fromStore(storeClass) {
        const boatClass = BoatClass.fromStore(storeClass);
        let {
            "12 Month Results": numResults12Month,
            "48 Month Results": numResults48Month,
        } = storeClass;
        return new BoatClassRaces(boatClass, numResults12Month, numResults48Month);
    }

    static fromBoatClassRaces(boatClass, numResults12Month, numResults48Month) {
        return new BoatClassRaces(boatClass, numResults12Month, numResults48Month);
    }

    toStore() {
        return {
            ...super.toStore(this),
            "12 Month Races": this.numResults12Month,
            "48 Month Results": this.numResults48Month,
        };
    }
}

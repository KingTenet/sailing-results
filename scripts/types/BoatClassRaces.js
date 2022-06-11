import { assertType } from "../../src/common.js";
import BoatClass from "../../src/store/types/BoatClass.js";

export default class BoatClassRaces extends BoatClass {
    constructor(boatClass, numRaces) {
        assertType(boatClass, BoatClass);
        super(boatClass.className, boatClass.boatConfiguration, boatClass.PY, boatClass.validFrom, boatClass.deprecated, { lastUpdated: boatClass.lastUpdated, dateCreated: boatClass.dateCreated });
        this.numRaces = numRaces;
    }

    static sheetHeaders() {
        return [
            ...BoatClass.sheetHeaders(),
            "12 Month Races"
        ];
    }

    static fromStore(storeClass) {
        const boatClass = BoatClass.fromStore(storeClass);
        let {
            "12 Month Races": numRaces,
        } = storeClass;
        return new BoatClassRaces(boatClass, numRaces);
    }

    static fromBoatClassRaces(boatClass, numRaces) {
        return new BoatClassRaces(boatClass, numRaces);
    }

    toStore() {
        return {
            ...super.toStore(this),
            "12 Month Races": this.numRaces,
        };
    }
}

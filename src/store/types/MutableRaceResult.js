import { assertType, parseURLDate } from "../../common.js";
import StoreObject from "./StoreObject.js";
import Race from "./Race.js";
import BoatClass from "./BoatClass.js";
import HelmResult from "./HelmResult.js";
import Result from "./Result.js";

export default class MutableRaceResult extends HelmResult {
    constructor(race, helm, boatClass, boatSailNumber, metadata) {
        super(race, helm, metadata);
        this.boatClass = assertType(boatClass, BoatClass);
        this.boatSailNumber = assertType(boatSailNumber, "number");
    }

    static getBoatClassId(result) {
        assertType(result, MutableRaceResult);
        return BoatClass.getId(result.boatClass);
    }

    static sheetHeaders() {
        return [
            "Sail Number",
            "Class",
            ...HelmResult.sheetHeaders(),
        ];
    }

    static fromStore(storeResult, getHelm, getBoatClassForDate) {
        let {
            "Date": dateString,
            "Race Number": raceNumber,
            "Helm": helmId,
            "Sail Number": boatSailNumber,
            "Class": boatClassName,
        } = storeResult;
        const race = new Race(parseURLDate(dateString), parseInt(raceNumber));
        return new MutableRaceResult(race, getHelm(helmId), getBoatClassForDate(boatClassName, race.getDate()), parseInt(boatSailNumber), StoreObject.fromStore(storeResult));
    }

    static fromUser(race, helm, boatClass, boatSailNumber) {
        return new MutableRaceResult(race, helm, boatClass, boatSailNumber, StoreObject.fromStore({}));
    }

    static fromResult(result) {
        assertType(result, Result);
        return MutableRaceResult.fromUser(result.getRace(), result.getHelm(), result.getBoatClass(), result.boatSailNumber);
    }

    getSailNumber() {
        return this.boatSailNumber;
    }

    getBoatClass() {
        return this.boatClass;
    }

    toStore() {
        return {
            "Sail Number": this.boatSailNumber,
            "Class": this.boatClass.getClassName(),
            ...super.toStore(this),
        };
    }
}

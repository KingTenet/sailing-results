import StoreObject from "./StoreObject.js";
import { assertType, generateId, parseIntOrUndefined } from "../../common.js";
import BoatConfiguration from "./BoatConfiguration.js";
import Race from "./Race.js";

// Changeover date is 29th March (at least for 2020)
// Might need to modify this each year (or pull from database)
const CHANGEOVER_MONTH = 2; // March
const CHANGEOVER_DATE = 29;

export default class BoatClass extends StoreObject {
    constructor(className, boatConfiguration, PY, validYear, metaData) {
        super(metaData)
        this.className = assertType(className, "string");
        this.boatConfiguration = assertType(boatConfiguration, BoatConfiguration);
        this.PY = assertType(PY, "number");
        this.validYear = assertType(validYear, "number");
    }

    static generateBoatClassId(className, validYear) {
        return generateId("BoatClass", [className, validYear]);
    }

    static getId(boatClass) {
        assertType(boatClass, BoatClass);
        return BoatClass.generateBoatClassId(boatClass.className, boatClass.validYear);
    }

    static getIdFromClassRaceDate(className, raceDate) {
        assertType(raceDate, Date);
        return BoatClass.generateBoatClassId(className, BoatClass.getClassYearForRaceDate(raceDate));
    }

    static sheetHeaders() {
        return [
            "Class",
            "Crew",
            "Rig",
            "Spinnaker",
            "PY",
            "Valid Year",
            ...StoreObject.sheetHeaders()
        ];
    }

    static fromStore(storeClass) {
        let {
            "Class": className,
            "Crew": crew,
            "Rig": rig,
            "Spinnaker": spinnaker,
            "PY": PY,
            "Valid Year": validYear,
        } = storeClass;

        let boatConfiguration = new BoatConfiguration(parseIntOrUndefined(crew), rig, spinnaker && spinnaker.trim());
        return new BoatClass(className, boatConfiguration, parseInt(PY), parseInt(validYear), StoreObject.fromStore(storeClass));
    }

    static getClassYearForRaceDate(date) {
        const raceDate = date.getUTCDate();
        const raceYear = date.getUTCFullYear();
        const raceMonth = date.getUTCMonth()
        if (raceMonth < CHANGEOVER_MONTH) {
            return raceYear - 1;
        }
        if (raceMonth === CHANGEOVER_MONTH && raceDate < CHANGEOVER_DATE) {
            return raceYear - 1;
        }
        return raceYear;
    }

    static getClassYear(boatClass) {
        assertType(boatClass, BoatClass);
        return boatClass.validYear;
    }

    getClassName() {
        return this.className;
    }

    getPY() {
        return this.PY;
    }

    filterForRace(race) {
        assertType(race, Race);
        return this.validYear === BoatClass.getClassYearForRaceDate(race.getDate());
    }

    toStore() {
        return {
            "Class": this.className,
            "Crew": this.boatConfiguration.crew,
            "Rig": this.boatConfiguration.rig,
            "Spinnaker": this.boatConfiguration.spinnaker,
            "PY": this.PY,
            "Valid Year": this.validYear,
            ...super.toStore(this),
        };
    }
}

import StoreObject from "./StoreObject.js";
import { assertType, generateId, assert, parseIntOrUndefined } from "../../common.js";

// Changeover date is 29th March (at least for 2020)
// Might need to modify this each year (or pull from database)
const CHANGEOVER_MONTH = 2; // March
const CHANGEOVER_DATE = 29;

/**
 * NOTE: RYA have in previous years published their PY class handicap list
 *  with multiple configurations with the same "Class Name"
 *  eg. MIRROR 2015 includes a "2/S/C" and "1/S/-" configuration
 *  and CANOE INTERNATIONAL 2015 includes a "1/S/A" and "1/S/0" configuration
 *  however they have since split them out into two separate class names
 *  ie. MIRROR S/H and MIRROR D/H 
 *  so for previous years the RYA class names have been modified to avoid conflicts
 *  and classes will not be keyed off the configuration
 */
class BoatConfiguration {
    constructor(crew, rig, spinnaker) {
        assert(!rig || ["S", "U"].includes(rig), `${rig} is not a valid rig for boat class`);
        assert(!spinnaker || ["0", "A", "-", "C"].includes(spinnaker), `${spinnaker} is not a valid spinnaker for boat class`);

        this.crew = crew && assertType(crew, "number");
        this.rig = rig;
        this.spinnaker = spinnaker;
    }
}

export default class BoatClass extends StoreObject {
    constructor(className, boatConfiguration, PY, validYear, metaData) {
        super(metaData)
        this.className = assertType(className, "string");
        this.boatConfiguration = assertType(boatConfiguration, BoatConfiguration);
        this.PY = assertType(PY, "number");
        this.validYear = assertType(validYear, "number");
    }

    static generateBoatClassId(className, validYear) {
        return generateId(BoatClass, [className, validYear]);
    }

    static getId(boatClass) {
        assertType(boatClass, BoatClass);
        return BoatClass.generateBoatClassId(boatClass.className, boatClass.validYear);
    }

    static getIdFromClassRaceDate(className, raceDate) {
        assertType(raceDate, Date);
        return BoatClass.generateBoatClassId(className, BoatClass.getClassYearForRaceDate(raceDate));
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

    getClassName() {
        return this.className;
    }

    getPY() {
        return this.PY;
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

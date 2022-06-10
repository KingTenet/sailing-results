import StoreObject from "./StoreObject.js";
import { assertType, generateId, parseIntOrUndefined, AutoMap, parseURLDate, parseBoolean } from "../../common.js";
import BoatConfiguration from "./BoatConfiguration.js";
import Race from "./Race.js";

export default class BoatClass extends StoreObject {
    constructor(className, boatConfiguration, PY, validFrom, deprecated, metaData) {
        super(metaData)
        this.className = assertType(className, "string");
        this.boatConfiguration = assertType(boatConfiguration, BoatConfiguration);
        this.PY = assertType(PY, "number");
        this.validFrom = (validFrom && assertType(validFrom, Date)) || new Date(0);
        this.deprecated = assertType(deprecated, "boolean");
    }

    static generateBoatClassId(className, validFrom) {
        return generateId("BoatClass", [className, validFrom]);
    }

    static getId(boatClass) {
        assertType(boatClass, BoatClass);
        return BoatClass.generateBoatClassId(boatClass.className, boatClass.validFrom);
    }

    static sheetHeaders() {
        return [
            "Class",
            "Crew",
            "Rig",
            "Spinnaker",
            "PY",
            "Valid From",
            "Deprecated",
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
            "Valid From": validFrom,
            "Deprecated": deprecated,
        } = storeClass;

        let boatConfiguration = new BoatConfiguration(parseIntOrUndefined(crew), rig, spinnaker && spinnaker.trim());
        return new BoatClass(className, boatConfiguration, parseInt(PY), parseURLDate(validFrom), parseBoolean(deprecated), StoreObject.fromStore(storeClass));
    }

    static getClassName(boatClass) {
        assertType(boatClass, BoatClass);
        return boatClass.getClassName();
    }

    getClassName() {
        return this.className;
    }

    getPY() {
        return this.PY;
    }

    sortByValidFromAsc(secondBoatClass) {
        assertType(secondBoatClass, BoatClass);
        if (secondBoatClass.validFrom.getTime() === this.validFrom.getTime()) {
            return 0;
        }
        return this.isAfter(secondBoatClass.validFrom)
            ? 1
            : -1;
    }

    isAfter(date) {
        assertType(date, Date);
        return this.validFrom.getTime() > date.getTime();
    }

    isValidAtRace(race) {
        assertType(race, Race);
        return !this.isAfter(race.getDate());
    }

    static getLatestValidClassAtRace(allClasses, race) {
        return allClasses
            .filter((boatClass) => boatClass.isValidAtRace(race))
            .sort((classA, classB) => classA.sortByValidFromAsc(classB))
            .at(-1)
    }

    static getBoatClassesForRace(race, ryaClasses = [], clubClasses = [], excludeDeprecated) {
        const allClasses = new AutoMap(BoatClass.getClassName);
        const validRYA = ryaClasses
            .map((classes) => BoatClass.getLatestValidClassAtRace(classes, race));

        const validClub = clubClasses
            .map((classes) => BoatClass.getLatestValidClassAtRace(classes, race));

        // Club classes will take precedent over rya classes with same className
        [...validRYA, ...validClub]
            .filter((boatClass) => boatClass && (!excludeDeprecated || !boatClass.deprecated))
            .forEach((boatClass) => allClasses.upsert(
                boatClass,
                (prev, next) => prev && prev.isAfter(next.validFrom) ? prev : next
            ));

        return allClasses;
    }

    toStore() {
        return {
            "Class": this.className,
            "Crew": this.boatConfiguration.crew,
            "Rig": this.boatConfiguration.rig,
            "Spinnaker": this.boatConfiguration.spinnaker,
            "PY": this.PY,
            "Valid From": this.validFrom,
            "Deprecated": this.deprecated,
            ...super.toStore(this),
        };
    }
}

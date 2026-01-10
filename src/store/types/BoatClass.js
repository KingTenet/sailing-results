import StoreObject from "./StoreObject.js";
import {
    assertType,
    generateId,
    parseIntOrUndefined,
    AutoMap,
    parseURLDate,
    parseBoolean,
    getURLDate,
} from "../../common.js";
import BoatConfiguration from "./BoatConfiguration.js";
import Race from "./Race.js";

const LASER_CLASSNAMES = [
    "LASER",
    "LASER RADIAL",
    "LASER 4.7 (ADULT)",
    "LASER 4.7",
];
const SOLO_CLASSNAMES = ["SOLO"];

export default class BoatClass extends StoreObject {
    constructor(
        className,
        boatConfiguration,
        PY,
        validFrom,
        deprecated,
        metaData,
    ) {
        super(metaData);
        this.className = assertType(className, "string");
        this.boatConfiguration = assertType(
            boatConfiguration,
            BoatConfiguration,
        );
        this.PY = assertType(PY, "number");
        this.validFrom = assertType(validFrom, Date);
        this.deprecated = assertType(deprecated, "boolean");
    }

    static generateBoatClassId(className, validFrom) {
        return generateId("BoatClass", [className, getURLDate(validFrom)]);
    }

    static getId(boatClass) {
        assertType(boatClass, BoatClass);
        return BoatClass.generateBoatClassId(
            boatClass.className,
            boatClass.validFrom,
        );
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
            ...StoreObject.sheetHeaders(),
        ];
    }

    static fromStore(storeClass) {
        let {
            Class: className,
            Crew: crew,
            Rig: rig,
            Spinnaker: spinnaker,
            PY: PY,
            "Valid From": validFrom,
            Deprecated: deprecated,
        } = storeClass;

        let boatConfiguration = new BoatConfiguration(
            parseIntOrUndefined(crew),
            rig,
            spinnaker && spinnaker.trim(),
        );
        return new BoatClass(
            className,
            boatConfiguration,
            parseInt(PY),
            parseURLDate(validFrom),
            parseBoolean(deprecated),
            StoreObject.fromStore(storeClass),
        );
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
        return this.isClassValidAfterRace(secondBoatClass.validFrom) ? 1 : -1;
    }

    isClassValidAfterRace(date) {
        assertType(date, Date);
        return this.validFrom.getTime() > date.getTime();
    }

    isValidAtRace(race) {
        assertType(race, Race);
        return !this.isClassValidAfterRace(race.getDate());
    }

    static getLatestValidClassAtRace(allClasses, race) {
        // Get the latest boatClass that's valid before the race
        return allClasses
            .filter((boatClass) => boatClass.isValidAtRace(race))
            .sort((classA, classB) => classA.sortByValidFromAsc(classB))
            .at(-1);
    }

    isLaser() {
        return LASER_CLASSNAMES.some(
            (className) =>
                className.toLowerCase() === this.className.toLowerCase(),
        );
    }

    isSolo() {
        return SOLO_CLASSNAMES.some(
            (className) =>
                className.toLowerCase() === this.className.toLowerCase(),
        );
    }

    isDoubleHander() {
        return this.boatConfiguration.crew > 1;
    }

    static getBoatClassesForRace(
        race,
        ryaClasses = [],
        clubClasses = [],
        excludeDeprecated,
    ) {
        /**
         * 
        ryaClasses = [
            [
                {className: "LASER", validFrom: "2019-03-01", "deprecated": false, PY: r1}, 
                {className: "LASER", validFrom: "2020-03-01", "deprecated": false, PY: r2}, 
                {className: "LASER", validFrom: "2021-03-01", "deprecated": false, PY: r3}, 
                {className: "LASER", validFrom: "2022-03-01", "deprecated": false, PY: r4}, 
            ]
        ]
        
        clubClasses = [
            [
                {className: "LASER", validFrom: "2019-03-01", "deprecated": false, PY: c1}, 
                {className: "LASER", validFrom: "2020-03-01", "deprecated": false, PY: c2}, 
                {className: "LASER", validFrom: "2021-03-01", "deprecated": true,  PY: c3}, 
                {className: "LASER", validFrom: "2022-03-01", "deprecated": false, PY: c4}, 
                
            ]
        ]
        
        For race === 2021-03-01,
            with excludeDeprecated===false,
                -> Map(
                    "LASER": {className: "LASER", validFrom: "2021-06-01", "deprecated": true, PY: c3}
                )
        
            with excludeDeprecated===true,
                -> Map(
                    "LASER": {className: "LASER", validFrom: "2021-06-01", "deprecated": false, PY: r3}
            )        
        */

        const allClasses = new AutoMap(BoatClass.getClassName);
        const validRYA = ryaClasses.map((classes) =>
            BoatClass.getLatestValidClassAtRace(classes, race),
        );

        const validClub = clubClasses.map((classes) =>
            BoatClass.getLatestValidClassAtRace(classes, race),
        );

        // Club classes will take precedent over rya classes with same className
        [...validRYA, ...validClub]
            .filter(
                (boatClass) =>
                    boatClass && (!excludeDeprecated || !boatClass.deprecated),
            )
            .forEach((boatClass) =>
                allClasses.upsert(boatClass, (prev, next) =>
                    prev && prev.isClassValidAfterRace(next.validFrom)
                        ? prev
                        : next,
                ),
            );

        return allClasses;
    }

    toStore() {
        return {
            Class: this.className,
            Crew: this.boatConfiguration.crew,
            Rig: this.boatConfiguration.rig,
            Spinnaker: this.boatConfiguration.spinnaker,
            PY: this.PY,
            "Valid From": getURLDate(this.validFrom),
            Deprecated: this.deprecated,
            ...super.toStore(this),
        };
    }
}

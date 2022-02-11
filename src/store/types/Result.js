import { assertType, getURLDate, parseURLDate, generateId, assert, parseIntOrUndefined } from "../../common.js";
import StoreObject from "./StoreObject.js";
import Helm from "./Helm.js";
import Race from "./Race.js";
import BoatClass from "./BoatClass.js";
import FinishCode from "./FinishCode.js";
import { calculateClassCorrectedTime } from "../../../scripts/classHandicapHelpers.js";

export default class Result extends StoreObject {
    constructor(race, helm, boatClass, boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode, metadata) {
        super(metadata);
        this.race = assertType(race, Race);
        this.helm = assertType(helm, Helm);
        this.boatClass = assertType(boatClass, BoatClass);
        this.boatSailNumber = assertType(boatSailNumber, "number");
        this.laps = laps && assertType(laps, "number");
        this.pursuitFinishPosition = pursuitFinishPosition && assertType(pursuitFinishPosition, "number");
        this.finishTime = finishTime && assertType(finishTime, "number");
        this.finishCode = assertType(finishCode, FinishCode);
        if (this.finishCode.validFinish()) {
            assert((this.laps && this.finishTime) || this.pursuitFinishPosition, `Invalid race result for race ${JSON.stringify(this, null, 4)}`);
        }
        else {
            assert(!this.laps && !this.finishTime && !this.pursuitFinishPosition, `Invalid race result for race ${JSON.stringify(this, null, 4)}`);
        }
    }

    static getId(result) {
        assertType(result, Result);
        return generateId(Result, [Helm.getId(result.helm), Race.getId(result.race)]);
    }

    static getRaceId(result) {
        assertType(result, Result);
        return Race.getId(result.race);
    }

    static getHelmId(result) {
        assertType(result, Result);
        return Helm.getId(result.helm);
    }

    static getBoatClassId(result) {
        assertType(result, Result);
        return BoatClass.getId(result.boatClass);
    }

    static getLaps(result) {
        assertType(result, Result);
        return result.getLaps();
    }

    static sortByRaceAsc(firstResult, secondResult) {
        assertType(firstResult, Result);
        assertType(secondResult, Result);
        return firstResult.getRace().sortByRaceAsc(secondResult.getRace())
    }

    static sheetHeaders() {
        return [
            "Date",
            "Race Number",
            "Helm",
            "Sail Number",
            "Class",
            "Laps",
            "Pursuit Finish Position",
            "Finish Time",
            "Finish Code",
            ...StoreObject.sheetHeaders(),
        ];
    }

    static fromStore(storeResult, getHelm, getBoatClassForDate) {
        let {
            "Date": dateString,
            "Race Number": raceNumber,
            "Helm": helmId,
            "Sail Number": boatSailNumber,
            "Class": boatClassName,
            "Laps": laps,
            "Pursuit Finish Position": pursuitFinishPosition,
            "Finish Time": finishTime,
            "Finish Code": finishCodeString,
        } = storeResult;
        const race = new Race(parseURLDate(dateString), parseInt(raceNumber));
        const finishCode = new FinishCode(finishCodeString);
        return new Result(race, getHelm(helmId), getBoatClassForDate(boatClassName, race.getDate()), parseInt(boatSailNumber), parseIntOrUndefined(laps), parseIntOrUndefined(pursuitFinishPosition), parseIntOrUndefined(finishTime), finishCode, StoreObject.fromStore(storeResult));
    }

    getClassCorrectedTime(raceMaxLaps) {
        let boatClass = this.getBoatClass();
        if (!this.finishCode.validFinish()) {
            throw new Error("Cannot calculate a class corrected time for a non-finisher");
        }

        return calculateClassCorrectedTime(boatClass.getPY(), this.getFinishTime(), this.getLaps(), raceMaxLaps);
    }

    sortByCorrectedFinishTimeDesc(secondResult, maxLaps) {
        assertType(secondResult, Result);
        return secondResult.getClassCorrectedTime(maxLaps) - this.getClassCorrectedTime(maxLaps);
    }

    getCorrectedTimes(totalPersonalHandicap, raceMaxLaps) {
        const classCorrectedTime = this.getClassCorrectedTime(raceMaxLaps);
        const personalCorrectedTime = calculateClassCorrectedTime(totalPersonalHandicap, this.getFinishTime(), this.getLaps(), raceMaxLaps);
        return [personalCorrectedTime, classCorrectedTime];
    }

    getPursuitFinishPosition() {
        return this.pursuitFinishPosition;
    }

    getBoatClass() {
        return this.boatClass;
    }

    getFinishTime() {
        return this.finishTime;
    }

    getLaps() {
        return this.laps;
    }

    getRace() {
        return this.race;
    }

    getHelm() {
        return this.helm;
    }

    toStore() {
        return {
            "Date": getURLDate(this.race.getDate()),
            "Race Number": this.race.getNumber(),
            "Helm": Helm.getId(this.helm),
            "Sail Number": this.boatSailNumber,
            "Class": this.boatClass.getClassName(),
            "Laps": this.laps,
            "Pursuit Finish Position": this.pursuitFinishPosition,
            "Finish Time": this.finishTime,
            "Finish Code": this.finishCode.getCode(),
            ...super.toStore(this),
        };
    }
}

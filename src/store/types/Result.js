import { assertType, getURLDate, parseURLDate, generateId, assert, parseIntOrUndefined } from "../../common.js";
import StoreObject from "./StoreObject.js";
import Helm from "./Helm.js";
import Race from "./Race.js";
import BoatClass from "./BoatClass.js";
import FinishCode from "./FinishCode.js";
import { calculateClassCorrectedTime } from "../../common/classHandicapHelpers.js";
import HelmResult from "./HelmResult.js";
import MutableRaceResult from "./MutableRaceResult.js";

export default class Result extends HelmResult {
    constructor(race, helm, boatClass, boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode, metadata) {
        super(race, helm, metadata);
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

    static getBoatClassName(result) {
        assertType(result, Result);
        return result.getBoatClass().getClassName();
    }

    static getBoatClassId(result) {
        assertType(result, Result);
        return BoatClass.getId(result.boatClass);
    }

    static getLaps(result) {
        assertType(result, Result);
        return result.getLaps();
    }

    static sheetHeaders() {
        return [
            "Sail Number",
            "Class",
            "Laps",
            "Pursuit Finish Position",
            "Finish Time",
            "Finish Code",
            ...HelmResult.sheetHeaders(),
        ];
    }

    static fromStore(storeResult, getHelm, getBoatClassForRace) {
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
        return new Result(race, getHelm(helmId), getBoatClassForRace(boatClassName, race), parseInt(boatSailNumber), parseIntOrUndefined(laps), parseIntOrUndefined(pursuitFinishPosition), parseIntOrUndefined(finishTime), finishCode, StoreObject.fromStore(storeResult));
    }

    static fromUser(race, helm, boatClass, boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode = new FinishCode("")) {
        return new Result(race, helm, boatClass, boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode, StoreObject.fromStore({}));
    }

    static fromMutableRaceResult(mutableResult, laps, pursuitFinishPosition, finishTime, finishCode = new FinishCode("")) {
        assertType(mutableResult, MutableRaceResult);
        return new Result(mutableResult.getRace(), mutableResult.getHelm(), mutableResult.getBoatClass(), mutableResult.boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode, StoreObject.fromStore({}));
    }

    static fromRegistered(helmResult, pursuitFinishPosition) {
        assertType(helmResult, HelmResult);
        const mutableResult = MutableRaceResult.fromUser(helmResult.getRace(), helmResult.getHelm(), helmResult.getBoatClass(), helmResult.getSailNumber());
        if (!pursuitFinishPosition) {
            return Result.fromMutableRaceResult(mutableResult, undefined, undefined, undefined, new FinishCode("DNF"));
        }
        return Result.fromMutableRaceResult(mutableResult, undefined, pursuitFinishPosition, undefined);
    }

    getClassCorrectedTime(raceMaxLaps) {
        let boatClass = this.getBoatClass();
        if (!this.finishCode.validFinish()) {
            throw new Error("Cannot calculate a class corrected time for a non-finisher");
        }

        return calculateClassCorrectedTime(boatClass.getPY(), this.getFinishTime(), this.getLaps(), raceMaxLaps);
    }

    sortByFinishTimeDesc(secondResult) {
        assertType(secondResult, Result);
        return secondResult.getFinishTime() - this.getFinishTime();
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

    getSailNumber() {
        return this.boatSailNumber;
    }

    getLaps() {
        return this.laps;
    }

    isValidFinish() {
        return this.finishCode.validFinish();
    }

    toStore() {
        return {
            // "Date": getURLDate(this.race.getDate()),
            // "Race Number": this.race.getNumber(),
            // "Helm": Helm.getId(this.helm),
            "Sail Number": this.boatSailNumber,
            "Class": this.boatClass.getClassName(),
            "Laps": this.laps,
            "Pursuit Finish Position": this.pursuitFinishPosition,
            "Finish Time": this.finishTime,
            "Finish Code": this.finishCode.getCode(),
            ...super.toStore(this),
        };
    }

    toJSON() {
        return this.toStore();
    }
}

import { assertType, getURLDate, parseURLDate, generateId, assert, parseIntOrUndefined } from "../../common.js";
import StoreObject from "./StoreObject.js";
import Helm from "./Helm.js";
import Race from "./Race.js";
import BoatClass from "./BoatClass.js";


class FinishCode {
    constructor(code) {
        assert(!code || ["DNF", "DNS", "OCS"].includes(code), `${code} is an invalid finish code`);
        this.code = code || undefined;
    }

    getCode() {
        return this.code;
    }

    validFinish() {
        return !this.code;
    }
}

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

    static getBoatClassId(result) {
        assertType(result, Result);
        return BoatClass.getId(result.boatClass);
    }

    static getLaps(result) {
        assertType(result, Result);
        return result.getLaps();
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

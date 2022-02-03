import { assertType, getURLDate, parseURLDate, generateId } from "../common.js";
import StoreObject from "./StoreObject.js";
import Helm from "./Helm.js";
import Race from "./Race.js";

export default class Result extends StoreObject {
    constructor(race, helm, boatClassName, boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode, metadata) {
        super(metadata);
        this.race = assertType(race, Race);
        this.helm = assertType(helm, Helm);
        this.boatClassName = assertType(boatClassName, "string");
        this.boatSailNumber = assertType(boatSailNumber, "number");
        this.laps = laps && assertType(laps, "number");
        this.pursuitFinishPosition = pursuitFinishPosition && assertType(pursuitFinishPosition, "number");
        this.finishTime = finishTime && assertType(finishTime, "number");
        this.finishCode = assertType(finishCode, "string");
    }

    static getHelmIdFromStoredResult({ "Helm": helmId }) {
        if (!helmId) {
            throw new Error("Could not get helm Id from stored Result");
        }
        return helmId;
    }

    static getId(result) {
        assertType(result, Result);
        return generateId(Result, [Helm.getId(result.helm), Race.getId(result.race)]);
    }

    static fromStore(storeResult, getHelm) {
        let {
            "Date": dateString,
            "Race Number": raceNumber,
            "Sail Number": boatSailNumber,
            "Class": boatClassName,
            "Laps": laps,
            "Pursuit Finish Position": pursuitFinishPosition,
            "Finish Time": finishTime,
            "Finish Code": finishCode,
        } = storeResult;
        const helm = getHelm(Result.getHelmIdFromStoredResult(storeResult));
        const race = new Race(parseURLDate(dateString), parseInt(raceNumber));
        return new Result(race, helm, boatClassName, parseInt(boatSailNumber), parseInt(laps), parseInt(pursuitFinishPosition), parseInt(finishTime), finishCode, StoreObject.fromStore(storeResult));
    }

    toStore() {
        return {
            "Date": getURLDate(this.race.getDate()),
            "Race Number": this.race.getNumber(),
            "Helm": Helm.getId(this.helm),
            "Sail Number": this.boatSailNumber,
            "Class": this.boatClassName,
            "Laps": this.laps,
            "Pursuit Finish Position": this.pursuitFinishPosition,
            "Finish Time": this.finishTime,
            "Finish Code": this.finishCode,
            ...super.toStore(this),
        };
    }
}
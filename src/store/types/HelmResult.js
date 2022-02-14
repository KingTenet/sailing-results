import { assertType, getURLDate, parseURLDate, generateId } from "../../common.js";
import StoreObject from "./StoreObject.js";
import Helm from "./Helm.js";
import Race from "./Race.js";
// import Result from "./Result.js";

export default class HelmResult extends StoreObject {
    constructor(race, helm, metadata) {
        super(metadata);
        this.race = assertType(race, Race);
        this.helm = assertType(helm, Helm);
    }

    static getId(result) {
        assertType(result, HelmResult);
        return generateId(HelmResult, [Helm.getId(result.helm), Race.getId(result.race)]);
    }

    static getRaceId(result) {
        assertType(result, HelmResult);
        return Race.getId(result.race);
    }

    static getHelmId(result) {
        assertType(result, HelmResult);
        return Helm.getId(result.helm);
    }


    // static getBoatClassId(result) {
    //     assertType(result, Result);
    //     return BoatClass.getId(result.boatClass);
    // }

    // static getLaps(result) {
    //     assertType(result, Result);
    //     return result.getLaps();
    // }

    // static sortByRaceAsc(firstResult, secondResult) {
    //     assertType(firstResult, Result);
    //     assertType(secondResult, Result);
    //     return firstResult.getRace().sortByRaceAsc(secondResult.getRace())
    // }


    static sheetHeaders() {
        return [
            "Date",
            "Race Number",
            "Helm",
            ...StoreObject.sheetHeaders(),
        ];
    }

    static fromStore(storeResult, getHelm) {
        let {
            "Date": dateString,
            "Race Number": raceNumber,
            "Helm": helmId,
        } = storeResult;
        const race = new Race(parseURLDate(dateString), parseInt(raceNumber));
        return new HelmResult(race, getHelm(helmId), StoreObject.fromStore(storeResult));
    }

    static fromHelmRace(helm, race) {
        return new HelmResult(race, helm, StoreObject.fromStore({}));
    }

    // getClassCorrectedTime(raceMaxLaps) {
    //     let boatClass = this.getBoatClass();
    //     if (!this.finishCode.validFinish()) {
    //         throw new Error("Cannot calculate a class corrected time for a non-finisher");
    //     }

    //     return calculateClassCorrectedTime(boatClass.getPY(), this.getFinishTime(), this.getLaps(), raceMaxLaps);
    // }

    // sortByCorrectedFinishTimeDesc(secondResult, maxLaps) {
    //     assertType(secondResult, Result);
    //     return secondResult.getClassCorrectedTime(maxLaps) - this.getClassCorrectedTime(maxLaps);
    // }

    // getCorrectedTimes(totalPersonalHandicap, raceMaxLaps) {
    //     const classCorrectedTime = this.getClassCorrectedTime(raceMaxLaps);
    //     const personalCorrectedTime = calculateClassCorrectedTime(totalPersonalHandicap, this.getFinishTime(), this.getLaps(), raceMaxLaps);
    //     return [personalCorrectedTime, classCorrectedTime];
    // }

    // getPursuitFinishPosition() {
    //     return this.pursuitFinishPosition;
    // }

    // getBoatClass() {
    //     return this.boatClass;
    // }

    // getFinishTime() {
    //     return this.finishTime;
    // }

    // getLaps() {
    //     return this.laps;
    // }

    getRace() {
        return this.race;
    }

    getHelm() {
        return this.helm;
    }

    // isValidFinish() {
    //     return this.finishCode.validFinish();
    // }

    toStore() {
        return {
            "Date": getURLDate(this.race.getDate()),
            "Race Number": this.race.getNumber(),
            "Helm": Helm.getId(this.helm),
            ...super.toStore(this),
        };
    }


}

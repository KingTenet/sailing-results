import { assertType, generateId, parseBoolean } from "../../common.js";
import Helm from "./Helm.js";
import Race from "./Race.js";
import Result from "./Result.js";
import StoreObject from "./StoreObject.js";
import { getRollingHandicaps, calculatePersonalInterval, calculatePersonalHandicapFromPI } from "../../../scripts/personalHandicapHelpers.js";

const debug = global;

export default class CorrectedResult extends Result {
    constructor(result, previousResults, raceFinish) {

        assertType(result, Result);
        previousResults.forEach((result) => assertType(result, CorrectedResult));
        super(result.race, result.helm, result.boatClass, result.boatSailNumber, result.laps, result.pursuitFinishPosition, result.finishTime, result.finishCode, new StoreObject(result));
        const validFinish = result.finishCode.validFinish();

        this.raceFinish = raceFinish;
        this.previousResults = previousResults;

        const [rollingPH, rollingPI] = getRollingHandicaps(this.previousResults, this);
        // console.log(this.helm.name, this.boatClass.getClassName(), rollingPH, rollingPI);
        const [personalCorrectedTime, classCorrectedTime] = validFinish ? this.getCorrectedTimes(rollingPH, this.raceFinish.getMaxLaps()) : [];

        this.classCorrectedTime = Math.round(classCorrectedTime);
        this.personalCorrectedTime = Math.round(personalCorrectedTime);
        this.rollingPersonalHandicapBeforeRace = Math.round(rollingPH);
        this.rollingOverallPIBeforeRace = rollingPI;
        const [rollingPHAfter, rollingPIAfter] = getRollingHandicaps([...this.previousResults, this], this);
        // console.log("  ", this.helm.name, this.boatClass.getClassName(), rollingPHAfter, rollingPIAfter);

        this.rollingPersonalHandicapAfterRace = rollingPHAfter;
        this.rollingOverallPIAfterRace = rollingPIAfter;

        this.gender = this.helm.getGender();
        this.novice = this.helm.wasNoviceInRace(this.previousResults, this.raceFinish);
        this.cadet = this.helm.wasCadetInRace(this.raceFinish);
        this.junior = this.helm.wasJuniorInRace(this.raceFinish);
        this.validFinish = validFinish;

        this.raceMaxLaps = this.raceFinish.getMaxLaps();
    }

    // static getId(result) {
    //     assertType(result, CorrectedResult);
    //     return generateId(CorrectedResult, [Helm.getId(result.helm), Race.getId(result.race)]);
    // }

    static fromResult(result, helmResultsByRaceAsc, raceFinish) {
        assertType(result, Result);
        const previousResults = helmResultsByRaceAsc
            .filter((result) => result.getRace().isBefore(raceFinish));

        return new CorrectedResult(
            result,
            previousResults,
            raceFinish,
        );
    }

    static sheetHeaders() {
        return [
            "Gender",
            "Novice",
            "Cadet",
            "Junior",
            "Club Boat",
            "Crew",
            "Rig",
            "Spinnaker",
            "Class Corrected Finish Time",
            "Personal Corrected Finish Time",
            "PY",
            "Corrected Laps",
            "PH From Race",
            "NHEBSC PH (Single Class) Before Race",
            "NHEBSC PI (All Classes) Before Race",
            "NHEBSC PH (Single Class) After Race",
            "NHEBSC PI (All Classes) After Race",
            "Class Position",
            "PH Position",
            ...Result.sheetHeaders(),
        ];
    }

    toStore() {
        return {
            "Gender": this.helm.getGender(),
            "Novice": this.helm.wasNoviceInRace(this.previousResults, this.raceFinish),
            "Cadet": this.helm.wasCadetInRace(this.raceFinish),
            "Junior": this.helm.wasJuniorInRace(this.raceFinish),
            "Club Boat": "",
            "Crew": "",
            "Rig": "",
            "Spinnaker": "",
            "Class Corrected Finish Time": this.classCorrectedTime,
            "Personal Corrected Finish Time": this.personalCorrectedTime,
            "PY": this.getBoatClass().getPY(),
            "Corrected Laps": this.raceMaxLaps,
            "PH From Race": this.getPersonalHandicapFromRace(),
            "NHEBSC PH (Single Class) Before Race": this.rollingPersonalHandicapBeforeRace,
            "NHEBSC PI (All Classes) Before Race": this.rollingOverallPIBeforeRace,
            "NHEBSC PH (Single Class) After Race": this.rollingPersonalHandicapAfterRace,
            "NHEBSC PI (All Classes) After Race": this.rollingOverallPIAfterRace,
            "Class Position": this.classCorrectedPosition,
            "PH Position": this.personalCorrectedPosition,
            ...super.toStore(this),
        };
    }

    getRollingPersonalHandicapBeforeRace() {
        return this.rollingPersonalHandicapBeforeRace;
    }

    getPersonalInterval(raceMaxLaps, standardCorrectedTime) {
        return calculatePersonalInterval(this.getClassCorrectedTime(raceMaxLaps), standardCorrectedTime);
    }

    getPersonalHandicapFromRace() {
        if (!this.finishCode.validFinish()) {
            return;
        }
        const PI = this.getPersonalInterval(this.raceFinish.getMaxLaps(), this.raceFinish.getSCT()); // % diff on class SCT
        return Math.round(calculatePersonalHandicapFromPI(this.getBoatClass().getPY(), PI))
    }

    getPersonalCorrectedFinishTime() {
        return this.personalCorrectedTime;
    }

    getRollingHandicapsAtRace(race) {
        return getRollingHandicaps(this.previousResults.filter((result) => result.getRace().isBefore(race)), this);
    }

    /**
     * Used to calculate corrected time using PH at series start 
     */
    getPersonalCorrectedFinishTimeUsingPHDate(race) {
        if (!race) {
            return this.getPersonalCorrectedFinishTime();
        }
        const [rollingPH, rollingPI] = this.getRollingHandicapsAtRace(race);
        // debugger;
        // if (!debug.ph) {
        //     debug.ph = new Map();
        // }
        // debug.ph.set(`${Helm.getId(this.getHelm())}: ${this.getBoatClass().getClassName()}`, rollingPH - this.getBoatClass().getPY());

        // if (Helm.getId(this.getHelm()).includes("Andy Everitt")) {
        //     debugger;
        // }

        // console.log([...debug.ph]);
        //console.log(`${Helm.getId(this.getHelm())}: ${this.getBoatClass().getClassName()}: ${rollingPH}`);
        const [personalCorrectedTime] = this.getCorrectedTimes(rollingPH, this.raceFinish.getMaxLaps());
        return Math.round(personalCorrectedTime);
    }

    getClassCorrectedFinishTime() {
        return this.classCorrectedTime;
    }

    isValidFinish() {
        return this.validFinish;
    }

    sortByCorrectedFinishTimeDesc(secondResult) {
        assertType(secondResult, CorrectedResult);
        return secondResult.getClassCorrectedFinishTime() - this.getClassCorrectedFinishTime();
    }

    sortByPersonalCorrectedFinishTimeDesc(secondResult) {
        assertType(secondResult, CorrectedResult);
        return secondResult.getPersonalCorrectedFinishTime() - this.getPersonalCorrectedFinishTime();
    }

    setClassCorrectedPosition(position) {
        this.classCorrectedPosition = position;
    }

    setPersonalCorrectedPosition(position) {
        this.personalCorrectedPosition = position;
    }
}

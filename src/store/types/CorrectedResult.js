import { assertType } from "../../common.js";
import Result from "./Result.js";
import StoreObject from "./StoreObject.js";
import { getRollingHandicaps, calculatePersonalInterval, calculatePersonalHandicapFromPI } from "../../common/personalHandicapHelpers.js";
import Race from "./Race.js";

export default class CorrectedResult extends Result {
    constructor(result, previousResults, raceFinish) {

        assertType(result, Result);
        previousResults.forEach((result) => assertType(result, CorrectedResult));
        super(result.race, result.helm, result.boatClass, result.boatSailNumber, result.laps, result.pursuitFinishPosition, result.finishTime, result.finishCode, new StoreObject(result));
        const validFinish = result.finishCode.validFinish();

        this.raceFinish = raceFinish;
        this.previousResults = previousResults;

        const [rollingPH, rollingPI] = getRollingHandicaps(this.previousResults, this);
        const [personalCorrectedTime, classCorrectedTime] = validFinish ? this.getCorrectedTimes(rollingPH, this.raceFinish.getMaxLaps()) : [];

        this.classCorrectedTime = Math.round(classCorrectedTime);
        this.personalCorrectedTime = Math.round(personalCorrectedTime);
        this.rollingPersonalHandicapBeforeRace = Math.round(rollingPH);
        this.rollingOverallPIBeforeRace = rollingPI;
        const [rollingPHAfter, rollingPIAfter] = getRollingHandicaps([...this.previousResults, this], this);

        this.rollingPersonalHandicapAfterRace = rollingPHAfter;
        this.rollingOverallPIAfterRace = rollingPIAfter;

        this.gender = this.helm.getGender();
        this.novice = this.helm.wasNoviceInRace(this.previousResults, this.raceFinish);
        this.cadet = this.helm.wasCadetInRace(this.raceFinish);
        this.junior = this.helm.wasJuniorInRace(this.raceFinish);
        this.validFinish = validFinish;

        this.raceMaxLaps = this.raceFinish.getMaxLaps();
    }

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
            ...Result.sheetHeaders(),
        ];
    }

    static getRaceId(result) {
        assertType(result, CorrectedResult);
        return result.raceFinish;
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
            ...super.toStore(this),
        };
    }

    getRollingPersonalHandicapBeforeRace() {
        return this.rollingPersonalHandicapBeforeRace;
    }

    getPersonalInterval() {
        return calculatePersonalInterval(this.getClassCorrectedTime(), this.raceFinish.getSCT());
    }

    getClassCorrectedTime() {
        return super.getClassCorrectedTime(this.raceFinish.getMaxLaps());
    }

    getPersonalHandicapFromRace() {
        if (!this.finishCode.validFinish() || !this.raceFinish.getSCT()) {
            return;
        }
        const PI = this.getPersonalInterval(); // % diff on class SCT
        return Math.round(calculatePersonalHandicapFromPI(this.getBoatClass().getPY(), PI))
    }

    getPersonalCorrectedFinishTime() {
        return this.personalCorrectedTime;
    }

    getRollingHandicapsAtRace(race) {
        if (!race) {
            return getRollingHandicaps(this.previousResults, this);
        }
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
        const [personalCorrectedTime] = this.getCorrectedTimes(rollingPH, this.raceFinish.getMaxLaps());

        if (global.DEBUG) {
            if (!this.debug) {
                this.debug = {};
            }

            this.debug.personalHandicapUsed = rollingPH;
            this.debug.personalCorrectedTimeUsed = personalCorrectedTime;
            this.debug.totalRacesForHelm = this.previousResults.filter((result) => result.getRace().isBefore(race)).length;
            this.debug.totalRacesForHelmInClass = this.previousResults
                .filter((result) => result.getRace().isBefore(race))
                .filter((result) => result.getBoatClass().getClassName() === this.getBoatClass().getClassName()).length

            this.debug.classRollingHandicaps = this.previousResults
                .filter((result) => result.getRace().isBefore(race))
                .filter((result) => result.getBoatClass().getClassName() === this.getBoatClass().getClassName())
                .filter((result) => result.getPersonalHandicapFromRace())
                .slice(-10)
                .map((result) => [Race.getId(result.getRace()), result.getPersonalHandicapFromRace(), result.getBoatClass().getPY(), ...this.getRollingHandicapsAtRace(result.getRace())])

            this.debug.allRollingHandicaps = this.previousResults
                .filter((result) => result.getRace().isBefore(race))
                .filter((result) => result.getPersonalHandicapFromRace())
                .slice(-10)
                .map((result) => [Race.getId(result.getRace()), result.getPersonalHandicapFromRace(), result.getBoatClass().getPY(), ...this.getRollingHandicapsAtRace(result.getRace())])
        }

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

    toJSON() {
        if (!this.previousResults) {
            return this;
        }

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
            // "Debug": this.debug,
            ...super.toStore(this),
        };
    }
}

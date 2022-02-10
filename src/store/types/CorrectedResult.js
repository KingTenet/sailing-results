import { assertType, generateId, parseBoolean } from "../../common.js";
import Helm from "./Helm.js";
import Race from "./Race.js";
import Result from "./Result.js";
import StoreObject from "./StoreObject.js";
import { getRollingHandicaps, calculatePersonalInterval, calculatePersonalHandicapFromPI } from "../../../scripts/personalHandicapHelpers.js";

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

        this.raceMaxLaps = this.raceFinish.getMaxLaps();
    }

    static getId(result) {
        assertType(result, CorrectedResult);
        return generateId(CorrectedResult, [Helm.getId(result.helm), Race.getId(result.race)]);
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

    toStore() {
        const correctedToStore = {
            "Gender": this.helm.getGender(),
            "Novice": this.helm.wasNoviceInRace(this.previousResults, this.raceFinish),
            "Cadet": this.helm.wasCadetInRace(this.raceFinish),
            "Junior": this.helm.wasJuniorInRace(this.raceFinish),
            // "Club Boat": ,
            // "Crew": ,
            // "Rig": ,
            // "Spinnaker": spinnaker,
            "Class Corrected Finish Time": this.classCorrectedTime,
            "Personal Corrected Finish Time": this.personalCorrectedTime,
            "PY": this.PY,
            "Corrected Laps": this.raceMaxLaps,
            "PH From Race": this.totalPersonalHandicapFromRace,
            "NHEBSC PH (Single Class) Before Race": this.rollingPersonalHandicapBeforeRace,
            "NHEBSC PI (All Classes) Before Race": this.rollingOverallPIBeforeRace,
            "NHEBSC PH (Single Class) After Race": this.rollingPersonalHandicapAfterRace,
            "NHEBSC PI (All Classes) After Race": this.rollingOverallPIAfterRace,
            ...super.toStore(this),
        };
        // console.log(correctedToStore);
        return correctedToStore;
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

}

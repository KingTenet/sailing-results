import { assertType, generateId, parseBoolean } from "../../common.js";
import Helm from "./Helm.js";
import Race from "./Race.js";
import Result from "./Result.js";
import StoreObject from "./StoreObject.js";

export default class CorrectedResult extends Result {
    constructor(
        result,
        gender,
        novice,
        cadet,
        junior,
        PY,
        totalPersonalHandicapFromRace,
        classCorrectedTime,
        rollingPersonalHandicapBeforeRace,
        personalCorrectedTime,
        rollingOverallPIBefore,
        raceMaxLaps,
        metaData) {

        assertType(result, Result);
        super(result.race, result.helm, result.boatClass, result.boatSailNumber, result.laps, result.pursuitFinishPosition, result.finishTime, result.finishCode, new StoreObject(result));
        const validFinish = result.finishCode.validFinish();

        this.gender = assertType(gender, "string");
        this.novice = assertType(novice, "boolean");
        this.cadet = assertType(cadet, "boolean");
        this.junior = assertType(junior, "boolean");
        this.totalPersonalHandicapFromRace = validFinish ? assertType(totalPersonalHandicapFromRace, "number") : undefined;
        this.classCorrectedTime = validFinish ? assertType(classCorrectedTime, "number") : undefined;
        this.personalCorrectedTime = validFinish ? assertType(personalCorrectedTime, "number") : undefined;
        this.PY = assertType(PY, "number");

        this.rollingPersonalHandicapBeforeRace = assertType(rollingPersonalHandicapBeforeRace, "number");
        this.rollingOverallPIBefore = rollingOverallPIBefore;//assertType(, "number");
        // this.rollingClassPIAfter = assertType(rollingClassPIAfter, "number");
        // this.rollingOverallPIAfter = assertType(rollingOverallPIAfter, "number");

        this.raceMaxLaps = validFinish ? assertType(raceMaxLaps, "number") : undefined;
    }

    static getId(result) {
        assertType(result, CorrectedResult);
        return generateId(CorrectedResult, [Helm.getId(result.helm), Race.getId(result.race)]);
    }

    static fromResult(result, helmResultsByRaceAsc, standardCorrectedTime, raceMaxLaps) {
        assertType(result, Result);

        const helm = result.getHelm();
        const race = result.getRace();
        const gender = helm.getGender();
        const novice = helm.wasNoviceInRace(helmResultsByRaceAsc, race);
        const cadet = helm.wasCadetInRace(race);
        const junior = helm.wasJuniorInRace(race);
        const validFinish = result.finishCode.validFinish() || undefined;

        let debug;
        // if (helm.name === "Everitt Andy" && result.getBoatClass().className === "LASER") {
        //     debug = true;
        // }
        // if (Result.getId(result).includes("Result::Gill Matt::Race::2015-01-18T00:00:00.000Z::1")) {
        //     console.log(Result.getId(result))
        // }

        const personalInterval = validFinish ? result.getPersonalInterval(raceMaxLaps, standardCorrectedTime) : undefined; // % diff on class SCT
        const totalPersonalHandicapForClass = validFinish ? (100 + personalInterval) * result.getBoatClass().getPY() / 100 : undefined;

        const previousResults = helmResultsByRaceAsc
            .filter((result) => result.getRace().isBefore(race));


        debugger;
        const rollingPersonalHandicapBeforeRace = Math.round(helm.getRollingPersonalHandicapFromResults(previousResults, result.getBoatClass()));
        const rollingPIBeforeRace = Math.round(helm.getRollingPIFromResults(previousResults, result.getBoatClass()));
        const [personalCorrectedTime, classCorrectedTime] = validFinish ? result.getCorrectedTimes(rollingPersonalHandicapBeforeRace, raceMaxLaps) : [];

        try {
            return new CorrectedResult(
                result,
                gender,
                novice,
                cadet,
                junior,
                result.getBoatClass().getPY(),
                totalPersonalHandicapForClass && Math.round(totalPersonalHandicapForClass),
                classCorrectedTime && Math.round(classCorrectedTime),
                rollingPersonalHandicapBeforeRace,
                personalCorrectedTime && Math.round(personalCorrectedTime),
                rollingPIBeforeRace,
                raceMaxLaps,
            );
        }
        catch (err) {
            debugger;
        }

        // newResult.setPostRacePIs(helmResultsByRaceAsc);
        // return newResult;
    }

    // setPostRacePIs(helmResultsByRaceAsc) {
    //     const [rollingOverallPI, rollingClassPI] = this.getHelm().getRollingPersonalHandicapFromResults([...helmResultsByRaceAsc, this], this.getBoatClass());
    //     this.setPostRaceRollingClassPI(rollingClassPI);
    //     this.setPostRaceRollingOverallPI(rollingOverallPI);
    // }

    // setPostRaceRollingClassPI(rollingClassPI) {
    //     this.rollingClassPIAfter = rollingClassPI;
    // }

    // setPostRaceRollingOverallPI(rollingOverallPI) {
    //     this.rollingOverallPIAfter = rollingOverallPI;
    // }

    // getPI() {
    //     return this.personalInterval;
    // }

    // getPersonalHandicapFromRace() {
    //     return this.getPI();
    // }

    // getRollingOverallPIBeforeRace() {
    //     return this.rollingOverallPIBefore;
    // }

    getRollingPersonalHandicapBeforeRace() {
        return this.rollingPersonalHandicapBeforeRace;
    }

    getPersonalHandicapFromRace() {
        return this.totalPersonalHandicapFromRace;
    }

    toStore() {
        const correctedToStore = {
            "Gender": this.gender,
            "Novice": this.novice,
            "Cadet": this.cadet,
            "Junior": this.junior,
            // "Club Boat": ,
            // "Crew": ,
            // "Rig": ,
            // "Spinnaker": spinnaker,
            "Class Corrected Finish Time": this.classCorrectedTime,
            "Personal Corrected Finish Time": this.personalCorrectedTime,
            "PY": this.PY,
            "Corrected Laps": this.raceMaxLaps,
            "PH From Race": this.totalPersonalHandicapFromRace,
            "NHEBSC PI (Single Class) Before Race": this.rollingPersonalHandicapBeforeRace,
            "NHEBSC PI (All Classes) Before Race": this.rollingOverallPIBefore,
            // "NHEBSC PI (Single Class) After Race": this.rollingClassPIAfter,
            // "NHEBSC PI (All Classes) After Race": this.rollingOverallPIAfter,
            ...super.toStore(this),
        };
        // console.log(correctedToStore);
        return correctedToStore;
    }

    static fromStore(storeResult, result) {
        let {
            "Gender": gender,
            "Novice": novice,
            "Cadet": cadet,
            "Junior": junior,
            "Crew": crew,
            "Rig": rig,
            "Spinnaker": spinnaker,
            "PY": PY,
            "Club Boat": clubBoat,
            "Class Corrected Finish Time": correctedFinishTime,
            "Personal Corrected Finish Time": personalCorrectedTime,
            "Corrected Laps": raceMaxLaps,
            "PH From Race": totalPersonalHandicapFromRace,
            "NHEBSC PI (Single Class) Before Race": rollingClassPIBefore,
            // "NHEBSC PI (All Classes) Before Race": rollingOverallPIBefore,
            // "NHEBSC PI (Single Class) After Race": rollingClassPIAfter,
            // "NHEBSC PI (All Classes) After Race": rollingOverallPIAfter,
        } = storeResult;

        const correctedResult = new CorrectedResult(
            result,
            gender,
            parseBoolean(novice),
            parseBoolean(cadet),
            parseBoolean(junior),
            parseInt(PY),
            parseInt(totalPersonalHandicapFromRace),
            parseInt(correctedFinishTime),
            parseInt(rollingClassPIBefore),
            parseInt(personalCorrectedTime),
            undefined && parseInt(rollingOverallPIBefore),
            parseInt(raceMaxLaps),
        );
        // correctedResult.setPostRaceRollingClassPI(parseInt(rollingClassPIAfter));
        // correctedResult.setPostRaceRollingOverallPI(parseInt(rollingOverallPIAfter));
    }
}

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
        personalInterval,
        classCorrectedTime,
        rollingClassPIBefore,
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
        this.personalInterval = validFinish ? assertType(personalInterval, "number") : undefined;
        this.classCorrectedTime = validFinish ? assertType(classCorrectedTime, "number") : undefined;
        this.personalCorrectedTime = validFinish ? assertType(personalCorrectedTime, "number") : undefined;
        this.PY = assertType(PY, "number");

        this.rollingClassPIBefore = assertType(rollingClassPIBefore, "number");
        this.rollingOverallPIBefore = assertType(rollingOverallPIBefore, "number");
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
        if (Result.getId(result).includes("Result::Gill Matt::Race::2015-01-18T00:00:00.000Z::1")) {
            console.log(Result.getId(result))
        }

        const personalInterval = validFinish ? result.getPersonalInterval(raceMaxLaps, standardCorrectedTime) : undefined;

        const previousResults = helmResultsByRaceAsc
            .filter((result) => result.getRace().isBefore(race));
        const [rollingOverallPIForRace, rollingClassPIForRace] = helm.getPersonalHandicapsFromResults(previousResults, result.getBoatClass(), debug);
        const [personalCorrectedTime, classCorrectedTime] = validFinish ? result.getCorrectedTimes(rollingClassPIForRace, raceMaxLaps) : [];

        const newResult = new CorrectedResult(
            result,
            gender,
            novice,
            cadet,
            junior,
            result.getBoatClass().getPY(),
            personalInterval && Math.round(personalInterval),
            classCorrectedTime && Math.round(classCorrectedTime),
            rollingClassPIForRace,
            personalCorrectedTime && Math.round(personalCorrectedTime),
            rollingOverallPIForRace,
            raceMaxLaps,
        );

        newResult.setPostRacePIs(helmResultsByRaceAsc);
        return newResult;
    }

    setPostRacePIs(helmResultsByRaceAsc) {
        const [rollingOverallPI, rollingClassPI] = this.getHelm().getPersonalHandicapsFromResults([...helmResultsByRaceAsc, this], this.getBoatClass());
        this.setPostRaceRollingClassPI(rollingClassPI);
        this.setPostRaceRollingOverallPI(rollingOverallPI);
    }

    setPostRaceRollingClassPI(rollingClassPI) {
        this.rollingClassPIAfter = rollingClassPI;
    }

    setPostRaceRollingOverallPI(rollingOverallPI) {
        this.rollingOverallPIAfter = rollingOverallPI;
    }

    getPI() {
        return this.personalInterval;
    }

    getRollingOverallPIBeforeRace() {
        return this.rollingOverallPIBefore;
    }

    getRollingClassPIBeforeRace() {
        return this.rollingClassPIBefore;
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
            "Race PI": this.personalInterval,
            "NHEBSC PI (Single Class) Before Race": this.rollingClassPIBefore,
            "NHEBSC PI (All Classes) Before Race": this.rollingOverallPIBefore,
            "NHEBSC PI (Single Class) After Race": this.rollingClassPIAfter,
            "NHEBSC PI (All Classes) After Race": this.rollingOverallPIAfter,
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
            "Race PI": personalInterval,
            "NHEBSC PI (Single Class) Before Race": rollingClassPIBefore,
            "NHEBSC PI (All Classes) Before Race": rollingOverallPIBefore,
            "NHEBSC PI (Single Class) After Race": rollingClassPIAfter,
            "NHEBSC PI (All Classes) After Race": rollingOverallPIAfter,
        } = storeResult;

        const correctedResult = new CorrectedResult(
            result,
            gender,
            parseBoolean(novice),
            parseBoolean(cadet),
            parseBoolean(junior),
            parseInt(PY),
            parseInt(personalInterval),
            parseInt(correctedFinishTime),
            parseInt(rollingClassPIBefore),
            parseInt(personalCorrectedTime),
            parseInt(rollingOverallPIBefore),
            parseInt(raceMaxLaps),
        );
        correctedResult.setPostRaceRollingClassPI(parseInt(rollingClassPIAfter));
        correctedResult.setPostRaceRollingOverallPI(parseInt(rollingOverallPIAfter));
    }
}

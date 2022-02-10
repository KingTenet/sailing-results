import { assertType, groupBy, assert } from "../../common.js";
import Result from "./Result.js";
import { calculateSCTFromRaceResults } from "../../../scripts/personalHandicapHelpers.js";
import Race from "./Race.js";

export default class RaceFinish extends Race {
    constructor(results) {
        results.forEach((result) => assertType(result, Result));
        const races = groupBy(results, Result.getRaceId);
        assert(races.length === 1, "RaceFinish requires results are from a single race only.");

        const race = results.at(0).getRace();
        const raceDate = race.getDate();
        const raceNumber = race.getNumber();
        super(raceDate, raceNumber);

        const [sct, raceMaxLaps] = calculateSCTFromRaceResults(results);

        this.results = results;
        this.sct = sct;
        this.raceMaxLaps = raceMaxLaps;

        this.validateRaceType();
    }

    validateRaceType() {
        if (this.results.some((result) => result.getFinishTime())
            && this.isPursuitRace()
        ) {
            throw new Error(`RaceFinish date:${raceDate} number:${this.raceNumber} must contain only one type of race`);
        }
    }

    isPursuitRace() {
        return this.results.some((result) => result.getPursuitFinishPosition());
    }

    getSCT() {
        return this.sct;
    }

    getMaxLaps() {
        return this.raceMaxLaps;
    }
}

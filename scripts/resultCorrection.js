
import { groupBy } from "../src/common.js";
import Result from "../src/store/types/Result.js";
import CorrectedResult from "../src/store/types/CorrectedResult.js";
import RaceFinish from "../src/store/types/RaceFinish.js";
import Race from "../src/store/types/Race.js";

export function getCorrectedResultsForRace(raceResults, correctedResults) {
    const raceFinish = new RaceFinish(raceResults, correctedResults);
    const allResultsByRaceAsc = correctedResults.sort(Result.sortByRaceAsc);
    const helmResultsByRaceAsc = new Map(groupBy(allResultsByRaceAsc, Result.getHelmId));
    const getHelmResults = (helmId) => helmResultsByRaceAsc.get(helmId) || [];

    return raceResults
        .map((result) => CorrectedResult.fromResult(result, getHelmResults(Result.getHelmId(result)), raceFinish));
}

export function getCorrectedResultsFromResults(results, previousResults) {
    const raceFinishes = [];
    for (let [, raceResults] of Race.groupResultsByRaceAsc(results)) {
        const raceFinish = new RaceFinish(raceResults);
        if (!raceFinish.isPursuitRace(raceResults)) {
            const correctedRaceResults = getCorrectedResultsForRace(raceResults, correctedResults);
            correctedResults.push(...correctedRaceResults);
            raceFinish.setCorrectedResults(correctedRaceResults);
            raceFinishes.push(raceFinish);
        }
        else {
            console.log(`Skipping pursuit race raceDate:${raceFinish.getDate()} raceNumber:${raceFinish.getNumber()}`);
        }
    }
    return raceFinishes;
}


import { groupBy } from "../src/common.js";
import Result from "../src/store/types/Result.js";
import CorrectedResult from "../src/store/types/CorrectedResult.js";
import RaceFinish from "../src/store/types/RaceFinish.js";

export function getCorrectedResultsForRace(raceResults, correctedResults) {
    const raceFinish = new RaceFinish(raceResults);
    const allResultsByRaceAsc = correctedResults.sort(Result.sortByRaceAsc);
    const helmResultsByRaceAsc = new Map(groupBy(allResultsByRaceAsc, Result.getHelmId));
    const getHelmResults = (helmId) => helmResultsByRaceAsc.get(helmId) || [];

    return raceResults
        .map((result) => CorrectedResult.fromResult(result, getHelmResults(Result.getHelmId(result)), raceFinish));
}
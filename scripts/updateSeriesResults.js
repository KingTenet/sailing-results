
import { groupBy, getSheetIdFromURL } from "../src/common.js";
import Stores from "../src/store/Stores.js";
import Result from "../src/store/types/Result.js";
import auth from "./auth.js";
import Race from "../src/store/types/Race.js";
import { getCorrectedResultsForRace } from "./resultCorrection.js";

function getLatestProcessedRace(correctedResults) {
    const results = groupResultsByRaceAsc(correctedResults);
    if (results.length) {
        return groupResultsByRaceAsc(correctedResults).at(-1)[0];
    }
    return undefined;
}

function groupResultsByRaceAsc(results) {
    debugger;
    return groupBy(results, Result.getRaceId)
        .map(([raceId, raceResults]) => [Race.fromId(raceId), raceResults])
        .sort(([raceA], [raceB]) => raceA.sortByRaceAsc(raceB));
}

async function updateCorrectedResults(allResults, correctedResultsStore) {
    const latestProcessedRace = getLatestProcessedRace(correctedResultsStore.all());
    const resultsByRaceAscToProcess = groupResultsByRaceAsc(allResults)
        .filter(([race]) => !latestProcessedRace || latestProcessedRace.isBefore(race));

    for (let [, raceResults] of resultsByRaceAscToProcess) {
        if (!Race.isPursuitRace(raceResults)) {
            getCorrectedResultsForRace(raceResults, correctedResultsStore.all())
                .forEach((result) => correctedResultsStore.add(result));
        }
    }

    console.log("Updated corrected results");
}

async function updateAllSeriesResults(sourceResultsURL, seriesResultsURL) {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);

    const stores = await Stores.create(auth, sourceResultsSheetId, seriesResultsSheetId);

    await updateCorrectedResults(stores.results.all(), stores.correctedResults);

    stores.correctedResults.sync();


    // const allSeriesRaces = stores.seriesRaces.all();
    // const allSeries = new Map(groupBy(allSeriesRaces, SeriesRace.getSeriesId));

    // getSeriesWithRacesLaterThanDate();

    // const seriesRacesToUpdate = new Map();

    // for (let seriesRace of allSeriesRaces) {
    //     let seriesId = SeriesRace.getSeriesId(seriesRace);
    //     let lastImportedDate = seriesRace.getLastImported();
    //     const raceResults = allResultsByRace.get(SeriesRace.getRaceId(seriesRace)) || [];
    //     if (raceResults.some((result) => result.updatedAfterDate(lastImportedDate))) {
    //         seriesRacesToUpdate.set(seriesId, allSeries.get(seriesId));
    //     }
    // }

    // for (let [seriesId] of [...seriesRacesToUpdate]) {
    //     updateSeriesResults(Series.fromId(seriesId), allSeries.get(seriesId), allResults, stores.correctedResults);
    // }

    // Read source results etc.
    // Check last updated date of source results
    // Check last updated date of series results
    // If any dates are later, reprocess whole series
}


// function updateSeriesResults(series, seriesRaces, allResults, correctedResultsStore) {
//     const season = series.getSeasonName();
//     const seriesName = series.getSeriesName();
//     const allResultsByRaceAsc = groupBy(allResults, Result.getRaceId).sort(([raceIdA], [raceIdB]) => Race.fromId(raceIdA).sort(Race.fromId(raceIdB)));
//     const allCorrectedResultsByRaceAsc = groupBy(allCorrectedResults, Result.getRaceId).sort(([raceIdA], [raceIdB]) => Race.fromId(raceIdA).sort(Race.fromId(raceIdB)));
//     const allResultsByRace = new Map(allResultsByRaceAsc);

//     for (let seriesRace of seriesRaces) {
//         let raceResults = allResultsByRace.get(SeriesRace.getRaceId(seriesRace))
//         if (!raceResults) {
//             console.log(`WARNING: No results found for Race: ${seriesRace.getRace().prettyPrint()}`);
//             continue;
//         }
//         if (!Race.isPursuitRace(raceResults)) {
//             const correctedResults = processFleetRace(raceResults, allCorrectedResultsAsc);
//             console.log(correctedResults);
//         }
//         else {
//             processPursuitRace();
//         }
//         break;
//     }

//     console.log(`Updated series: '${season}/${seriesName}'`);
// }


updateAllSeriesResults(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

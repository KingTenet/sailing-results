
import { groupBy, getSheetIdFromURL, flatten } from "../src/common.js";
import Stores from "../src/store/Stores.js";
import Result from "../src/store/types/Result.js";
import auth from "./auth.js";
import Race from "../src/store/types/Race.js";
import { getCorrectedResultsForRace } from "./resultCorrection.js";
import Helm from "../src/store/types/Helm.js";
import SeriesRace from "../src/store/types/SeriesRace.js";

function getLatestProcessedRace(correctedResults) {
    const results = Race.groupResultsByRaceAsc(correctedResults);
    if (results.length) {
        return Race.groupResultsByRaceAsc(correctedResults).at(-1)[0];
    }
    return undefined;
}

async function updateCorrectedResults(allResults, correctedResultsStore) {
    const latestProcessedRace = getLatestProcessedRace(correctedResultsStore.all());
    if (!latestProcessedRace) {
        console.log(`No data has yet been imported`);
    }
    else {
        console.log(`Latest imported race is: ${latestProcessedRace.getDate().toISOString()}, ${latestProcessedRace.getNumber()}`)
    }

    const resultsByRaceAscToProcess = Race.groupResultsByRaceAsc(allResults)
        .filter(([race]) => !latestProcessedRace || latestProcessedRace.isBefore(race));

    for (let [, raceResults] of resultsByRaceAscToProcess) {
        if (!Race.isPursuitRace(raceResults)) {
            getCorrectedResultsForRace(raceResults, correctedResultsStore.all())
                .forEach((result) => correctedResultsStore.add(result));
        }
    }

    console.log("Updated corrected results");
}

async function updateAllSeriesResults(stores) {
    const allResults = stores.results.all();
    await updateCorrectedResults(allResults, stores.correctedResultsStore);

    const allSeriesRaces = stores.seriesRaces.all();
    const allSeries = groupBy(allSeriesRaces, SeriesRace.getSeriesId);
    const allResultsByRace = new Map(
        Race.groupResultsByRaceAsc(allResults)
            .map(([race, results]) => [Race.getId(race), results]));

    for (let [seriesId, seriesRaces] of allSeries) {
        console.log(`Updating results for series: ${seriesId}`);
        const seriesResults = flatten(seriesRaces.map((seriesRace) => {
            if (!allResultsByRace.has(SeriesRace.getRaceId(seriesRace))) {
                console.log("   No results found for race " + SeriesRace.getRaceId(seriesRace));
                return [];
            }
            return allResultsByRace.get(SeriesRace.getRaceId(seriesRace));
        }));
        if (!seriesResults.length) {
            console.log(`No races found for series ${seriesId}`);
        }
        else {
            await updateCorrectedResults(seriesResults, stores.seriesResults.get(seriesId));
        }
    }
}

async function updateAll(sourceResultsURL, seriesResultsURL) {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);
    const stores = await Stores.create(auth, sourceResultsSheetId, seriesResultsSheetId);

    await updateAllSeriesResults(stores);

    stores.correctedResultsStore.sync();
    [...stores.seriesResults].forEach(([, store]) => store.sync());
}




updateAll(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

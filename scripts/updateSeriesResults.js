import { groupBy, getSheetIdFromURL } from "../src/common.js";
import Stores from "../src/store/Stores.js";
import auth from "./auth.js";
import Race from "../src/store/types/Race.js";
import SeriesRace from "../src/store/types/SeriesRace.js";

function getLatestProcessedRace(correctedResults) {
    const results = Race.groupResultsByRaceAsc(correctedResults);
    if (results.length) {
        return Race.groupResultsByRaceAsc(correctedResults).at(-1)[0];
    }
    return undefined;
}

async function updateCorrectedResults(raceFinishesByRaceAsc, correctedResultsStore) {
    const latestProcessedRace = getLatestProcessedRace(correctedResultsStore.all());
    if (!latestProcessedRace) {
        console.log(`No data has yet been imported`);
    }
    else {
        console.log(`Latest imported race is: ${latestProcessedRace.getDate().toISOString()}, ${latestProcessedRace.getNumber()}`)
    }

    const finishesByRaceAscToProcess = raceFinishesByRaceAsc
        .filter((raceFinish) => !latestProcessedRace || latestProcessedRace.isBefore(raceFinish));

    for (let raceFinish of finishesByRaceAscToProcess) {
        raceFinish.getCorrectedResults()
            .forEach((result) => correctedResultsStore.add(result));
    }

    console.log("Updated corrected results");
}

async function updateAllSeriesResults(stores) {
    const raceFinishes = stores.getRaceFinish();
    const raceFinishesByRaceAsc = [...raceFinishes]
        .map(([, raceFinish]) => raceFinish)
        .sort((a, b) => a.sortByRaceAsc(b));

    await updateCorrectedResults(raceFinishesByRaceAsc, stores.correctedResultsStore);

    const allSeriesRaces = stores.seriesRaces.all();
    const allSeries = groupBy(allSeriesRaces, SeriesRace.getSeriesId);

    for (let [seriesId, seriesRaces] of allSeries) {
        console.log(`Updating results for series: ${seriesId}`);
        const seriesRaceFinishes = [];
        for (let seriesRace of seriesRaces) {
            const raceFinish = raceFinishes.get(SeriesRace.getRaceId(seriesRace));
            if (!raceFinish) {
                console.log("   No results found for race " + SeriesRace.getRaceId(seriesRace));
                continue;
            }
            seriesRaceFinishes.push(raceFinish);
        }
        if (!seriesRaceFinishes.length) {
            console.log(`No races found for series ${seriesId}`);
        }
        else {
            await updateCorrectedResults(seriesRaceFinishes, stores.seriesResults.get(seriesId));
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


async function run(sourceResultsURL, seriesResultsURL) {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);
    const stores = await Stores.create(auth, sourceResultsSheetId, seriesResultsSheetId, true);
    stores.correctedResultsStore.sync();
}

run(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

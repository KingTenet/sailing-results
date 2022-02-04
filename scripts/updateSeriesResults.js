
import { assert, assertType, getSheetIdFromURL } from "../src/common.js"
import { getHelmId } from "../src/SheetsAPI.js";
import Stores from "../src/store/Stores.js";
import Result from "../src/store/types/Result.js";
import auth from "./auth.js";
import SeriesRace from "../src/store/types/SeriesRace.js";
import StoreObject from "../src/store/types/StoreObject.js";
import Race from "../src/store/types/Race.js";
import Series from "../src/store/types/Series.js";
import BoatClass from "../src/store/types/BoatClass.js";
import CorrectedResult from "../src/store/types/CorrectedResult.js";


/*
function mapRaceResultToRow(date, raceNumber, { helm, boat, finishTime, finishCode, finishPosition, laps, PN }) {
    return {
        "Date": getURLDate(date),
        "Race Number": raceNumber,
        "Helm": helm.name,
        "Sail Number": boat.sailNumber,
        "Class": boat.className.toUpperCase(),
        "PN": PN,
        "Laps": laps,
        "Finish Position": finishPosition,
        "Finish Time": finishTime,
        "Finish Code": finishCode,
    };
}

Average corrected time ACT = average of Class handicap corrected times of top 2/3rd finishers, where the number of results to use is rounded up, i.e. 2/3 of 8 = 5.333 and the top 6 results are averaged.
The Standard Corrected Time is then calculated as:
SCT = average of Class handicap corrected times of helms who finish within 105% of ACT
Note 1: SCT may be an average of more or less than the number of helms used to calculate ACT.
Note 2: SCT does not exclude very fast results which may be quicker than 95% of ACT.
Note 3: The RYA only calculates adjustments to handicaps for races with at least 4 finishing helms including at least 2 classes of boat.

PI = [ (helm time corrected for class PN) / (Standard Corrected Time) – 1 ]*100 percent
The PI is also expressed as the equivalent increment (PH) to the class PN, rounded to a whole number:

PH = PI / 100 * (class PN)
The values of PH in each race are shown on the race results, and saved in a database to be used to calculate the fixed average personal handicap used for the personal handicap based series results

*/
function calculateSCTFromRaceResults(classCorrectedFinishTimesDesc) {
    let compliesWithRYA = true;

    if (classCorrectedFinishTimesDesc.length < 4) {
        compliesWithRYA = false;
    }

    const classes = groupBy(classCorrectedFinishTimesDesc, Result.getBoatClassId);
    if (classes.length < 2) {
        compliesWithRYA = false;
    }

    const resultsToCountForACT = Math.ceil(classCorrectedFinishTimesDesc.length * 2 / 3);
    const finishTimes = classCorrectedFinishTimesDesc.map((result) => result.getClassCorrectedTime());
    const ACT = average(finishTimes.slice(0, resultsToCountForACT));

    return average(finishTimes.filter((time) => time < (ACT * 1.05)));
}

function calculatePersonalHandicap(helmResult,) {
    const {
        class: { PY },
        finishTime,
        laps,
        mostCompletedLaps
    } = helmResult;
    const classCorrectedTimeForHelm = calculateClassCorrectedTime(PY, finishTime, laps, mostCompletedLaps);

    // handicapPI is the percentage change in time (or PY) required for helm to finish at standard corrected time.
    const handicapPI = (classCorrectedTimeForHelm / standardCorrectedTime - 1) * 100;

    // handicapPH is the absolute change in boat/class PY required for helm to finish at standard corrected time.
    const handicapPH = handicapPI * PY / 100;

    return [handicapPI, handicapPH];
}

function average(arr, mapItem = (item) => item) {
    return arr.map(mapItem).reduce((acc, value) => acc + value, 0) / arr.length;
}

function getLapsForNormalisation(results) {
    return results
        .map(Result.getLaps)
        .reduce((maxLaps, laps) => Math.max(laps, maxLaps), 0);
}

function processPursuitRace() {

}


function processFleetRace(raceResults) {
    const raceMaxLaps = getLapsForNormalisation(raceResults);
    const correctedSeriesResults = raceResults
        .map(CorrectedResult.fromResult);

    debugger;
    correctedSeriesResults
        .forEach((result) => result.calculateClassCorrectedTime(raceMaxLaps));

    const sortedFinishers = correctedSeriesResults
        .filter((result) => result.finishCode.validFinish())
        .sort((resultA, resultB) => resultA.sortByCorrectedFinishTime(resultB));

    const standardCorrectedTime = calculateSCTFromRaceResults(sortedFinishers);

    correctedSeriesResults
        .forEach((result) => result.calculatePersonalHandicap(standardCorrectedTime));

    return correctedSeriesResults;
}

function updateSeriesResults(series, seriesRaces, allResults) {
    const season = series.getSeasonName();
    const seriesName = series.getSeriesName();
    const allResultsByRaceAsc = groupBy(allResults, Result.getRaceId).sort(([raceIdA], [raceIdB]) => Race.fromId(raceIdA).sort(Race.fromId(raceIdB)));
    const allResultsByRace = new Map(allResultsByRaceAsc);

    for (let seriesRace of seriesRaces) {
        let raceResults = allResultsByRace.get(SeriesRace.getRaceId(seriesRace))
        if (!raceResults) {
            console.log(`WARNING: No results found for Race: ${seriesRace.getRace().prettyPrint()}`);
            continue;
        }
        if (!Race.isPursuitRace(raceResults)) {
            const correctedResults = processFleetRace(raceResults);
            console.log(correctedResults);
        }
        else {
            processPursuitRace();
        }
        break;
    }

    console.log(`Updated series: '${season}/${seriesName}'`);
}

async function updateAllSeriesResults(sourceResultsURL, seriesResultsURL) {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);

    const stores = await Stores.create(auth, sourceResultsSheetId, seriesResultsSheetId);

    const allResults = stores.results.all();
    const allSeriesRaces = stores.seriesRaces.all();

    const allResultsByRace = new Map(groupBy(allResults, Result.getRaceId));
    const allSeries = new Map(groupBy(allSeriesRaces, SeriesRace.getSeriesId))

    const seriesRacesToUpdate = new Map();

    for (let seriesRace of allSeriesRaces) {
        let seriesId = SeriesRace.getSeriesId(seriesRace);
        let lastImportedDate = seriesRace.getLastImported();
        const raceResults = allResultsByRace.get(SeriesRace.getRaceId(seriesRace)) || [];
        if (raceResults.some((result) => result.updatedAfterDate(lastImportedDate))) {
            seriesRacesToUpdate.set(seriesId, allSeries.get(seriesId));
        }
    }

    for (let [seriesId] of [...seriesRacesToUpdate]) {
        updateSeriesResults(Series.fromId(seriesId), allSeries.get(seriesId), allResults);
    }

    // Read source results etc.
    // Check last updated date of source results
    // Check last updated date of series results
    // If any dates are later, reprocess whole series
}

updateAllSeriesResults(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));


class AutoMap extends Map {
    constructor(getKey = JSON.stringify, getDefaultValue) {
        super();
        this.getKey = getKey;
        this.getDefaultValue = getDefaultValue;
    }

    upsert(obj, transform = (prev, obj, key) => obj) {
        let key = this.getKey(obj);
        if (!this.has(key) && this.getDefaultValue !== undefined) {
            return this.set(key, transform(this.getDefaultValue(obj), obj, key));
        }
        return this.set(key, transform(super.get(key), obj, key))
    }
}

function groupBy(arr, groupFunction) {
    const map = new AutoMap(groupFunction, () => []);
    arr.forEach((item) => map.upsert(item, (prev, obj) => [...prev, obj]));
    return [...map];
}

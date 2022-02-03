
import { groupBy, getSheetIdFromURL } from "../src/common.js"
import { getRaceId, getSeriesId, getHelmId } from "../src/SheetsAPI.js";
import Stores from "../src/store/Stores.js";
import auth from "./auth";


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
function calculateSCTFromRaceResults(results) {
    const finishers = results
        .filter(({ finishTime }) => finishTime);

    const mostCompletedLaps = getLapsForNormalisation(results);

    const compliesWithRYA = true;

    if (finishers.length < 4) {
        compliesWithRYA = false;
    }

    const classes = groupBy(finishers, ({ class: { className } }) => className);
    if (classes.length < 2) {
        compliesWithRYA = false;
    }

    const classCorrectedFinishTimes = finishers
        .map(({ class: PY, finishTime, laps }) => calculateClassCorrectedTime(PY, finishTime, laps, mostCompletedLaps))
        .sort((a, b) => a - b);

    const resultsToCountForACT = Math.ceil(finishers.length * 2 / 3);
    const ACT = average(classCorrectedFinishTimes.slice(0, resultsToCountForACT));

    return average(classCorrectedFinishTimes.filter(({ finishTime }) => finishTime < (ACT * 1.05)));
}

function calculatePersonalHandicap(helm, results) {
    const standardCorrectedTime = calculateSCTFromRaceResults(results);
    const helmResult = results.find(({ resultHelm }) => getHelmId(resultHelm) === getHelmId(helm));
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
        .filter(({ finishTime }) => finishTime)
        .reduce((most, { laps }) => Math.max(most, laps), 0);
}

function calculateClassCorrectedTime(PY, finishTime, lapsCompleted, lapsToUse) {
    return finishTime * lapsToUse * 1000 / (lapsCompleted * PY);
}



async function updateSeriesResults(sourceResultsURL, seriesResultsURL) {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);

    const stores = await Stores.create(auth, sourceResultsSheetId, seriesResultsSheetId);

    const allHelms = stores.helms.all();
    const allRaceResults = stores.results.all();
    // const allRaces = new Map(groupBy(
    //     await sheetsAPI.getAllResults(({ helmId, ...raceResult }) => ({
    //         ...raceResult,
    //         helm: allHelms.find((helm) => helmId === getHelmId(helm)),
    //     })),
    //     getRaceId,
    // ));

    // const allSeries = groupBy(
    //     (await seriesAPI.getSeriesRaces()),
    //     getSeriesId,
    // );

    // debugger;
    // for (let [series, seriesRaces] of [...allSeries]) {
    //     if (seriesRaces.some((race) => !race.lastImported || race.lastImported < allRaces.get(getRaceId(race).lastUpdated))) {
    //         console.log(`Series ${series} needs updating`);
    //     }
    // }

    // Read source results etc.
    // Check last updated date of source results
    // Check last updated date of series results
    // If any dates are later, reprocess whole series
}

updateSeriesResults(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

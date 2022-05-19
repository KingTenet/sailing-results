import { getSheetIdFromURL } from "../src/common.js";
import { Stores } from "../src/store/Stores.js";
import Race from "../src/store/types/Race.js";
import auth from "./auth.js";
import { calculateSCTFromRaceResults } from "../src/common/personalHandicapHelpers.js";

global.DEBUG = true;

// Dev URLs
// const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw/edit#gid=1747234560";
// const seriesResultsURL = "https://docs.google.com/spreadsheets/d/1yngxguLyDsFHR-DLA72riRgYzF_nCrlaz01DVeEolMQ/edit#gid=1432028078";

const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1Q5fuKvddf8cM6OK7mN6ZfnMzTmXGvU8z3npRlR56SoQ";
const seriesResultsURL = "https://docs.google.com/spreadsheets/d/1Q5fuKvddf8cM6OK7mN6ZfnMzTmXGvU8z3npRlR56SoQ";

const parseBoolean = (str) => str && str.toLowerCase() !== "false" ? str : undefined;

async function run(seriesSearchStr, raceSearchStr, personalHandicapStr = false, forceRefresh = false) {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);
    const stores = await Stores.create(auth, sourceResultsSheetId, seriesResultsSheetId, parseBoolean(forceRefresh));
    stores.processResults();
    const personalHandicap = parseBoolean(personalHandicapStr);

    const seriesSearch = parseBoolean(seriesSearchStr);
    const raceSearch = parseBoolean(raceSearchStr);

    const seriesPoints = new Map(stores.seriesPoints);
    const seriesNames = stores.seriesPoints.map(([seriesId]) => seriesId);

    console.log("Searching series");
    stores.seriesPoints.forEach(([seriesId]) => console.log(seriesId));
    const seriesFinishName = seriesNames
        .find((seriesId) => seriesId.toLowerCase().includes(seriesSearch.toLowerCase()));

    if (seriesFinishName) {
        console.log(`Found series: ${seriesFinishName}`);
        const seriesFinish = seriesPoints.get(seriesFinishName);
        if (!personalHandicap) {
            seriesFinish.summarizeByClassHandicap(new Date());
        }
        else {
            seriesFinish.summarizeByPersonalHandicap(new Date());
        }

        if (raceSearch) {
            console.log("Searching series races");
            seriesFinish.raceFinishes.forEach((race) => console.log(Race.getId(race)));
            const raceFinish = seriesFinish.raceFinishes.find((race) => Race.getId(race).toLowerCase().includes(raceSearch.toLowerCase()));
            if (raceFinish) {
                console.log(`Found race: ${Race.getId(raceFinish)}`);
                summarizeRaceFinish(seriesFinish, raceFinish, !personalHandicap, true);
                SCTdebug(raceFinish);
            }
        }
    }

    // const seriesId = stores.seriesPoints.find(([,seriesPoints]) => series.includes(seriesSearch));
    // const raceNumber = parseInt(raceNumberSearch);
}

function SCTdebug(raceFinish) {
    console.log(`SCT for race: ${raceFinish.getSCT() / raceFinish.getMaxLaps()} `);
    const raceResults = raceFinish.getCorrectedResults();
    calculateSCTFromRaceResults(raceResults, true);

    // console.log(JSON.stringify(racePoints, null, 4));
}

function summarizeRaceFinish(seriesFinish, raceFinish, byClassHandicap, usePHFromSeriesStart = true) {
    const finishes = seriesFinish.raceFinishes
        .filter((race) => race.isBefore(new Race(new Date(), 1)))
        .sort((raceA, raceB) => raceA.sortByRaceAsc(raceB));

    const getPointsByResult = (raceFinish) => {
        if (byClassHandicap) {
            return raceFinish.getClassCorrectedPointsByResult();
        }
        if (usePHFromSeriesStart) {
            // Use PH from first race in series..
            return raceFinish.getPersonalCorrectedPointsByResult(finishes.at(0));
        }
        return raceFinish.getPersonalCorrectedPointsByResult();
    };

    console.log(`SCT for race: ${raceFinish.getSCT() / raceFinish.getMaxLaps()} `);

    const racePoints = getPointsByResult(raceFinish);
    console.log(JSON.stringify(racePoints, null, 4));
}


run(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

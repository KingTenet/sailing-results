import { Stores } from "../src/store/Stores.js";
import { devReadWrite } from "./auth.js";
import StoreWrapper from "../src/store/StoreWrapper.js";
import Result from "../src/store/types/Result.js";
import { groupBy, getSheetIdFromURL, flatten, getGoogleSheetDoc, mapGroupBy } from "../src/common.js";
import HelmResult from "../src/store/types/HelmResult.js";
import Series from "../src/store/types/Series.js";
import HelmSeries from "./types/HelmSeries.js";
import Helm from "../src/store/types/Helm.js";

global.DEBUG = true;

const auth = devReadWrite;

const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1Q5fuKvddf8cM6OK7mN6ZfnMzTmXGvU8z3npRlR56SoQ/edit#gid=771994490";
const analysisSheetURL = "https://docs.google.com/spreadsheets/d/1Qg8-A0SzykgQROtDDg3H1SKkxbrZ7lF7Kw8PdeOWoZY/";

const parseBoolean = (str) => str && str.toLowerCase() !== "false" ? str : undefined;

async function run(forceRefresh = "true") {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const analysisSheetId = getSheetIdFromURL(analysisSheetURL);
    const analysisDocument = getGoogleSheetDoc(analysisSheetId, auth.clientEmail, auth.privateKey);

    const stores = await Stores.create(auth, sourceResultsSheetId, parseBoolean(forceRefresh));
    await outputSeriesHelms(stores, "Helms Series", analysisDocument);
}

async function outputSeriesHelms(stores, sheetName, sheetDoc) {
    const seriesResults = flatten(flatten(
        stores.seriesPoints
            .map(([, seriesPoints]) => seriesPoints.raceFinishes
                .map((raceFinish) => raceFinish.hasResults() && raceFinish.getCorrectedResults().map((result) => [seriesPoints, result]))
                .filter(Boolean)
            )));


    const allResults = flatten(stores.raceFinishes
        .filter((raceFinish) => raceFinish.hasResults())
        .map((raceFinish) => raceFinish.getCorrectedResults())
    );
    const racesByHelm = mapGroupBy(allResults, [Result.getHelmId], (results) => results.sort(HelmResult.sortByRaceAsc).map(Result.getRaceId)[0]);

    const seriesHelms = groupBy(
        seriesResults,
        [([seriesPoints]) => Series.getId(seriesPoints), ([, result]) => HelmResult.getHelmId(result)],
    );

    const seriesHelmsStore = await StoreWrapper.create(false, sheetName, sheetDoc, stores, HelmSeries, (storeResult) => storeResult, undefined, true);
    for (let [seriesId, helmSeriesResults] of seriesHelms) {
        for (let [, seriesResults] of helmSeriesResults) {
            const results = seriesResults.map(([, results]) => results);
            const firstSeriesResult = results[0];
            const helm = firstSeriesResult.getHelm();
            const firstRace = racesByHelm.get(Helm.getId(helm));
            console.log(Helm.getId(helm), firstRace);
            const isFirstSeries = results.map(Result.getRaceId).includes(firstRace);

            seriesHelmsStore.add(HelmSeries.fromSeriesHelm(Series.fromId(seriesId), helm, isFirstSeries));
        }
    }

    await seriesHelmsStore.sync();
}

run(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

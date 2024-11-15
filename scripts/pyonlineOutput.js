import { Stores } from "../src/store/Stores.js";
import { devReadWrite } from "../auth.js";
import StoreWrapper from "../src/store/StoreWrapper.js";
import {
  getSheetIdFromURL,
  getGoogleSheetDoc,
  mapGroupBy,
} from "../src/common.js";
import CorrectedResult from "../src/store/types/CorrectedResult.js";
import PYUpload from "./types/PYUpload.js";
import Race from "../src/store/types/Race.js";
import RemoteStore from "../src/store/RemoteStore.js";

global.DEBUG = true;

const auth = devReadWrite;

function getCompletedSeasons(stores, now = new Date()) {
  const lastSeasonSeries = "Icicle";
  const tomorrowsRace = new Race(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    1
  );

  const completedSeries = stores.seriesPoints.filter(
    ([seriesPointsId, seriesPoints]) =>
      seriesPoints.seriesRaces.every(({ race }) => race.isBefore(tomorrowsRace))
  );

  return completedSeries
    .filter(
      ([id, seriesPoints]) => seriesPoints.getSeriesName() === lastSeasonSeries
    )
    .map(([id, seriesPoints]) => [
      seriesPoints.seriesRaces
        .map(({ race }) => race)
        .sort((a, b) => a.sortByRaceAsc(b))
        .at(-1),
      seriesPoints.getSeriesName(),
      seriesPoints.getSeasonName(),
    ])
    .sort(([a], [b]) => a.sortByRaceAsc(b));
}

function getNextPossibleRace(race) {
  return new Race(
    new Date(
      race.date.getFullYear(),
      race.date.getMonth(),
      race.date.getDate() + 1
    ),
    1
  );
}

function getFilterLastCompletedSeason(stores) {
  const seasons = getCompletedSeasons(stores);
  const firstPossibleRaceOfCompletedSeason = getNextPossibleRace(
    seasons.at(-2)[0]
  );
  const firstPossibleRaceOfCurrentSeason = getNextPossibleRace(
    seasons.at(-1)[0]
  );

  return (race) => {
    return (
      race.isBefore(firstPossibleRaceOfCurrentSeason) &&
      firstPossibleRaceOfCompletedSeason.isBefore(race)
    );
  };
}

// debug source results
const sourceResultsURL =
  "https://docs.google.com/spreadsheets/d/1jIyLxs06F_20L2EGMO8omRag9bR0Z1iAA1GOU7UCig0/edit?gid=771994490#gid=771994490";
const analysisSheetURL =
  "https://docs.google.com/spreadsheets/d/1vWpZR7ZHKn9TW2oT7zJchX6vcQS88bTB89gVxXLitLo/edit?gid=0#gid=0";

const parseBoolean = (str) =>
  str && str.toLowerCase() !== "false" ? str : undefined;

async function run(outputDnfsStr = "true", forceRefreshStr = "true") {
  const outputDnfs = parseBoolean(outputDnfsStr);
  const forceRefresh = parseBoolean(forceRefreshStr);
  const analysisDocument = getGoogleSheetDoc(
    getSheetIdFromURL(analysisSheetURL),
    auth.clientEmail,
    auth.privateKey
  );

  const stores = await Stores.create(
    auth,
    getSheetIdFromURL(sourceResultsURL),
    forceRefresh
  );
  stores.processResults();

  const filterLastCompletedSeason = getFilterLastCompletedSeason(stores);
  const [, , latestCompletedYear] = getCompletedSeasons(stores).at(-1);
  const sheetName = `ff${latestCompletedYear - 1}/${latestCompletedYear}`;

  const metaStore = await RemoteStore.retryCreateRemoteStore(
    analysisDocument,
    "Meta Data",
    true,
    ["Last Written Sheet"]
  );

  const output = (await metaStore.getAllRows())[0];

  if (output && output["Last Written Sheet"] === sheetName) {
    console.log(`PY data for RYA for ${sheetName} has already been uploaded`);
    return;
  }

  const pyUploadStore = await StoreWrapper.create(
    false,
    sheetName,
    analysisDocument,
    stores,
    PYUpload,
    (storeResult) => stores.deserialiseResult(storeResult),
    undefined,
    true
  );

  stores.seriesPoints.map(([, seriesPoints]) => {
    seriesPoints.getPoints();
    seriesPoints.allClassHandicapPoints.forEach((points) => {
      if (!outputDnfs && !points.result.finishTime) {
        return;
      }

      if (!(points.result instanceof CorrectedResult)) {
        return;
      }

      if (!filterLastCompletedSeason(points.result.raceFinish)) {
        return;
      }

      pyUploadStore.add(
        PYUpload.fromSeriesPointsFinish(
          seriesPoints,
          points.result.raceFinish,
          points.result,
          points
        )
      );
    });
  });

  await metaStore.replace([{ "Last Written Sheet": sheetName }]);
  await pyUploadStore.sync();
  await pyUploadStore.clear();
}

run(...process.argv.slice(2))
  .then(() => console.log("Finished"))
  .catch((err) => console.log(err));

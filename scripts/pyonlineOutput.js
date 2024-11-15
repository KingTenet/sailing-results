import { Stores } from "../src/store/Stores.js";
import { devReadWrite } from "../auth.js";
import StoreWrapper from "../src/store/StoreWrapper.js";
import { getSheetIdFromURL, getGoogleSheetDoc } from "../src/common.js";
import CorrectedResult from "../src/store/types/CorrectedResult.js";
import PYUpload from "./types/PYUpload.js";

global.DEBUG = true;

const auth = devReadWrite;

// debug source results
const sourceResultsURL =
  "https://docs.google.com/spreadsheets/d/1jIyLxs06F_20L2EGMO8omRag9bR0Z1iAA1GOU7UCig0/edit?gid=771994490#gid=771994490";
const analysisSheetURL =
  "https://docs.google.com/spreadsheets/d/1jIyLxs06F_20L2EGMO8omRag9bR0Z1iAA1GOU7UCig0/edit?gid=771994490#gid=771994490";

const parseBoolean = (str) =>
  str && str.toLowerCase() !== "false" ? str : undefined;

async function run(outputDnfsStr = "true") {
  const outputDnfs = parseBoolean(outputDnfsStr);

  const stores = await Stores.create(
    auth,
    getSheetIdFromURL(sourceResultsURL),
    true
  );
  stores.processResults();

  const pyUploadStore = await StoreWrapper.create(
    false,
    "PY Upload",
    getGoogleSheetDoc(
      getSheetIdFromURL(analysisSheetURL),
      auth.clientEmail,
      auth.privateKey
    ),
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

  await pyUploadStore.sync();
}

run(...process.argv.slice(2))
  .then(() => console.log("Finished"))
  .catch((err) => console.log(err));

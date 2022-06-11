import { Stores } from "../src/store/Stores.js";
import { devAuth } from "./auth.js";
import StoreWrapper from "../src/store/StoreWrapper.js";
import { getSheetIdFromURL, getGoogleSheetDoc, mapGroupBy, flatten } from "../src/common.js";
import Race from "../src/store/types/Race.js";
import BoatClass from "../src/store/types/BoatClass.js";
import BoatClassRaces from "./types/BoatClassRaces.js";

global.DEBUG = true;

const EXCLUDE_DEPRECATED = false;
const auth = devAuth;

const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw/edit#gid=1747234560";
const ouptutSheetURL = "https://docs.google.com/spreadsheets/d/15CESU67Qy34N_rzirxRQnSvbcSosxNXAB-TZNvYLP9k/edit#gid=684050272";

const parseBoolean = (str) => str && str.toLowerCase() !== "false" ? str : undefined;

async function run(forceRefresh = "true") {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const outputSheetId = getSheetIdFromURL(ouptutSheetURL);
    const outputDocument = () => getGoogleSheetDoc(outputSheetId, auth.clientEmail, auth.privateKey);

    const stores = await Stores.create(auth, sourceResultsSheetId, parseBoolean(forceRefresh));

    await outputClassHandicaps(stores, "Current Class Handicaps", outputDocument);
}

async function outputClassHandicaps(stores, sheetName, sheetDoc) {
    const allCorrectedResults = flatten(stores.raceFinishes.map((raceFinish) => raceFinish.hasResults() ? raceFinish.getCorrectedResults() : []));
    const todaysRace = new Race(new Date(), 1);
    const now = new Date();
    const lastYearsRace = new Race(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), 1);

    const lastYearRaces = allCorrectedResults
        .filter((result) => !result.getRace().isBefore(lastYearsRace));

    const classesCount = mapGroupBy(lastYearRaces, [(result) => result.getBoatClass().getClassName()], (results) => results.length);

    const clubClasses = [...stores.clubClasses].map(([, classes]) => classes);
    const ryaClasses = [...stores.ryaClasses].map(([, classes]) => classes);

    const allCurrentClasses = BoatClass.getBoatClassesForRace(todaysRace, ryaClasses, clubClasses, EXCLUDE_DEPRECATED);

    // const classHandicapsStore = await StoreWrapper.create(false, sheetName, sheetDoc, stores, BoatClass, (storeResult) => storeResult, undefined, true);
    const classHandicapsStore = await StoreWrapper.create(false, sheetName, sheetDoc, stores, BoatClassRaces, (storeResult) => storeResult, undefined, true);
    for (let [className, boatClass] of [...allCurrentClasses]) {
        if (className === "SOLO") {
            debugger;
        }
        classHandicapsStore.add(BoatClassRaces.fromBoatClassRaces(boatClass, classesCount.get(className) || 0));
        // classHandicapsStore.add(boatClass);
    }

    console.log(classHandicapsStore.all().length);

    await classHandicapsStore.sync();
}


run(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

import { Stores } from "../src/store/Stores.js";
import auth from "./auth.js";
import StoreWrapper from "../src/store/StoreWrapper.js";
import ClassAnalysis from "./types/ClassAnalysis.js";
import { HeadToHead, MultiValueWrapper } from "./types/HeadToHead.js";
import Result from "../src/store/types/Result.js";
import { groupBy, getSheetIdFromURL, flatten, getGoogleSheetDoc, getURLDate } from "../src/common.js";
import HelmResult from "../src/store/types/HelmResult.js";
import CorrectedResult from "../src/store/types/CorrectedResult.js";
import StoreObject from "../src/store/types/StoreObject.js";
import Race from "../src/store/types/Race.js";

global.DEBUG = true;

const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw/edit#gid=1747234560";

// debug source results
// const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1nzKraj79TDf0GlFQJSS4TUMQ1o07RrwPqIzzR3b7wr8/edit#gid=51306302";
const seriesResultsURL = "https://docs.google.com/spreadsheets/d/1yngxguLyDsFHR-DLA72riRgYzF_nCrlaz01DVeEolMQ/edit#gid=1432028078";
const analysisSheetURL = "https://docs.google.com/spreadsheets/d/1TU2VmtmuYOezR_l0KPEpw3Y2YrbduxmPBtZOuKbmJqE/edit#gid=1748778425";

const parseBoolean = (str) => str && str.toLowerCase() !== "false" ? str : undefined;

async function run(forceRefresh = "true") {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);
    const analysisSheetId = getSheetIdFromURL(analysisSheetURL);
    const analysisDocument = () => getGoogleSheetDoc(analysisSheetId, auth.clientEmail, auth.privateKey);

    const stores = await Stores.create(auth, sourceResultsSheetId, seriesResultsSheetId, parseBoolean(forceRefresh));


    // await outputHeadToHead(stores, "Head To Head", analysisDocument, "Robert Powell", "Mike Clarke");
    // await outputClassAnalysis(stores, "Class Analysis Source Data", analysisDocument);

    // await outputClassAnalysis(stores, "Class Analysis Excluding Rob/Mike", analysisDocument, (results) => results.filter((result) => !["Robert Powell", "Mike Clarke"].includes(Result.getHelmId(result))));

    await outputClassAnalysis(stores, "Class Analysis For Experienced Solo/Laser Helms", analysisDocument, tranformIncludeLaserSoloHelms());

    await outputCorrectedResults(stores, "Corrected Results For Experienced Solo/Laser Helms", analysisDocument, tranformIncludeLaserSoloHelms());
}

async function outputCorrectedResults(stores, sheetName, sheetDoc, tranformResults) {
    stores.processResults(tranformResults);
    const allCorrectedResults = stores.allCorrectedResults;
    const correctedResultsStore = await StoreWrapper.create(sheetName, sheetDoc, stores, CorrectedResult, (storeResult) => stores.deserialiseResult(storeResult), undefined, true);

    for (let result of allCorrectedResults) {
        correctedResultsStore.add(result);
    }
    await correctedResultsStore.sync();
}

async function outputClassAnalysis(stores, sheetName, sheetDoc, tranformResults) {
    stores.processResults(tranformResults);
    const allCorrectedResults = stores.allCorrectedResults;

    const classAnalyses = flatten(
        groupBy(
            allCorrectedResults,
            [HelmResult.getRaceId, Result.getBoatClassName],
            ClassAnalysis.fromRaceFinishResults
        )
            .map(([, analysesByRace]) => flatten(analysesByRace.map(([, classAnalysis]) => classAnalysis))));

    const classAnalysisStore = await StoreWrapper.create(sheetName, sheetDoc, stores, ClassAnalysis, (storeResult) => storeResult, undefined, true);
    for (let classAnalysis of classAnalyses) {
        classAnalysisStore.add(classAnalysis);
    }

    await classAnalysisStore.sync();
}

async function outputHeadToHead(stores, sheetName, sheetDoc, helmAId, helmBId) {
    stores.processResults();
    const headToHeadResults = stores.raceFinishes
        .filter((raceFinish) => raceFinish.hasResults())
        .map((raceFinish) => raceFinish.getClassCorrectedPointsByResult())
        .map((resultsByPosition) => resultsByPosition.filter(([result]) => [helmAId, helmBId].includes(Result.getHelmId(result))))
        .filter((resultsForHelms) => resultsForHelms.length === 2) // Both helms were in the race
        .map((resultsForHelms) => {
            const getResultPositionForHelmId = (helmId) => resultsForHelms.find(([result]) => Result.getHelmId(result) === helmId) || [];
            const [resultA, positionA] = getResultPositionForHelmId(helmAId);
            const [resultB, positionB] = getResultPositionForHelmId(helmBId);
            const race = resultA.getRace();
            const raceDate = getURLDate(race.getDate());
            const raceNumber = race.getNumber();
            // return [raceDate, raceNumber, helmAId, Result.getBoatClassName(resultA), positionA, positionA < positionB ? 1 : 0, helmBId, Result.getBoatClassName(resultB), positionB, positionB < positionA ? 1 : 0];

            const winnerResult = positionA < positionB
                ? resultA
                : positionB < positionA
                    ? resultB
                    : undefined;

            const secondResult = positionA < positionB
                ? resultB
                : positionB < positionA
                    ? resultA
                    : undefined;

            return [
                raceDate,
                raceNumber,
                winnerResult && Result.getHelmId(winnerResult),
                winnerResult && Result.getBoatClassName(winnerResult),
                secondResult && Result.getHelmId(secondResult),
                secondResult && Result.getBoatClassName(secondResult),
                helmAId,
                Result.getBoatClassName(resultA),
                positionA,
                positionA < positionB ? 1 : 0,
                helmBId,
                Result.getBoatClassName(resultB),
                positionB,
                positionB < positionA ? 1 : 0
            ]
        });

    const headToHeadResultsStore = new MultiValueWrapper(
        sheetName,
        sheetDoc,
        stores,
        [
            "Date",
            "Race Number",
            "Winning Helm",
            "Winning Class",
            "Second Helm",
            "Second Class",
            "Helm A",
            "Helm A Class",
            "Helm A Position",
            "Helm A Win",
            "Helm B",
            "Helm B Class",
            "Helm B Position",
            "Helm B Win"
        ],
        headToHeadResults,
        (obj) => {
            try {
                const [date, raceNumber] = obj;
                return `${date}${raceNumber}`;
            }
            catch (err) {
                console.log(obj);
                throw err;
            }
        }
    );

    await headToHeadResultsStore.store();
}


run(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));



function tranformIncludeLaserSoloHelms(
    soloSailors = [
        "Michael Gearing",
        "David O'Shea",
        "Mark Hobbs",
        "Paul Coxhead",
    ],
    laserSailors = [
        "Chris Tamlyn",
        "Liz Fisher",
        "Paul Rose",
        "Matt Gill",
        "Felix Morley",
    ]) {
    return (results) => Race.groupResultsByRaceAsc(
        results.filter((result) => {
            const className = Result.getBoatClassName(result);
            const helmName = Result.getHelmId(result);
            switch (className) {
                case "SOLO":
                    return soloSailors.includes(helmName);
                case "LASER":
                    return laserSailors.includes(helmName);
                case "LASER RADIAL":
                    return laserSailors.includes(helmName);
                case "LASER 4.7 (ADULT)":
                    return laserSailors.includes(helmName);
                default:
                    return true;
            }
        }))
        .filter(([, results]) => results.some((result) => result.finishCode.validFinish()))
        .reduce((acc, [, results]) => acc.concat(results), [])
}
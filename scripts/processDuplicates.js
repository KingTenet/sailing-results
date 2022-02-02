import auth from "./auth.js";
import { AutoMap, flattenMap, limitSheetsRequest, getGoogleSheetDoc, parseISOString, groupBy, getSheetIdFromURL } from "../src/common.js"
import { SheetsAPI, getRaceId, getSeriesId, getHelmId } from "../src/SheetsAPI.js";
import { find } from "domutils";

// This helps filter out invalid rows..
const MIN_PY = 500;
const MAX_PY = 2000;
const ALLOWED_TYPES = "DINGHY";

const RYASheetId2011 = "1RHJUkh98UXp7ZRqCU_y91tPvOfsK8iI88iHS3nODIeM";
const RYASheetId2012 = "1QsnmWMLdugHFME_9W22qWGjFl7tUDFwacqRx1SgcFdQ";
const RYASheetId2013 = "1nTMfvtnHh_8oVEEjizKOH_7aUm0Sn8nKgtoyRNpW4hU";
const RYASheetId2014 = "1W4RxQ5eJZIc39aWf8ugei90LA_Y96ons_qEtrvezGos";
const RYASheetId2015 = "10exR9zG1cKA8i638GVFvES7B-5oPjInhH6PeI-8lLFg";
const RYASheetId2016 = "1SRfxqkSQg67pAnXITx-XxFPUBiYH-OswwP8hRSgvW8o";
const RYASheetId2017 = "1aPuEiJCZ97nVcgkcQzXdGacLy1JCr3e711BrkQMPA3U";
const RYASheetId2018 = "12k3w_Or4uMRG7jv_Z9BMtaYk4sJfAKqWAKTToV6tSgA";
const RYASheetId2019 = "17NLvahG3zs6QAKh-uiaCPVpzDqmFsAE84fPLka1gxkM";
const RYASheetId2020 = "1pqvEoMkOT4ezrUuoiI1MbI5y-ofN6-qKQO3i7gL5szI";

const allYearsFull = [
    [2011, RYASheetId2011],
    [2012, RYASheetId2012],
    [2013, RYASheetId2013],
    [2014, RYASheetId2014],
    [2015, RYASheetId2015],
    [2016, RYASheetId2016],
    [2017, RYASheetId2017],
    [2018, RYASheetId2018],
    [2019, RYASheetId2019],
    [2020, RYASheetId2020],
];

const mapFullRowToClass = (year) => ({ "Class Name": className, "No. of Crew": crew, "Rig": rig, "Spinnaker": spinnaker, "Number": PY, "Type": type, ...rest }) => ({
    className: className.trim(),
    crew,
    rig,
    spinnaker,
    PY,
    change: rest[Object.keys(rest).find((key) => key.toLowerCase().includes("change"))],
    type,
    unique: [className.trim(), crew, rig, spinnaker].join(":::"),
    year,
    dateUpdated: parseISOString(`${parseInt(year)}-01-01T00:00:00.000Z`),
});

async function getClassesForSheet(sheetId, mapRow) {
    const doc = await getGoogleSheetDoc(sheetId, auth.clientEmail, auth.privateKey);
    const sheet = doc.sheetsByIndex[0];
    return (await limitSheetsRequest(() => sheet.getRows()))
        .map(mapRow)
        .filter(({ className, PY, type }) => className.length && parseInt(PY) > MIN_PY && parseInt(PY) < MAX_PY && (!type || ALLOWED_TYPES.includes(type)));
}

function getFullClassId({ className, crew, rig, spinnaker }) {
    return JSON.stringify([className, crew, rig, spinnaker])
}

async function appendClassesSheet(classes, sheetId, clientEmail, privateKey, sheetName) {
    let sheetsAPI = await SheetsAPI.initSheetsAPI(sheetId, clientEmail, privateKey);
    return await sheetsAPI.appendClasses(classes, sheetName);
}

async function processDuplicateHelms() {
    // Get helms list
    // Get duplicates
    // Ensure duplicate ref/parent exists
    // Find all occurances of duplicates in results
    // Find earliest occurance and prompt user for confirmation of effects
    // Update results rows with new values and updated date
    // If successfully updated all rows, then delete helms marked for deletion
}

async function processDuplicates(outputSheetURL) {






    const allRows = [];
    const fullClasses = new AutoMap(getFullClassId);
    const outputSheetId = getSheetIdFromURL(outputSheetURL);

    for (let [year, sheetId] of allYearsFull) {
        for (let boatClass of (await getClassesForSheet(sheetId, mapFullRowToClass(year)))) {
            allRows.push(boatClass);
            // Group by class
            fullClasses.upsert(boatClass)
        }
    }

    const yearsOfInterest = [
        2014,
        2015,
        2016,
        2017,
        2018,
        2019,
        2020,
        2021,
        2022
    ];

    const fullYearsOfInterest = new AutoMap(getFullClassId, () => [])
    for (let [classId] of [...fullClasses]) {
        for (let year of yearsOfInterest) {
            let matchedYearForClass = allRows
                .find((thisClass) => classId === getFullClassId(thisClass) && thisClass.dateUpdated.getUTCFullYear() === year);

            if (matchedYearForClass) {
                fullYearsOfInterest.upsert(matchedYearForClass, (prev, obj) => [...prev, { validYear: year, ...obj }]);
            }
        }
    }

    await appendClassesSheet(flattenMap(fullYearsOfInterest), outputSheetId, auth.clientEmail, auth.privateKey, "RYA Full List");
}

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

    // const sheetsAPI = await SheetsAPI.initSheetsAPI(sourceResultsSheetId, auth.clientEmail, auth.privateKey);
    // const seriesAPI = await SheetsAPI.initSheetsAPI(seriesResultsSheetId, auth.clientEmail, auth.privateKey);

    const allHelms = await sheetsAPI.getAllHelms();
    const allRaces = new Map(groupBy(
        await sheetsAPI.getAllResults(({ helmId, ...raceResult }) => ({
            ...raceResult,
            helm: allHelms.find((helm) => helmId === getHelmId(helm)),
        })),
        getRaceId,
    ));

    const allSeries = groupBy(
        (await seriesAPI.getSeriesRaces()),
        getSeriesId,
    );

    debugger;
    for (let [series, seriesRaces] of [...allSeries]) {
        if (seriesRaces.some((race) => !race.lastImported || race.lastImported < allRaces.get(getRaceId(race).lastUpdated))) {
            console.log(`Series ${series} needs updating`);
        }
    }

    // Read source results etc.
    // Check last updated date of source results
    // Check last updated date of series results
    // If any dates are later, reprocess whole series
}

class Results {

}

class Result {
    constructor(date, raceNumber, helmId, boatClassName, boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode, lastUpdated) {
        this.date = date;
        this.raceNumber = raceNumber;
        this.helmId = helmId;
        this.boatClassName = boatClassName;
        this.boatSailNumber = boatSailNumber;
        this.laps = laps;
        this.pursuitFinishPosition = pursuitFinishPosition;
        this.finishTime = finishTime;
        this.finishCode = finishCode;

        // TODO add validation here!!
    }

    static getHelmId(result) {
        return result.helmId;
    }

    static fromStoreResult(storeResult) {
        let {
            "Date": dateString,
            "Race Number": raceNumber,
            "Helm": helmId,
            "Sail Number": boatSailNumber,
            "Class": boatClassName,
            // "PN": PN,
            "Laps": laps,
            "Pursuit Finish Position": pursuitFinishPosition,
            "Finish Time": finishTime,
            "Finish Code": finishCode,
            "Last Updated": lastUpdated,
        } = storeResult;

        return new Result(dateString, raceNumber, helmId, boatClassName, boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode, lastUpdated);
    }
}

class Helm {
    constructor(name, yearOfBirth, gender, noviceInFirstRace) {
        this.name = name;
        this.yearOfBirth = yearOfBirth;
        this.gender = gender;
        this.noviceInFirstRace = noviceInFirstRace;

        // TODO add validation here!!
    }

    static getHelmId(helm) {
        return helm.name;
    }

    static fromStoreHelm(storeHelm) {
        let {
            "Name": name,
            "Year Of Birth": yearOfBirth,
            "Gender": gender,
            "Was Novice In First Race": noviceInFirstRace,
        } = storeHelm;

        return new Helm(name, yearOfBirth, gender, noviceInFirstRace);
    }

    toStoreHelm() {
        return {
            "Name": this.name,
            "Year Of Birth": this.yearOfBirth,
            "Gender": this.gender,
            "Was Novice In First Race": this.noviceInFirstRace,
        };
    }
}

class AutoMap2 {
    constructor(getKey = JSON.stringify, getDefaultValue) {
        super();
        this.getKey = getKey;
        this.getDefaultValue = getDefaultValue;
    }

    upsert(obj, transform = (prev, obj, key) => prev) {
        let key = this.getKey(obj);
        if (!this.has(key) && this.getDefaultValue !== undefined) {
            return this.set(key, transform(this.getDefaultValue(obj, key), obj, key));
        }
        let replaceObj = transform(super.get(key), obj, key);
        this.set(key, replaceObj);
        return replaceObj;
    }
}

class Services {
    constructor() {
        this.stores = new AutoMap2(JSON.stringify, ([storeName, sheetId]) => new Store(storeName, sheetId, this));
        this.auth = auth;
    }

    getStore(storeName, sheetId) {
        return this.stores.upsert([storeName, sheetId]);
    }
}

class Helms {
    constructor(services) {
        this.store = services.getStore("Helms", sheetId);
        this.cache = new AutoMap2(Helm.getHelmId);
    }

    getHelmFromResult(result) {
        let helm = this.cache.get(Result.getHelmId(result));
        if (!helm) {
            throw new Error(`Helm ${Result.getHelmId(result)} does not exist in helm list from result:\n ${result}`);
        }
    }

    init() {
        (await this.store.getAllHelms())
            .map((storeHelm) => Helm.fromStoreHelm(storeHelm))
            .forEach((helm) => this.cache.upsert(helm));
    }

    addHelm(helm) {
        if (!this.cache.get(helm)) {
            // Cache should be consistent with store so adding helm to store first
            this.store.add()
        }

    }
}

class ServerLocalStorage {
    constructor() {
        this.localStorage = new Map();
    }

    clear() {
        this.localStorage = new Map();
    }

    getItem() {
        this.localStorage.get(key);
    }

    setItem(key, value) {
        this.localStorage.set(key, value);
    }

    getAllItems() {
        return Object.entries(this.localStorage);
    }



}

class LocalStore {
    constructor(name, sheetId, toStore, fromStore, services) {
        this.name = name;
        this.sheetId = sheetId;
        this.localStorage = new ServerLocalStorage();
    }

    clearAllRows() {
        this.localStorage.clear();
    }

    add(key, value) {
        if (this.localStorage.getItem(key)) {
            console.log("WARNING: key:${key} has multiple entries in sheet:${name}")
        }
        this.localStorage.setItem(key, value);
    }
}

class RemoteStore {
    constructor(name, sheetId, toStore, fromStore, getKeyFromObj, services) {
        this.loading = false;

    }
    // getAllRows
    // appendRows
    // replaceAllRows
    // updateRow
    // updateChanged
    // appendNew

    async getAllRows() {
        return await this.resolvePromise();
    }

    isLoading() {
        return this.loading;
    }

    async resolvePromise(promise) {
        if (this.isLoading()) {
            throw new Error("Only one operation can be performed on remote store at a time.");
        }
        this.loading = true;
        let result = await promise;
        this.loading = false;
        return result;
    }
}

class Store {
    constructor(name, sheetId, toStore, fromStore, getKeyFromObj, services) {
        this.services = services;
        this.fromStore = fromStore;
        this.getKeyFromObj = getKeyFromObj;
        this.cache = new AutoMap2();
        this.localStore = services.localStorage;
        this.remoteStore = services.remoteStore;

        this.localStoreHasAllRows = true;

        this.newRows;
        this.updatedRows;
        this.deletedRows;
        this.remoteRows;
        // localStorage (fast upserts)
        // google sheets store (slow )
    }

    init() {
        this.checkLoading();

    }

    add() {
        this.checkLoading();

    }

    checkLoading() {
        if (this.remoteStore.isLoading()) {
            throw new Error("Cannot mutate store whilst remote store is loading");
        }
    }

    async getAllRows() {
        let allRows = await this.remoteStore.getAllRows();
        this.localStore.clearAllRows();
        this.remoteRows = allRows.map((row) => new StoreRow(row));
        this.remoteRows
            .forEach((row) => this.localStore.add(this.getKeyFromObj(row.getData()), row));
    }


}

class StoreRow {
    constructor({ "Last Modified": lastModfied, "Last Updated": lastUpdated, ...data }) {
        this.lastModified = lastModfied;
        this.lastUpdated = lastUpdated;
        this.data = data;
    }
}

updateSeriesResults(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

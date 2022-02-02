import auth from "./auth.js";
import { getSheetIdFromURL, getGoogleSheetDoc, parseISOString, getISOStringFromDate } from "../src/common.js"
import { LocalStorage } from "node-localstorage";
import { getRaceId } from "../src/SheetsAPI.js";

const localStorage = new LocalStorage('./backend');

// const CHECK_BACKEND_THRESHOLD_MS = 86400000;
const REFRESH_BACKEND_THRESHOLD = 200000;
const ID_SEP = "##";
const KEY_SEP = "::";

const promiseSleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

function jsDateToSheetsDate(date) {
    var sheetsEpoch = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0));
    return (date.getTime() - sheetsEpoch.getTime()) / 86400000;
}

function sheetsDateToJSDate(sheetsDateNumber) {
    var sheetsEpoch = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0));
    return new Date(sheetsDateNumber * 86400000 + sheetsEpoch.getTime());
}

function assertType(obj, Type) {
    if (typeof Type === "string") {
        if (typeof obj !== Type) {
            throw new Error(`Object is not of correct type:${Type}`);
        }
    }
    else if (!(obj instanceof Type)) {
        throw new Error(`Object is not of correct type:${Type.name}`);
    }
    return obj;
}

function parseBoolean(input) {
    return !Boolean(!input || (typeof input === "string" && input.toLowerCase() === "false"));
}

async function refactorStore() {
    const lastRefreshDate = parseISOString(localStorage.getItem("lastStateRefreshDate"));
    if (!lastRefreshDate || lastRefreshDate < (new Date()) - REFRESH_BACKEND_THRESHOLD) {
        // localStorage.clear();
    }

    const raceResultsURL = "https://docs.google.com/spreadsheets/d/1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw/edit#gid=1747234560";
    const seriesResultsURL = "https://docs.google.com/spreadsheets/d/1yngxguLyDsFHR-DLA72riRgYzF_nCrlaz01DVeEolMQ/edit#gid=1432028078";

    const services = new Services(auth, getSheetIdFromURL(raceResultsURL), getSheetIdFromURL(seriesResultsURL));
    await services.init();
    localStorage.setItem("lastStateRefreshDate", (new Date()).toISOString());
    services.helms.mapHelms((helm) => console.log(`${helm.name}`));
}

class Helms {
    constructor(store) {
        this.store = store;
    }

    // getHelmFromResult(result) {
    // let helm = this.cache.get(Result.getHelmId(result));
    // if (!helm) {
    //     throw new Error(`Helm ${Result.getHelmId(result)} does not exist in helm list from result:\n ${result}`);
    // }
    // }

    async init() {
        await this.store.init();
    }

    mapHelms(func) {
        let helms = this.store.all();
        return helms.map((helm) => func(helm));
    }
}

class Results {
    constructor(store) {
        this.store = store;
    }

    async init() {
        await this.store.init();
    }
}

class StoreObject {
    constructor({ lastUpdated }) {
        this.lastUpdatedRemotely = !lastUpdated || assertType(lastUpdated, Date);
    }

    getLastUpdatedRemotely() {
        return this.lastUpdatedRemotely;
    }

    static fromStore({ "Last Updated": lastUpdated }) {
        return {
            lastUpdatedRemotely: parseISOString(lastUpdated)
        };
    }

    setLastUpdated(date = new Date()) {
        this.lastUpdatedLocally = getISOStringFromDate(date);
    }

    toStore() {
        return {
            "Last Updated": this.lastUpdatedLocally || this.lastUpdatedRemotely,
        };
    }
}

class Helm extends StoreObject {
    constructor(name, yearOfBirth, gender, noviceInFirstRace, metaData) {
        super(metaData)
        this.name = assertType(name, "string");
        this.yearOfBirth = assertType(yearOfBirth, "number");
        this.gender = assertType(gender, "string");
        this.noviceInFirstRace = assertType(noviceInFirstRace, "boolean");
    }

    static getId(helm) {
        assertType(helm, Helm);
        return helm.name;
    }

    static fromStore(storeHelm) {
        let {
            "Name": name,
            "Year Of Birth": yearOfBirth,
            "Gender": gender,
            "Was Novice In First Race": noviceInFirstRace,
        } = storeHelm;

        return new Helm(name, parseInt(yearOfBirth), gender, parseBoolean(noviceInFirstRace), StoreObject.fromStore(storeHelm));
    }

    toStore() {
        return {
            "Name": this.name,
            "Year Of Birth": this.yearOfBirth,
            "Gender": this.gender,
            "Was Novice In First Race": this.noviceInFirstRace,
            ...super.toStore(this),
        };
    }
}

class Race {
    static getRaceId(raceDate, raceNumber) {
        assertType(raceDate, Date);
        assertType(raceDate, Integer);
        return JSON.stringify([raceDate.toISOString(), raceNumber]);
    }
}

class SeriesRace extends StoreObject {
    constructor(season, series, raceDate, raceNumber, lastImported, metaData) {
        super(metaData);
        this.season = assertType(season, String);
        this.series = assertType(series, String);
        this.raceDate = assertType(raceDate, Date);
        this.raceNumber = assertType(raceNumber, "number");
        this.lastImported = assertType(lastImported, Date);
        // TODO add validation here!!
    }

    static getRaceIdFromSeriesRace(seriesRace) {
        return getRaceId(seriesRace.raceDate, seriesRace.raceNumber);
    }

    static fromStore(storeSeriesRace) {
        let {
            Season: season,
            Series: series,
            "Race Date": date,
            "Race Number": raceNumber,
            "Last Imported": lastImported
        } = storeSeriesRace;

        return new SeriesRace(season, series, date, raceNumber, lastImported, StoreObject.fromStore(storeHelm));
    }

    toStore() {
        return {
            Season: this.season,
            Series: this.series,
            "Race Date": this.raceDate,
            "Race Number": this.raceNumber,
            "Last Imported": this.lastImported,
            ...super.toStore(this),
        };
    }
}

class Result extends StoreObject {
    constructor(date, raceNumber, helmId, boatClassName, boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode, metadata) {
        super(metadata);
        this.date = assertType(date, Date);
        this.raceNumber = assertType(raceNumber, "number");
        this.helmId = assertType(helmId, "string");
        this.boatClassName = assertType(boatClassName, "string");
        this.boatSailNumber = assertType(boatSailNumber, "number");
        this.laps = assertType(laps, "number");
        this.pursuitFinishPosition = assertType(pursuitFinishPosition, "number");
        this.finishTime = assertType(finishTime, "number");
        this.finishCode = assertType(finishCode, "string");
        // TODO add validation here!!
    }

    static getHelmId(result) {
        return result.helmId;
    }

    static getId(result) {
        return JSON.stringify({
            helmId: result.helmId,
            date: result.date,
            raceNumber: result.raceNumber,
        });
    }

    static fromStore(storeResult) {
        let {
            "Date": dateString,
            "Race Number": raceNumber,
            "Helm": helmId,
            "Sail Number": boatSailNumber,
            "Class": boatClassName,
            "Laps": laps,
            "Pursuit Finish Position": pursuitFinishPosition,
            "Finish Time": finishTime,
            "Finish Code": finishCode,
            "Last Updated": lastUpdated,
        } = storeResult;

        return new Result(dateString, raceNumber, helmId, boatClassName, boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode, StoreObject.fromStore(storeResult));
    }

    toStore() {
        return {
            "Date": this.date,
            "Race Number": this.raceNumber,
            "Helm": this.helmId,
            "Sail Number": this.boatSailNumber,
            "Class": this.boatClassName,
            "Laps": this.laps,
            "Pursuit Finish Position": this.pursuitFinishPosition,
            "Finish Time": this.finishTime,
            "Finish Code": this.finishCode,
            "Last Updated": this.lastUpdated,
        };
    }
}

class RemoteStore {
    constructor(sheetsDoc, sheetName) {
        this.sheetsDoc = sheetsDoc;
        this.sheetName = sheetName;
    }

    async getAllRows() {
        const sheet = this.sheetsDoc.sheetsByTitle[this.sheetName];
        if (!sheet) {
            throw new Error(`Couldn't get sheet named ${this.sheetName}, check it exists in the spreadsheet`);
        }
        return await sheet.getRows();
    }

    static async createRemoteStore(promiseSheetsDoc, sheetName) {
        while (true) {
            try {
                return new RemoteStore(await promiseSheetsDoc, sheetName);
            }
            catch (err) {
                if (err?.code !== "ENOTFOUND") {
                    throw err;
                }
                console.log("No network connection for remote store.. waiting 10s and trying again.");
                await promiseSleep(10000);
            }
        }
    }
}

class Services {
    constructor(auth, raceResultsSheetId, seriesResultsSheetId) {
        this.stores = new Map();
        this.sheetsDoc = new Map();
        this.sheetsDoc.set(
            raceResultsSheetId,
            getGoogleSheetDoc(raceResultsSheetId, auth.clientEmail, auth.privateKey)
        );
        this.helms = new Helms(this.getStore("Helms", Helm, raceResultsSheetId));
        this.results = new Results(this.getStore("Fleet Race Results", Result, raceResultsSheetId));

        this.auth = auth;
    }

    getStore(storeName, ObjectType, sheetId) {
        // Note: Keyed off storeName and not sheetId, so cannot have more than one store of same name.
        if (!this.stores.has(storeName)) {
            this.stores.set(storeName, new Store(storeName, this.sheetsDoc.get(sheetId), (thing) => thing.toStore(), ObjectType.fromStore, ObjectType.getId, this));
        }
        return this.stores.get(storeName);
    }

    async init() {
        await this.helms.init();
        await this.results.init();
    }
}

class LocalStore {
    constructor(storeName, toStore, fromStore) {
        this.storeName = storeName;
        this.localStorage = localStorage;
        this.toStore = toStore;
        this.fromStore = fromStore;
        this.cache = new Map();
        this.promiseReady = this.init();
        this.promiseReady
            .catch((err) => console.log(err));
    }

    keyToStoreKey(key) {
        return [this.storeName, key].join(KEY_SEP);
    }

    storeKeyToKey(storeKey) {
        const components = storeKey.split(`${this.storeName}${KEY_SEP}`);
        return components[1];
    }

    add(key, value) {
        if (this.cache.has(key)) {
            throw new Error(`Cannot add object with key ${key} to store as it already exists`);
        }
        this.cache.set(key, value);
        this.addToLocalStorage(key, this.toStore(value))
            .catch((err) => console.log(err));
    }

    async addToLocalStorage(key, value) {
        let storeKey = this.keyToStoreKey(key);
        if (this.localStorage.getItem(storeKey)) {
            throw new Error(`Attempting to add object with key ${key} to local storage when it already exists`);
        }
        this.localStorage.setItem(storeKey, JSON.stringify(value));
    }

    getAll() {
        return [...this.cache.values()];
    }

    async init() {
        this.fillCache();
    }

    fillCache() {
        // const keys = Object.keys(this.localStorage);
        const keys = this.localStorage._keys;
        let i = keys.length;

        while (i--) {
            let key = this.storeKeyToKey(keys[i]);
            if (!key) {
                continue;
            }
            this.cache.set(key, this.fromStore(JSON.parse(this.localStorage.getItem(keys[i]))));
        }
    }
}

class Store {
    constructor(storeName, sheetsDoc, toStore, fromStore, getKeyFromObj, services) {
        this.storeName = storeName;
        this.services = services;
        this.fromStore = fromStore;
        this.getKeyFromObj = getKeyFromObj;
        this.localStore = new LocalStore(storeName, toStore, fromStore, getKeyFromObj);
        this.promiseRemoteStore = RemoteStore.createRemoteStore(sheetsDoc, storeName)
            .then((remoteStore) => this.remoteStore = remoteStore);
    }

    async init() {
        await this.localStore.promiseReady;
        let [localStoreObjects] = this.pullLocalState();
        let localStateEmpty = !localStoreObjects.length;
        if (localStateEmpty) {
            await this.promiseRemoteStore;
            let [remoteStoreObjects] = await this.pullRemoteState();
            this.syncLocalStateToRemoteState(remoteStoreObjects);
        }
    }

    syncLocalStateToRemoteState(storeObjects) {
        storeObjects.forEach((storeObject) => this.localStore.add(this.getKeyFromObj(storeObject), storeObject));
    }

    pullLocalState() {
        let allRows = this.localStore.getAll();
        let lastUpdated = allRows
            .reduce((max, storeObject) => Math.max(max, storeObject.getLastUpdatedRemotely()), 0);
        return [allRows, lastUpdated];
    }

    async pullRemoteState() {
        await this.promiseRemoteStore;
        let allRows = (await this.remoteStore.getAllRows())
            .map(this.fromStore);
        let lastUpdated = allRows
            .reduce((max, storeObject) => Math.max(max, storeObject.getLastUpdatedRemotely()), 0);
        return [allRows, lastUpdated];
    }

    all() {
        debugger;
        return this.localStore.getAll();
    }
}

refactorStore(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

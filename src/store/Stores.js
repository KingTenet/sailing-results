import { getGoogleSheetDoc } from "../common.js"
import StoreWrapper from "./StoreWrapper.js";
import SeriesRace from "./SeriesRace.js";
import Helm from "./Helm.js";
import Result from "./Result.js";
import { parseISOString } from "../common.js"
import { LocalStorage } from "node-localstorage";
const localStorage = new LocalStorage('./backend');
global.localStorage = localStorage;

const REFRESH_BACKEND_THRESHOLD = 200000;

export default class Stores {
    constructor(auth, raceResultsSheetId, seriesResultsSheetId) {
        this.stores = new Map();
        this.raceResultsDocument = getGoogleSheetDoc(raceResultsSheetId, auth.clientEmail, auth.privateKey);
        this.seriesResultsDocument = getGoogleSheetDoc(seriesResultsSheetId, auth.clientEmail, auth.privateKey);
        this.auth = auth;
    }

    async init() {
        this.helms = await StoreWrapper.create("Helms", this.raceResultsDocument, this, Helm);
        const getResultFromStore = (storeResult) => Result.fromStore(storeResult, (helmId) => this.helms.get(helmId));
        this.results = await StoreWrapper.create("Fleet Race Results", this.raceResultsDocument, this, Result, getResultFromStore);
        this.seriesRaces = await StoreWrapper.create("Seasons/Series", this.seriesResultsDocument, this, SeriesRace);
    }

    static async create(auth, raceResultsSheetId, seriesResultsSheetId) {
        const lastRefreshDate = parseISOString(localStorage.getItem("lastStateRefreshDate"));
        if (!lastRefreshDate || lastRefreshDate < (new Date()) - REFRESH_BACKEND_THRESHOLD) {
            localStorage.clear();
        }
        const stores = new Stores(auth, raceResultsSheetId, seriesResultsSheetId);
        await stores.init();
        localStorage.setItem("lastStateRefreshDate", (new Date()).toISOString());
        return stores;
    }
}
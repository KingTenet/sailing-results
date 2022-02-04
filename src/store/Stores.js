import { getGoogleSheetDoc } from "../common.js"
import StoreWrapper from "./StoreWrapper.js";
import SeriesRace from "./types/SeriesRace.js";
import Helm from "./types/Helm.js";
import Result from "./types/Result.js";
import { parseISOString } from "../common.js"
import { LocalStorage } from "node-localstorage";
import BoatClass from "./types/BoatClass.js";
const localStorage = new LocalStorage('./backend');
global.localStorage = localStorage;

const REFRESH_BACKEND_THRESHOLD = 2;

export default class Stores {
    constructor(auth, raceResultsSheetId, seriesResultsSheetId) {
        this.stores = new Map();
        this.raceResultsDocument = getGoogleSheetDoc(raceResultsSheetId, auth.clientEmail, auth.privateKey);
        this.seriesResultsDocument = getGoogleSheetDoc(seriesResultsSheetId, auth.clientEmail, auth.privateKey);
        this.auth = auth;
    }

    async init() {
        this.helms = await StoreWrapper.create("Helms", this.raceResultsDocument, this, Helm);
        this.ryaClasses = await StoreWrapper.create("RYA Full List", this.raceResultsDocument, this, BoatClass);
        this.clubClasses = await StoreWrapper.create("Club Handicaps", this.raceResultsDocument, this, BoatClass);
        // this.ryaClasses.dump();
        // return;
        const getResultFromStore = (storeResult) => Result.fromStore(
            storeResult,
            (helmId) => this.helms.get(helmId),
            (boatClass, date) =>
                this.clubClasses.has(BoatClass.getIdFromClassRaceDate(boatClass, date))
                    ? this.clubClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
                    : this.ryaClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
        );
        this.results = await StoreWrapper.create("Fleet Race Results", this.raceResultsDocument, this, Result, getResultFromStore);
        this.seriesRaces = await StoreWrapper.create("Seasons/Series", this.seriesResultsDocument, this, SeriesRace);
    }

    static async create(auth, raceResultsSheetId, seriesResultsSheetId) {
        const lastRefreshDate = parseISOString(localStorage.getItem("lastStateRefreshDate"));
        if (!lastRefreshDate || lastRefreshDate < (new Date()) - REFRESH_BACKEND_THRESHOLD) {
            // localStorage.clear();
        }
        const stores = new Stores(auth, raceResultsSheetId, seriesResultsSheetId);
        await stores.init();
        localStorage.setItem("lastStateRefreshDate", (new Date()).toISOString());
        return stores;
    }
}
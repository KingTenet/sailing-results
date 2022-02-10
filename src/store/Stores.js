import { getGoogleSheetDoc, groupBy } from "../common.js"
import StoreWrapper from "./StoreWrapper.js";
import SeriesRace from "./types/SeriesRace.js";
import Helm from "./types/Helm.js";
import Result from "./types/Result.js";
import { parseISOString } from "../common.js"
import { LocalStorage } from "node-localstorage";
import BoatClass from "./types/BoatClass.js";
import CorrectedResult from "./types/CorrectedResult.js";
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
        const getResultFromStore = (result) => Result.fromStore(
            result,
            (helmId) => this.helms.get(helmId),
            (boatClass, date) =>
                this.clubClasses.has(BoatClass.getIdFromClassRaceDate(boatClass, date))
                    ? this.clubClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
                    : this.ryaClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
        );
        // this.results = await StoreWrapper.create("Fleet Race Results", this.raceResultsDocument, this, Result, getResultFromStore);
        this.results = await StoreWrapper.create("Fleet Race Results Writeable", this.raceResultsDocument, this, Result, getResultFromStore);
        // const allResultsByRaceAsc = this.results.all().sort(Result.sortByRaceAsc);
        // const helmResultsByRaceAsc = new Map(groupBy(allResultsByRaceAsc, Result.getHelmId));
        this.seriesRaces = await StoreWrapper.create("Seasons/Series", this.seriesResultsDocument, this, SeriesRace);

        const getCorrectedResultFromStore = (result) => {
            try {
                return CorrectedResult.fromStore(result, getResultFromStore(result))
            }
            catch (err) {
                throw err;
                console.log(err);
                debugger;
            }
        };
        this.correctedResults = await StoreWrapper.create("Corrected Results", this.seriesResultsDocument, this, CorrectedResult, getCorrectedResultFromStore);
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
import { getGoogleSheetDoc, groupBy } from "../common.js"
import StoreWrapper from "./StoreWrapper.js";
import SeriesRace from "./types/SeriesRace.js";
import Helm from "./types/Helm.js";
import Result from "./types/Result.js";
import { parseISOString } from "../common.js"
import { LocalStorage } from "node-localstorage";
import BoatClass from "./types/BoatClass.js";
import CorrectedResult from "./types/CorrectedResult.js";
import RaceFinish from "./types/RaceFinish.js";
import Race from "./types/Race.js";
import { getCorrectedResultsForRace } from "../../scripts/resultCorrection.js";
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

        this.results = await StoreWrapper.create("Fleet Race Results Writeable", this.raceResultsDocument, this, Result, getResultFromStore);
        this.seriesRaces = await StoreWrapper.create("Seasons/Series", this.seriesResultsDocument, this, SeriesRace);

        const batchCorrectedResults = (storeResults) => {
            const storeOrderedResults = storeResults.map(getResultFromStore);
            const correctedResults = [];
            for (let [, raceResults] of Race.groupResultsByRaceAsc(storeOrderedResults)) {
                const raceFinish = new RaceFinish(raceResults);
                if (!raceFinish.isPursuitRace(raceResults)) {
                    getCorrectedResultsForRace(raceResults, correctedResults)
                        .forEach((result) => correctedResults.push(result));
                }
                else {
                    console.log(`Skipping pursuit race raceDate:${raceFinish.getDate()} raceNumber:${raceFinish.getNumber()}`);
                }
            }
            const correctedResultsById = new Map(groupBy(correctedResults, Result.getId));
            return storeOrderedResults.map(Result.getId).map((id) => correctedResultsById.get(id)[0]);
        }

        this.correctedResultsStore = await StoreWrapper.create("Corrected Results", this.seriesResultsDocument, this, CorrectedResult, undefined, batchCorrectedResults);
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
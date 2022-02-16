import { AutoMap, getGoogleSheetDoc, groupBy } from "../common.js"
import StoreWrapper from "./StoreWrapper.js";
import SeriesRace from "./types/SeriesRace.js";
import Helm from "./types/Helm.js";
import Result from "./types/Result.js";
import { parseISOString } from "../common.js"
import { LocalStorage } from "node-localstorage";
import BoatClass from "./types/BoatClass.js";
import CorrectedResult from "./types/CorrectedResult.js";
import Series from "./types/Series.js";
import Race from "./types/Race.js";
import RaceFinish from "./types/RaceFinish.js";
import SeriesPoints from "./types/SeriesPoints.js";
import HelmResult from "./types/HelmResult.js";
const localStorage = new LocalStorage('./backend');
global.localStorage = localStorage;

const REFRESH_BACKEND_THRESHOLD = 3600 * 1000;

export default class Stores {
    constructor(auth, raceResultsSheetId, seriesResultsSheetId) {
        this.raceResultsDocument = getGoogleSheetDoc(raceResultsSheetId, auth.clientEmail, auth.privateKey);
        this.seriesResultsDocument = getGoogleSheetDoc(seriesResultsSheetId, auth.clientEmail, auth.privateKey);
        this.auth = auth;
    }

    async init() {
        this.helms = await StoreWrapper.create("Helms", this.raceResultsDocument, this, Helm);
        this.ryaClasses = await StoreWrapper.create("RYA Full List", this.raceResultsDocument, this, BoatClass);
        this.clubClasses = await StoreWrapper.create("Club Handicaps", this.raceResultsDocument, this, BoatClass);

        const getOODsFromStore = (result) => HelmResult.fromStore(
            result,
            (helmId) => this.helms.get(helmId),
        );

        this.oods = await StoreWrapper.create("OODs", this.raceResultsDocument, this, HelmResult, getOODsFromStore);
        const oodsByRace = new Map(groupBy(this.oods.all(), HelmResult.getRaceId));
        const raceFinishes = new AutoMap(Race.getId);
        for (let [, oods] of [...oodsByRace]) {
            raceFinishes.upsert(new RaceFinish([], [], oods));
        }

        const getResultFromStore = (result) => Result.fromStore(
            result,
            (helmId) => this.helms.get(helmId),
            (boatClass, date) =>
                this.clubClasses.has(BoatClass.getIdFromClassRaceDate(boatClass, date))
                    ? this.clubClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
                    : this.ryaClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
        );

        this.purusitResults = await StoreWrapper.create("Pursuit Race Results", this.raceResultsDocument, this, Result, getResultFromStore);
        for (let [, raceResults] of Race.groupResultsByRaceAsc(this.purusitResults.all())) {
            raceFinishes.upsert(new RaceFinish(raceResults, [], []));
        }

        this.results = await StoreWrapper.create("Fleet Race Results", this.raceResultsDocument, this, Result, getResultFromStore);
        // this.results = await StoreWrapper.create("Debug", this.raceResultsDocument, this, Result, getResultFromStore);

        const allCorrectedResults = [];
        for (let [race, raceResults] of Race.groupResultsByRaceAsc(this.results.all())) {
            try {
                const raceFinish = new RaceFinish(raceResults, [...allCorrectedResults], oodsByRace.get(Race.getId(race)) || []);
                raceFinishes.upsert(raceFinish);
                allCorrectedResults.push(...raceFinish.getCorrectedResults());
            }
            catch (err) {
                throw err;
                debugger;
            }
        }

        this.raceFinishes = raceFinishes;
        this.seriesRaces = await StoreWrapper.create("Seasons/Series", this.seriesResultsDocument, this, SeriesRace);
        const allSeries = groupBy(this.seriesRaces.all(), SeriesRace.getSeriesId);

        this.seriesPoints = allSeries.map(([seriesId, seriesRaces]) => [
            seriesId,
            SeriesPoints.fromSeriesRaces(
                seriesRaces,
                seriesRaces
                    .map(SeriesRace.getRaceId)
                    .map((raceId) => raceFinishes.get(raceId))
                    .filter(Boolean)
            )]);

        this.allCorrectedResults = allCorrectedResults;

        // this.correctedResultsStore = await StoreWrapper.create("Debug out", this.seriesResultsDocument, this, CorrectedResult, getResultFromStore, undefined, true);
        // this.correctedResultsStore = await StoreWrapper.create("Corrected Results", this.seriesResultsDocument, this, CorrectedResult, getResultFromStore, undefined, true);
        // this.allCorrectedResults.forEach((result) => {
        //     this.correctedResultsStore.add(result);
        // });

        // this.seriesRaces = await StoreWrapper.create("Seasons/Series", this.seriesResultsDocument, this, SeriesRace);
        // const allSeries = groupBy(this.seriesRaces.all(), SeriesRace.getSeriesId);
        // this.seriesResults = new Map(await Promise.all(allSeries.map(async ([seriesId]) => [
        //     seriesId,
        //     await StoreWrapper.create(Series.fromId(seriesId).getSheetName(), this.seriesResultsDocument, this, CorrectedResult, getResultFromStore, undefined, true),
        // ])));
    }

    static async create(auth, raceResultsSheetId, seriesResultsSheetId, forceRefresh) {
        const lastRefreshDate = parseISOString(localStorage.getItem("lastStateRefreshDate"));
        if (forceRefresh || !lastRefreshDate || lastRefreshDate < (new Date()) - REFRESH_BACKEND_THRESHOLD) {
            localStorage.clear();
        }
        const stores = new Stores(auth, raceResultsSheetId, seriesResultsSheetId);
        await stores.init();
        localStorage.setItem("lastStateRefreshDate", (new Date()).toISOString());
        return stores;
    }
}
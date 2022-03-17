import { assertType, AutoMap, getGoogleSheetDoc, groupBy } from "../common.js"
import StoreWrapper from "./StoreWrapper.js";
import SeriesRace from "./types/SeriesRace.js";
import Helm from "./types/Helm.js";
import Result from "./types/Result.js";
import { parseISOString } from "../common.js"
import BoatClass from "./types/BoatClass.js";
import CorrectedResult from "./types/CorrectedResult.js";
import Series from "./types/Series.js";
import Race from "./types/Race.js";
// import RaceFinish from "./types/RaceFinish.js";
import SeriesPoints from "./types/SeriesPoints.js";
import HelmResult from "./types/HelmResult.js";
import bootstrapLocalStorage from "../bootstrapLocalStorage.js";
import MutableRaceFinish from "./types/MutableRaceFinish.js";
import MutableRaceResult from "./types/MutableRaceResult.js";
import SearchIndex from "../SearchIndex.js";

const REFRESH_BACKEND_THRESHOLD = 3600 * 1000;
// const REFRESH_BACKEND_THRESHOLD = 0;

export class Stores {
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

        this.purusitResults = await StoreWrapper.create("Pursuit Race Results", this.raceResultsDocument, this, Result, (storeResult) => this.deserialiseResult(storeResult));
        this.results = await StoreWrapper.create("Fleet Race Results", this.raceResultsDocument, this, Result, (storeResult) => this.deserialiseResult(storeResult));
        this.seriesRaces = await StoreWrapper.create("Seasons/Series", this.seriesResultsDocument, this, SeriesRace);
    }

    deserialiseResult(storeResult, Type = Result) {
        return Type.fromStore(
            storeResult,
            (helmId) => this.helms.get(helmId),
            (boatClass, date) =>
                this.clubClasses.has(BoatClass.getIdFromClassRaceDate(boatClass, date))
                    ? this.clubClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
                    : this.ryaClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
        );
    }

    processResults() {
        const [seriesPoints, raceFinishes, allCorrectedResults] = Stores.processResultsStatic(this.oods.all(), this.purusitResults.all(), this.results.all(), this.seriesRaces.all());
        this.raceFinishes = raceFinishes;
        this.allCorrectedResults = allCorrectedResults;
        this.seriesPoints = seriesPoints;
    }

    static processResultsStatic(allOODs, allPursuitResults, allFleetResults, allSeriesRaces) {
        const oodsByRace = new Map(groupBy(allOODs, HelmResult.getRaceId));
        const raceFinishes = new AutoMap(Race.getId);
        for (let [, oods] of [...oodsByRace]) {
            raceFinishes.upsert(MutableRaceFinish.fromOODs(oods));
        }

        for (let [, raceResults] of Race.groupResultsByRaceAsc(allPursuitResults)) {
            raceFinishes.upsert(MutableRaceFinish.fromResults(raceResults));
        }

        allFleetResults
            .filter((result) => result.hasStaleRemote())
            .forEach((result) => console.log(result));

        const allCorrectedResults = [];
        for (let [race, raceResults] of Race.groupResultsByRaceAsc(allFleetResults)) {
            try {
                if (raceResults.some((result) => result.hasStaleRemote())) {
                    console.log(`${Race.getId(race)} has stale results`);
                }
                const raceFinish = MutableRaceFinish.fromResults(raceResults, [...allCorrectedResults], oodsByRace.get(Race.getId(race)) || []);

                raceFinishes.upsert(raceFinish);
                allCorrectedResults.push(...raceFinish.getCorrectedResults());
            }
            catch (err) {
                throw err;
            }
        }

        const allSeries = groupBy(allSeriesRaces, SeriesRace.getSeriesId);

        const seriesPoints = allSeries.map(([seriesId, seriesRaces]) => [
            seriesId,
            SeriesPoints.fromSeriesRaces(
                seriesRaces,
                seriesRaces
                    .map(SeriesRace.getRaceId)
                    .map((raceId) => raceFinishes.get(raceId))
                    .filter(Boolean)
            )]);

        return [seriesPoints, [...raceFinishes.values()], allCorrectedResults];
    }

    static async create(auth, raceResultsSheetId, seriesResultsSheetId, forceRefresh) {
        await bootstrapLocalStorage();
        const lastRefreshDate = parseISOString(localStorage.getItem("lastStateRefreshDate"));
        if (forceRefresh || !lastRefreshDate || lastRefreshDate < (new Date()) - REFRESH_BACKEND_THRESHOLD) {
            console.log("Clearing app state");
            localStorage.clear();
        }
        const stores = new Stores(auth, raceResultsSheetId, seriesResultsSheetId);
        await stores.init();
        localStorage.setItem("lastStateRefreshDate", (new Date()).toISOString());
        return stores;
    }
}

export class StoreFunctions {
    constructor(stores) {
        this.stores = stores;
        this.mapRaces = this.mapRaces;
        this.getHelmsIndex = this.getHelmsIndex;
        this.getBoatIndexForRace = this.getBoatIndexForRace;
        this.createRegisteredHelm = this.createRegisteredHelm;
        this.deserialiseResult = this.deserialiseResult;
        this.assertResultNotStored = this.assertResultNotStored;
        this.createHelmFinish = this.createHelmFinish;
        this.deserialiseRegistered = this.deserialiseRegistered;
        this.getRaceFinishForResults = this.getRaceFinishForResults;
        this.getRaceFinishForRace = this.getRaceFinishForRace;
        this.isRaceMutable = this.isRaceMutable;
    }

    static async create(auth, raceResultsSheetId, seriesResultsSheetId, forceRefresh) {
        const stores = await Stores.create(auth, raceResultsSheetId, seriesResultsSheetId, forceRefresh);
        return new StoreFunctions(stores);
    }

    isRaceMutable(raceDate, raceNumber) {
        assertType(raceDate, Date);
        assertType(raceNumber, "number");
        const raceToCheck = new Race(raceDate, raceNumber);

        debugger;
        return Race.groupResultsByRaceAsc(this.stores.results.all())
            .filter(([race]) => Race.getId(race) === Race.getId(raceToCheck))
            .reduce((_, [, results]) => !results.length, true);
    }

    mapRaces(func = (race) => race) {
        const storedPursuitResults = this.stores.purusitResults.all();
        const storedFleetResults = this.stores.results.all();
        return Race.groupResultsByRaceAsc([...storedPursuitResults, ...storedFleetResults])
            .map(([race]) => race)
            .map(func);
    }

    getHelmsIndex(helms = []) {
        return new SearchIndex([...this.stores.helms.all(), ...helms], "name");
    }

    getBoatIndexForRace(race, boats = []) {
        const boatsByYear = groupBy([...this.stores.ryaClasses.all(), ...boats], BoatClass.getClassYear);
        const boatIndexesByYear = new Map(boatsByYear.map(([classYear, boats]) => [classYear, new SearchIndex(boats, "className")]));
        return boatIndexesByYear.get(BoatClass.getClassYearForRaceDate(race.getDate()));
    }

    createRegisteredHelm(race, helm, boatClass, boatSailNumber) {
        const result = MutableRaceResult.fromUser(
            race,
            this.stores.helms.get(Helm.getId(helm)),
            this.stores.ryaClasses.get(BoatClass.getId(boatClass)),
            boatSailNumber,
        );
        this.assertResultNotStored(result);
        return result;
    }

    createHelmFinish(mutableResult, laps, pursuitFinishPosition, finishTime, finishCode) {
        const result = Result.fromMutableRaceResult(mutableResult, laps, pursuitFinishPosition, finishTime, finishCode);
        this.assertResultNotStored(result);
        return result;
    }

    assertResultNotStored(result) {
        try {
            this.stores.getResultFromStoreResult(HelmResult.getId(result));
            throw new Error("Result exists");
        }
        catch (err) {
            return true;
        }
    }

    deserialiseRegistered(storedRegistered) {
        // TODO - add error handling
        // missing helm/boat
        // existing result
        const registered = this.stores.deserialiseResult(storedRegistered, MutableRaceResult);
        this.assertResultNotStored(registered);
        return registered;
    }

    deserialiseResult(storeResult) {
        // TODO - add error handling
        // missing helm/boat
        // existing result
        const result = this.stores.deserialiseResult(storeResult);
        this.assertResultNotStored(result);
        return result;
    }

    getRaceFinishForRace(race) {
        const storedOODs = this.stores.oods.all();
        const storedPursuitResults = this.stores.purusitResults.all();
        const storedFleetResults = this.stores.results.all();
        const storedSeriesRaces = this.stores.seriesRaces.all();

        const [seriesPoints, raceFinishes, allCorrectedResults] = Stores.processResultsStatic(
            storedOODs,
            storedPursuitResults,
            storedFleetResults,
            storedSeriesRaces,
        );

        return raceFinishes.find((raceFinish) => Race.getId(raceFinish) === Race.getId(race));
    }

    getRaceFinishForResults(race, mutableResults = [], mutableOODs = [], mutableSeriesRaces = []) {
        const raceId = Race.getId(race);

        if (mutableResults.some((result) => Race.getId(result.getRace()) !== raceId)) {
            throw new Error("All results must be from same race");
        }

        const mutableFleetResults = mutableResults.length && Race.isPursuitRace(mutableResults) ? [] : mutableResults;
        const mutablePursuitResults = mutableResults.length && Race.isPursuitRace(mutableResults) ? mutableResults : [];

        const storedOODs = this.stores.oods.all();
        const storedPursuitResults = this.stores.purusitResults.all();
        const storedFleetResults = this.stores.results.all();
        const storedSeriesRaces = this.stores.seriesRaces.all();

        const [seriesPoints, raceFinishes, allCorrectedResults] = Stores.processResultsStatic(
            [...storedOODs, ...mutableOODs],
            [...storedPursuitResults, ...mutablePursuitResults],
            [...storedFleetResults, ...mutableFleetResults],
            [...storedSeriesRaces, ...mutableSeriesRaces]
        );

        return raceFinishes.find((raceFinish) => Race.getId(raceFinish) === raceId);
    }
}
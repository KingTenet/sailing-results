import { assertType, AutoMap, getGoogleSheetDoc, groupBy, parseURLDate, promiseSleep, mapGroupBy } from "../common.js"
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

const REFRESH_BACKEND_THRESHOLD = 86400 * 1000; // 1 DAY
// const REFRESH_BACKEND_THRESHOLD = 10 * 1000; // 10 SECONDS

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

    // deserialiseOOD(oodResult) {
    //     return HelmResult.fromStore(
    //         storeResult,
    //         (helmId) => this.helms.get(helmId),
    //         (boatClass, date) =>
    //             this.clubClasses.has(BoatClass.getIdFromClassRaceDate(boatClass, date))
    //                 ? this.clubClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
    //                 : this.ryaClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
    //     );
    // }

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

class Indexes {
    constructor(stores) {
        this.stores = stores;
        this.setHelmCounts();
    }

    updateFromResults(results = []) {
        this.setHelmCounts(results)
        this.setBoatCounts(results);
        this.setSailNumberCounts(results);
    }

    getAllResults(results = []) {
        return [
            ...this.stores.results.all(),
            ...this.stores.purusitResults.all(),
            ...results
        ];
    }

    setHelmCounts(results = []) {
        this.helms = new Map(Indexes.getHelmCounts(this.getAllResults(results)));
    }

    setBoatCounts(results = []) {
        this.boats = new Map(Indexes.getBoatCounts(this.getAllResults(results)));
        this.boatsByHelm = Indexes.getBoatsForHelm(this.getAllResults(results));
    }

    setSailNumberCounts(results = []) {
        this.sailNumbersByHelmBoat = Indexes.getSailNumbersForHelmBoat(this.getAllResults(results));
        this.sailNumbersByBoat = Indexes.getSailNumbersForBoat(this.getAllResults(results));
    }

    getHelmsIndex(excludedHelms = []) {
        const helmIdsToExclude = excludedHelms.map(Helm.getId);

        const getScore = (count, time) => {
            if (count > 2) {
                return time;
            }
            return count;
        }

        const sortCountsByScore = (helmCounts) => {
            return helmCounts.map(([helmId, values]) => [this.stores.helms.get(helmId), values])
                .map(([helm, [count, time]]) => [helm, [count, new Date(time), getScore(count, time)]])
                .sort(([, [, , scoreA]], [, [, , scoreB]]) => scoreB - scoreA);
        }

        // Sorted by score desc
        const helmsByScore = sortCountsByScore([...this.helms]);

        return new SearchIndex(
            helmsByScore.map(([helm]) => helm)
                .filter((helm) => !helmIdsToExclude.includes(Helm.getId(helm))),
            "name",
        );
    }

    getBoatIndexForHelmRace(helm, race) {
        const boatsByYearById = mapGroupBy(
            [...this.stores.ryaClasses.all(), ...this.stores.clubClasses.all()],
            [BoatClass.getClassYear, BoatClass.getId],
            (boatClasses) => boatClasses[0]
        );

        const boatsByYear = mapGroupBy(
            [...this.stores.ryaClasses.all(), ...this.stores.clubClasses.all()],
            [BoatClass.getClassYear]
        );

        const classYear = BoatClass.getClassYearForRaceDate(race.getDate());
        const allClassesForYearById = boatsByYearById.get(classYear);
        const allClassesForYear = boatsByYear.get(classYear);

        const getScore = (count, time) => {
            if (count > 2) {
                return time;
            }
            return count;
        }

        const sortCountsByScore = (boatCounts) => {
            return boatCounts.map(([boatId, values]) => [allClassesForYearById.get(boatId), values])
                .filter(([boatClass]) => boatClass)
                .map(([boatClass, [count, time]]) => [boatClass, [count, new Date(time), getScore(count, time)]])
                .sort(([, [, , scoreA]], [, [, , scoreB]]) => scoreB - scoreA);
        }

        // Sorted by score desc
        const boatsForHelmByScore = sortCountsByScore(this.boatsByHelm.get(Helm.getId(helm)) || []);
        const uniqueBoatClassesForHelm = new Set(boatsForHelmByScore.map(([boat]) => boat.getClassName()));
        const allBoatsByScore = sortCountsByScore([...this.boats]).filter(([boat]) => !uniqueBoatClassesForHelm.has(boat.getClassName()));
        const allUniqueBoatClasses = new Set(allBoatsByScore.map(([boat]) => boat.getClassName()));

        const remainingClasses = allClassesForYear.filter((boat) => !uniqueBoatClassesForHelm.has(boat.getClassName()) && !allUniqueBoatClasses.has(boat.getClassName()))

        return new SearchIndex(
            [
                ...boatsForHelmByScore.map(([boatClass]) => boatClass),
                ...allBoatsByScore.map(([boatClass]) => boatClass),
                ...remainingClasses,
            ],
            "className",
        );
    }

    getSailNumberIndexForHelmBoat(helm, boat) {
        const getScore = (count, time) => {
            if (count > 2) {
                return time;
            }
            return count;
        }

        const getSailNumbersByBoat = (helm, boat) => {
            const sailNumbersByBoat = this.sailNumbersByHelmBoat.get(Helm.getId(helm))
                || this.sailNumbersByBoat;

            if (sailNumbersByBoat.has(boat.getClassName())) {
                return sailNumbersByBoat.get(boat.getClassName());
            }

            return [];
        };

        // Sorted by score desc
        const sailNumbers = getSailNumbersByBoat(helm, boat)
            .map(([sailNumber, [count, time]]) => [sailNumber, [count, new Date(time), getScore(count, time)]])
            .sort(([, [, , scoreA]], [, [, , scoreB]]) => scoreB - scoreA);

        return new SearchIndex(
            sailNumbers.map(([sailNumber, [count, date, score]], key) => ({ sailNumber: `${sailNumber}`, date, count, rank: (sailNumbers.length - key) / sailNumbers.length, score })),
            "sailNumber",
            (searchScore, { rank }) => Math.min(searchScore + rank, 0),
        );
    }

    static getSailNumberCounts(boatResults) {
        const sailNumberCounts = new AutoMap((result) => result.getSailNumber(), () => [0, 0]);
        for (let result of boatResults) {
            sailNumberCounts.upsert(result, ([count, last]) => [count + 1, Math.max(last, result.getRace().getDate().getTime())]);
        }

        return [...sailNumberCounts];
    }

    static getBoatCounts(results) {
        const boatCounts = new AutoMap(Result.getBoatClassId, () => [0, 0]);
        for (let result of results) {
            boatCounts.upsert(result, ([count, last]) => [count + 1, Math.max(last, result.getRace().getDate().getTime())]);
        }

        return [...boatCounts];
    }

    static getHelmCounts(results) {
        const helmCounts = new AutoMap(HelmResult.getHelmId, () => [0, 0]);
        for (let result of results) {
            helmCounts.upsert(result, ([count, last]) => [count + 1, Math.max(last, result.getRace().getDate().getTime())]);
        }

        return [...helmCounts];
    }

    static getBoatsForHelm(results) {
        return mapGroupBy(
            results,
            [HelmResult.getHelmId],
            Indexes.getBoatCounts,
        );
    }

    static getSailNumbersForBoat(results) {
        return mapGroupBy(
            results,
            [(result) => result.boatClass.getClassName()],
            Indexes.getSailNumberCounts,
        );
    }

    static getSailNumbersForHelmBoat(results) {
        return mapGroupBy(
            results,
            [Result.getHelmId, (result) => result.boatClass.getClassName()],
            Indexes.getSailNumberCounts,
        );
    }
}

export class StoreFunctions {
    constructor(stores, superUser, editableRaceDate) {
        this.stores = stores;
        this.getRaces = this.getRaces;
        this.getHelmsIndex = this.getHelmsIndex;
        this.getBoatIndexForHelmRace = this.getBoatIndexForHelmRace;
        this.createRegisteredHelm = this.createRegisteredHelm;
        this.createOOD = this.createOOD;
        this.deserialiseResult = this.deserialiseResult;
        this.deserialiseOOD = this.deserialiseOOD;
        this.assertResultNotStored = this.assertResultNotStored;
        this.assertOODNotStored = this.assertOODNotStored;
        this.createHelmFinish = this.createHelmFinish;
        this.deserialiseRegistered = this.deserialiseRegistered;
        this.getRaceFinishForResults = this.getRaceFinishForResults;
        this.getRaceFinishForRace = this.getRaceFinishForRace;
        this.isRaceMutable = this.isRaceMutable;
        this.isRaceEditableByUser = this.isRaceEditableByUser;
        this.getSailNumberIndexForHelmBoat = this.getSailNumberIndexForHelmBoat;
        this.setSailNumberCounts = this.setSailNumberCounts;
        this.commitFleetResultsForRace = this.commitFleetResultsForRace;
        this.superUser = superUser;
        this.editableRaceDate = editableRaceDate;
        this.indexes = new Indexes(this.stores);
    }

    static async create(auth, raceResultsSheetId, seriesResultsSheetId, editableRaceDateStr, superUser, forceRefresh) {
        const stores = await Stores.create(
            auth,
            raceResultsSheetId,
            seriesResultsSheetId,
            forceRefresh
        );
        return new StoreFunctions(
            stores,
            superUser,
            editableRaceDateStr && parseURLDate(editableRaceDateStr)
        );
    }

    async commitFleetResultsForRace(race, results, oods) {
        await promiseSleep(0);
        this.getRaceFinishForResults(race, results);
        for (let result of results) {
            this.stores.results.add(result);
        }
        for (let ood of oods) {
            this.stores.oods.add(ood);
        }
        await this.stores.results.sync();
        await this.stores.oods.sync();
    }

    isRaceEditableByUser(race) {
        if (this.superUser) {
            return true;
        }
        return this.editableRaceDate && race.getDate().getTime() === this.editableRaceDate.getTime();
    }

    isRaceMutable(raceDate, raceNumber) {
        assertType(raceDate, Date);
        assertType(raceNumber, "number");
        const raceToCheck = new Race(raceDate, raceNumber);

        return Race.groupResultsByRaceAsc(this.stores.results.all())
            .filter(([race]) => Race.getId(race) === Race.getId(raceToCheck))
            .filter(([race]) => this.isRaceEditableByUser(race))
            .reduce((_, [, results]) => !results.length, true);
    }

    getRaces() {
        const storedPursuitResults = this.stores.purusitResults.all();
        const storedFleetResults = this.stores.results.all();
        const immutableRaces = Race.groupResultsByRaceAsc([...storedPursuitResults, ...storedFleetResults])
            .map(([race]) => race);

        const mutableRaces = this.stores.seriesRaces.all()
            .map((seriesRace) => seriesRace.getRace())
            .filter((race) => !immutableRaces.find((immutable) => Race.getId(race) === Race.getId(immutable)))
            .sort((a, b) => a.sortByRaceAsc(b));
        return [mutableRaces, immutableRaces];
    }

    createOOD(race, helm) {
        const ood = HelmResult.fromHelmRace(
            this.stores.helms.get(Helm.getId(helm)),
            race
        );
        this.assertOODNotStored(ood);
        return ood;
    }

    createRegisteredHelm(race, helm, boatClass, boatSailNumber) {
        const result = MutableRaceResult.fromUser(
            race,
            this.stores.helms.get(Helm.getId(helm)),
            this.stores.clubClasses.has(BoatClass.getId(boatClass))
                ? this.stores.clubClasses.get(BoatClass.getId(boatClass))
                : this.stores.ryaClasses.get(BoatClass.getId(boatClass)),
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

    assertOODNotStored(helmResult) {
        class ResultExistsError extends Error { };
        try {
            const resultId = HelmResult.getId(helmResult);
            const existing = this.stores.OODS.get(resultId);
            throw new ResultExistsError();
        }
        catch (err) {
            if (err instanceof ResultExistsError) {
                throw err;
            }
            return true;
        }
    }

    assertResultNotStored(helmResult) {
        class ResultExistsError extends Error { };
        try {
            const resultId = HelmResult.getId(helmResult);
            const existing = this.stores.OODS.has(resultId)
                ? this.purusitresultsResults.get(resultId)
                : this.purusitResults.get(resultId);
            throw new ResultExistsError();
        }
        catch (err) {
            if (err instanceof ResultExistsError) {
                throw err;
            }
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

    deserialiseOOD(storeOOD) {
        // TODO - add error handling
        // missing helm/boat
        // existing result
        const ood = this.stores.deserialiseResult(storeOOD, HelmResult);
        this.assertOODNotStored(ood);
        return ood;
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
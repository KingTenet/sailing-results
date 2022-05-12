import { assertType, AutoMap, getGoogleSheetDoc, groupBy, parseURLDate, promiseSleep, mapGroupBy, isOnline } from "../common.js"
import StoreWrapper from "./StoreWrapper.js";
import SeriesRace from "./types/SeriesRace.js";
import Helm from "./types/Helm.js";
import Result from "./types/Result.js";
import { parseISOString } from "../common.js"
import BoatClass from "./types/BoatClass.js";
import CorrectedResult from "./types/CorrectedResult.js";
import Series from "./types/Series.js";
import Race from "./types/Race.js";
import SeriesPoints from "./types/SeriesPoints.js";
import HelmResult from "./types/HelmResult.js";
import bootstrapLocalStorage from "../bootstrapLocalStorage.js";
import MutableRaceFinish from "./types/MutableRaceFinish.js";
import MutableRaceResult from "./types/MutableRaceResult.js";
import SearchIndex from "../SearchIndex.js";
import ClubMember from "./types/ClubMember.js";

// const REFRESH_BACKEND_THRESHOLD = 8640000 * 1000; // 100 DAY
const REFRESH_BACKEND_THRESHOLD = 86400 * 1000; // 1 DAY
// const REFRESH_BACKEND_THRESHOLD = 10 * 1000; // 10 SECONDS

export class Stores {
    constructor(auth, raceResultsSheetId, seriesResultsSheetId) {
        this.raceResultsDocument = () => getGoogleSheetDoc(raceResultsSheetId, auth.clientEmail, auth.privateKey);
        this.seriesResultsDocument = () => getGoogleSheetDoc(seriesResultsSheetId, auth.clientEmail, auth.privateKey);
        this.auth = auth;
    }

    async init() {
        await promiseSleep(10); // Required to get spinner to render!?
        const started = Date.now();
        console.log(`Started loading`);
        const promiseClubMembers = StoreWrapper.create("Active Membership", this.raceResultsDocument, this, ClubMember);;
        const promiseHelms = StoreWrapper.create("Helms", this.raceResultsDocument, this, Helm);

        const promiseRYAClasses = StoreWrapper.create("RYA Full List", this.raceResultsDocument, this, BoatClass);
        const promiseClubClasses = StoreWrapper.create("Club Handicaps", this.raceResultsDocument, this, BoatClass);
        const promiseSeriesRaces = StoreWrapper.create("Seasons/Series", this.seriesResultsDocument, this, SeriesRace);

        const [clubMembers, helms, ryaClasses, clubClasses, seriesRaces] = await Promise.all([promiseClubMembers, promiseHelms, promiseRYAClasses, promiseClubClasses, promiseSeriesRaces]);
        this.clubMembers = clubMembers;
        this.helms = helms;
        this.ryaClasses = ryaClasses;
        this.clubClasses = clubClasses;
        this.seriesRaces = seriesRaces;

        const getOODsFromStore = (result) => HelmResult.fromStore(
            result,
            (helmId) => this.helms.get(helmId),
        );

        const promiseOODs = StoreWrapper.create("OODs", this.raceResultsDocument, this, HelmResult, getOODsFromStore);
        const promisePursuitResults = StoreWrapper.create("Pursuit Race Results", this.raceResultsDocument, this, Result, (storeResult) => this.deserialiseResult(storeResult));
        const promiseFleetResults = StoreWrapper.create("Fleet Race Results", this.raceResultsDocument, this, Result, (storeResult) => this.deserialiseResult(storeResult));
        const [oods, pursuitResults, fleetResults] = await Promise.all([promiseOODs, promisePursuitResults, promiseFleetResults]);
        this.oods = oods;
        this.pursuitResults = pursuitResults;
        this.results = fleetResults;

        const clubMembersByName = mapGroupBy(this.clubMembers.all(), [ClubMember.getId]);
        this.helms.all()
            .filter((helm) => !clubMembersByName.has(Helm.getId(helm)))
            .forEach((helm) => console.log(`Helm not current member ${Helm.getId(helm)}`));


        console.log(`Loaded results in ${Math.round(Date.now() - started)} ms`);
        this.processResults();
    }

    getStatus() {
        return Object.entries(this)
            .filter(([, store]) => store instanceof StoreWrapper)
            .reduce((acc, [, { store }]) => ({ ...acc, [store.storeName]: store.storesInSync() }), {});
    }

    async syncroniseStore(storeName) {
        const [, store] = Object.entries(this)
            .filter(([, store]) => store instanceof StoreWrapper)
            .find(([, { store }]) => store.storeName === storeName);

        await store.sync();
    }

    deserialiseResult(storeResult, newHelms = [], Type = Result) {
        return Type.fromStore(
            storeResult,
            (helmId) => this.getHelmFromHelmId(helmId, newHelms),
            (boatClass, date) =>
                this.clubClasses.has(BoatClass.getIdFromClassRaceDate(boatClass, date))
                    ? this.clubClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
                    : this.ryaClasses.get(BoatClass.getIdFromClassRaceDate(boatClass, date))
        );
    }

    getHelmFromHelmId(helmId, newHelms = []) {
        if (this.helms.has(helmId)) {
            return this.helms.get(helmId);
        }
        const newHelm = newHelms.find((newHelm) => Helm.getId(newHelm) === helmId);
        if (!newHelm) {
            throw new Error("Helm didn't exist in store or new helms");
        }
        return newHelm;
    }

    deserialiseHelm(storeHelm) {
        return Helm.fromStore(storeHelm);
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

    getRaceFinishes() {
        return this.raceFinishes;
    }

    getRaceFinish(race) {
        assertType(race, Race);
        const raceId = Race.getId(race);
        return this.raceFinishes.find((raceFinish) => Race.getId(raceFinish) === raceId);
    }

    processResults(tranformResults) {
        const [seriesPoints, raceFinishes, allCorrectedResults] = Stores.processResultsStatic(this.oods.all(), this.pursuitResults.all(), this.results.all(), this.seriesRaces.all(), tranformResults);
        this.raceFinishes = raceFinishes;
        // this.raceFinishesMap = new Map(raceFinishes);
        this.allCorrectedResults = allCorrectedResults;
        this.seriesPoints = seriesPoints;
    }

    static processResultsStatic(allOODs, allPursuitResults, allFleetResults, allSeriesRaces, transformResults = (results) => results, previousRaceFinishes = [], previousCorrectedResults = []) {
        console.log(`Started processing: OODs:${allOODs.length}, Fleet results:${allFleetResults.length}, Pursuit Results:${allPursuitResults.length} Series Races:${allSeriesRaces.length}`);
        const started = Date.now();
        const oodsByRace = new Map(groupBy(allOODs, HelmResult.getRaceId));
        const raceFinishes = new AutoMap(Race.getId);

        for (let raceFinish of previousRaceFinishes) {
            raceFinishes.upsert(raceFinish);
        }

        for (let [, oods] of [...oodsByRace]) {
            // This assigns oods to races, but will be replaced if helms also sailed in that race too.
            raceFinishes.upsert(MutableRaceFinish.fromOODs(oods));
        }

        for (let [race, raceResults] of Race.groupResultsByRaceAsc(transformResults(allPursuitResults))) {
            raceFinishes.upsert(MutableRaceFinish.fromResults(raceResults, undefined, oodsByRace.get(Race.getId(race)) || []));
        }

        const allCorrectedResults = [...previousCorrectedResults];
        for (let [race, raceResults] of Race.groupResultsByRaceAsc(transformResults(allFleetResults))) {
            const raceFinish = MutableRaceFinish.fromResults(raceResults, [...allCorrectedResults], oodsByRace.get(Race.getId(race)) || []);

            raceFinishes.upsert(raceFinish);
            allCorrectedResults.push(...raceFinish.getCorrectedResults());
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

        const allProcesssed = [seriesPoints, [...raceFinishes.values()], allCorrectedResults];
        console.log(`Finished processing results in ${Math.round(Date.now() - started)} ms`);

        return allProcesssed;
    }

    static async create(auth, raceResultsSheetId, seriesResultsSheetId, forceRefresh) {
        await bootstrapLocalStorage();
        const lastRefreshDate = parseISOString(localStorage.getItem("lastStateRefreshDate"));
        if (isOnline() && (forceRefresh || !lastRefreshDate || lastRefreshDate < (new Date()) - REFRESH_BACKEND_THRESHOLD)) {
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
            ...this.stores.pursuitResults.all(),
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

    // getHelmsIndexOld(excludedHelms = [], newHelms = []) {
    //     const helmIdsToExclude = excludedHelms.map(Helm.getId);

    //     const getScore = (count, time) => {
    //         if (count > 2) {
    //             return time;
    //         }
    //         return count;
    //     }

    //     const sortCountsByScore = (helmCounts) => {
    //         return helmCounts.map(([helmId, values]) => [this.stores.getHelmFromHelmId(helmId, newHelms), values])
    //             .map(([helm, [count, time]]) => [helm, [count, new Date(time), getScore(count, time)]])
    //             .sort(([, [, , scoreA]], [, [, , scoreB]]) => scoreB - scoreA);
    //     }

    //     // Sorted by score desc
    //     const helmsByScore = sortCountsByScore([...this.helms]);

    //     const helmsById = helmsByScore.map(([helm]) => Helm.getId(helm));

    //     const oldHelmsWithoutResults = this.stores.helms.all().filter((oldHelm) => !helmsById.includes(Helm.getId(oldHelm)));
    //     const newHelmsWithoutResults = newHelms.filter((newHelm) => !helmsById.includes(Helm.getId(newHelm)));
    //     const helmsWithoutResultsById = [...oldHelmsWithoutResults, ...newHelmsWithoutResults].map(Helm.getId);
    //     const membersNotHelms = this.stores.clubMembers.all()
    //         .filter((clubMember) => !helmsById.includes(ClubMember.getId(clubMember)) && !helmsWithoutResultsById.includes(ClubMember.getId(clubMember)));

    //     return new SearchIndex(
    //         [...helmsByScore.map(([helm]) => helm)
    //             .filter((helm) => !helmIdsToExclude.includes(Helm.getId(helm))),
    //         ...newHelmsWithoutResults
    //             .filter((helm) => !helmIdsToExclude.includes(Helm.getId(helm))),
    //         ...oldHelmsWithoutResults
    //             .filter((helm) => !helmIdsToExclude.includes(Helm.getId(helm))),
    //         ...membersNotHelms
    //             .filter((clubMember) => !helmIdsToExclude.includes(ClubMember.getId(clubMember)))
    //         ],
    //         "name",
    //     );
    // }

    getHelmsIndex(excludedHelms = [], newHelms = []) {
        const helmIdsToExclude = excludedHelms.map(Helm.getId);

        const getScore = (count, time) => {
            if (count > 2) {
                return time;
            }
            return count;
        }

        const scoresByHelmId = new Map([...this.helms]
            .map(([helmId, [count, time]]) => [helmId, getScore(count, time)]));

        const getHelmForId = (helmId) => {
            try {
                return this.stores.getHelmFromHelmId(helmId, newHelms);
            }
            catch (err) {
                return false;
            }
        }

        return new SearchIndex(
            this.stores.clubMembers.all()
                .map((clubMember) => {
                    const helmId = ClubMember.getId(clubMember);
                    if (helmIdsToExclude.includes(helmId)) {
                        return false;
                    }
                    return [getHelmForId(helmId) || clubMember, scoresByHelmId.get(helmId) || 0]
                })
                .filter(Boolean)
                .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                .map(([helm]) => helm),
            "name",
        );
    }

    getBoatIndexForHelmRace(helm, race) {
        const boatsByYearByClassName = mapGroupBy(
            [...this.stores.ryaClasses.all(), ...this.stores.clubClasses.all()],
            [BoatClass.getClassYear, (boat) => boat.getClassName()],
            (boatClasses) => boatClasses[0]
        );

        const boatsByYear = mapGroupBy(
            [...this.stores.ryaClasses.all(), ...this.stores.clubClasses.all()],
            [BoatClass.getClassYear]
        );

        const classYear = BoatClass.getClassYearForRaceDate(race.getDate());
        const allClassesForYearByClassName = boatsByYearByClassName.get(classYear);
        const allClassesForYear = boatsByYear.get(classYear);

        const getScore = (count, time) => {
            if (count > 2) {
                return time;
            }
            return count;
        }

        const sortCountsByScore = (boatCounts) => {
            return boatCounts.map(([className, values]) => [allClassesForYearByClassName.get(className), values])
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
        const boatCounts = new AutoMap((result) => result.getBoatClass().getClassName(), () => [0, 0]);
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
        this.deserialiseHelm = this.deserialiseHelm;
        this.assertResultNotStored = this.assertResultNotStored;
        this.assertOODNotStored = this.assertOODNotStored;
        this.createHelmFinish = this.createHelmFinish;
        this.deserialiseRegistered = this.deserialiseRegistered;
        this.getRaceFinishForResults = this.getRaceFinishForResults;
        this.isRaceMutable = this.isRaceMutable;
        this.isRaceEditableByUser = this.isRaceEditableByUser;
        this.getSailNumberIndexForHelmBoat = this.getSailNumberIndexForHelmBoat;
        this.setSailNumberCounts = this.setSailNumberCounts;
        this.commitFleetResultsForRace = this.commitFleetResultsForRace;
        this.commitNewHelmsForResults = this.commitNewHelmsForResults;
        this.getResultsOODsForRace = this.getResultsOODsForRace;
        this.createHelmFromClubMember = this.createHelmFromClubMember;
        this.assertHelmNotStored = this.assertHelmNotStored;
        this.getStoresStatus = this.getStoresStatus;
        this.updateStoresStatus = this.updateStoresStatus;
        this.syncroniseStore = this.syncroniseStore;
        this.reprocessStoredResults = this.reprocessStoredResults;
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

    reprocessStoredResults() {
        return this.stores.processResults();
    }

    updateStoresStatus() {
        this.storesStatus = this.stores.getStatus();
    }

    syncroniseStore(storeName) {
        return this.stores.syncroniseStore(storeName);
    }

    getStoresStatus() {
        if (!this.storesStatus) {
            this.updateStoresStatus();
        }
        return this.storesStatus;
    }

    async commitNewHelmsForResults(race, results, oods, newHelms) {
        await promiseSleep(0);
        const [raceResults, raceOODs] = this.getResultsOODsForRace(race, results, oods);
        const newHelmsById = mapGroupBy(newHelms, [Helm.getId]);
        const helmsToCommit = new AutoMap(Helm.getId);
        for (let result of raceResults) {
            if (newHelmsById.has(Result.getHelmId(result))) {
                helmsToCommit.upsert(result.getHelm());
            }
        }
        for (let ood of raceOODs) {
            if (newHelmsById.has(HelmResult.getHelmId(ood))) {
                helmsToCommit.upsert(ood.getHelm());
            }
        }
        for (let [, helm] of [...helmsToCommit]) {
            this.stores.helms.add(helm);
        }
        await this.stores.helms.sync();
        return [...helmsToCommit].map(([helmId]) => helmId);
    }

    getResultsOODsForRace(race, results, oods) {
        const raceResults = results.filter((result) => Result.getRaceId(result) === Race.getId(race));
        const raceOODs = oods.filter((ood) => Result.getRaceId(ood) === Race.getId(race));
        return [raceResults, raceOODs];
    }

    async commitFleetResultsForRace(race, results, oods) {
        await promiseSleep(0);
        const [raceResults, raceOODs] = this.getResultsOODsForRace(race, results, oods);
        this.getRaceFinishForResults(race, results);
        for (let result of raceResults) {
            this.stores.results.add(result);
        }
        for (let ood of raceOODs) {
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
        const storedPursuitResults = this.stores.pursuitResults.all();
        const storedFleetResults = this.stores.results.all();
        const immutableRaces = Race.groupResultsByRaceAsc([...storedPursuitResults, ...storedFleetResults])
            .map(([race]) => race);

        const mutableRaces = this.stores.seriesRaces.all()
            .map((seriesRace) => seriesRace.getRace())
            .filter((race) => !immutableRaces.find((immutable) => Race.getId(race) === Race.getId(immutable)))
            .sort((a, b) => a.sortByRaceAsc(b));
        return [mutableRaces, immutableRaces];
    }

    createOOD(race, helm, newHelms = []) {
        const ood = HelmResult.fromHelmRace(
            this.stores.getHelmFromHelmId(Helm.getId(helm), newHelms),
            race
        );
        this.assertOODNotStored(ood);
        return ood;
    }

    createHelmFromClubMember(clubMember, gender, noviceInFirstRace) {
        const newHelm = Helm.fromClubMember(clubMember, gender, noviceInFirstRace);
        this.assertHelmNotStored(newHelm);
        return newHelm;
    }

    createRegisteredHelm(race, helm, boatClass, boatSailNumber, newHelms = []) {
        const result = MutableRaceResult.fromUser(
            race,
            this.stores.getHelmFromHelmId(Helm.getId(helm), newHelms),
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

    assertHelmNotStored(helm) {
        class HelmExistsError extends Error { };
        try {
            const existing = this.stores.helms.get(Helm.getId(helm));
            throw new HelmExistsError();
        }
        catch (err) {
            if (err instanceof HelmExistsError) {
                throw err;
            }
            return true;
        }
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
                ? this.results.get(resultId)
                : this.pursuitResults.get(resultId);
            throw new ResultExistsError();
        }
        catch (err) {
            if (err instanceof ResultExistsError) {
                throw err;
            }
            return true;
        }
    }

    deserialiseHelm(storeHelm) {
        const helm = this.stores.deserialiseHelm(storeHelm);
        this.assertHelmNotStored(helm);
        return helm;
    }

    deserialiseRegistered(storedRegistered, newHelms = []) {
        // TODO - add error handling
        // missing helm/boat
        // existing result
        const registered = this.stores.deserialiseResult(storedRegistered, newHelms, MutableRaceResult);
        this.assertResultNotStored(registered);
        return registered;
    }

    deserialiseResult(storeResult, newHelms = []) {
        // TODO - add error handling
        // missing helm/boat
        // existing result
        const result = this.stores.deserialiseResult(storeResult, newHelms);
        this.assertResultNotStored(result);
        return result;
    }

    deserialiseOOD(storeOOD, newHelms = []) {
        // TODO - add error handling
        // missing helm/boat
        // existing result
        const ood = this.stores.deserialiseResult(storeOOD, newHelms, HelmResult);
        this.assertOODNotStored(ood);
        return ood;
    }

    getRaceFinishForResults(race, mutableResults = [], mutableOODs = [], mutableSeriesRaces = []) {
        const raceId = Race.getId(race);

        if (!mutableResults.length && !mutableOODs.length && !mutableSeriesRaces.length) {
            return this.stores.getRaceFinish(race);
        }

        if (mutableResults.some((result) => Race.getId(result.getRace()) !== raceId)) {
            throw new Error("All results must be from same race");
        }

        const mutableFleetResults = mutableResults.length && Race.isPursuitRace(mutableResults) ? [] : mutableResults;
        const mutablePursuitResults = mutableResults.length && Race.isPursuitRace(mutableResults) ? mutableResults : [];

        const storedOODs = this.stores.oods.all();
        const storedPursuitResults = this.stores.pursuitResults.all();
        const storedFleetResults = this.stores.results.all();
        const storedSeriesRaces = this.stores.seriesRaces.all();

        // const [seriesPoints, raceFinishes, allCorrectedResults] = Stores.processResultsStatic(
        //     [...storedOODs, ...mutableOODs],
        //     [...storedPursuitResults, ...mutablePursuitResults],
        //     [...storedFleetResults, ...mutableFleetResults],
        //     [...storedSeriesRaces, ...mutableSeriesRaces]
        // );

        const [seriesPoints, raceFinishes, allCorrectedResults] = Stores.processResultsStatic(
            [...storedOODs, ...mutableOODs],
            [],
            mutableFleetResults,
            storedSeriesRaces,
            undefined,
            this.stores.getRaceFinishes(),
            this.stores.allCorrectedResults,
        );

        return raceFinishes.find((raceFinish) => Race.getId(raceFinish) === raceId);
    }
}
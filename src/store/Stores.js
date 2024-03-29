import { assertType, AutoMap, groupBy, parseURLDate, promiseSleep, mapGroupBy } from "../common.js"
import StoreWrapper from "./StoreWrapper.js";
import SeriesRace from "./types/SeriesRace.js";
import Helm from "./types/Helm.js";
import Result from "./types/Result.js";
import { parseISOString } from "../common.js"
import BoatClass from "./types/BoatClass.js";
import Race from "./types/Race.js";
import SeriesPoints from "./types/SeriesPoints.js";
import HelmResult from "./types/HelmResult.js";
import bootstrapLocalStorage from "../bootstrapLocalStorage.js";
import MutableRaceFinish from "./types/MutableRaceFinish.js";
import MutableRaceResult from "./types/MutableRaceResult.js";
import SearchIndex from "../SearchIndex.js";
import ClubMember from "./types/ClubMember.js";
import RemoteStore from "./RemoteStore.js";

export class Stores {
    constructor(auth, raceResultsSheetId, readOnly) {
        this.readOnly = readOnly;
        this.raceResultsDocument = RemoteStore.retryCreateSheetsDoc(raceResultsSheetId, auth);
        this.auth = auth;
        this.promiseMetaStore = RemoteStore.retryCreateRemoteStore(this.raceResultsDocument, "Meta Data", true, ["Last Updated"])
            .then((remoteStore) => this.metaStore = remoteStore);
        this.promiseStoresLastUpdated = this.getStoreLastUpdated();
    }

    async getStoreLastUpdated() {
        try {
            await this.promiseMetaStore;
            return parseISOString((await this.metaStore.getAllRows())[0]["Last Updated"]);
        }
        catch (err) {
            console.log(err);
            console.log("Failed to get last updated time from store");
        }
        return new Date(0); // If we have no meta store assume the remote store has not been updated.. ever
    }

    async writeStoreLastUpdated() {
        try {
            await this.promiseMetaStore;
            return await this.metaStore.replace([{ "Last Updated": (new Date()).toISOString() }]);
        }
        catch (err) {
            console.log(err);
            console.log("Failed to write updated time to store");
        }
    }

    async forceRefreshCaches() {
        localStorage.setItem("forceRefreshCaches", true);
        window.location.reload();
    }

    async init(forceCacheRefresh) {
        await promiseSleep(10); // Required to get spinner to render!?

        const createStoreWrapper = (...args) => StoreWrapper.create(forceCacheRefresh, ...args);

        const promiseClubMembers = createStoreWrapper("Active Membership", this.raceResultsDocument, this, ClubMember);
        const promiseNewMembers = createStoreWrapper("New Membership", this.raceResultsDocument, this, ClubMember);
        const promiseHelms = createStoreWrapper("Helms", this.raceResultsDocument, this, Helm);

        const promiseRYAClasses = createStoreWrapper("RYA Full List", this.raceResultsDocument, this, BoatClass);
        const promiseClubClasses = createStoreWrapper("Club Handicaps", this.raceResultsDocument, this, BoatClass);
        const promiseSeriesRaces = createStoreWrapper("Seasons/Series", this.raceResultsDocument, this, SeriesRace);

        const [clubMembers, helms, ryaClasses, clubClasses, seriesRaces, newMembers] = await Promise.all([promiseClubMembers, promiseHelms, promiseRYAClasses, promiseClubClasses, promiseSeriesRaces, promiseNewMembers]);
        this.clubMembers = clubMembers;
        this.newMembers = newMembers;

        const allClubMemberIds = [
            ...this.newMembers.all(),
            ...this.clubMembers.all()
        ].map(ClubMember.getId);

        if ([...new Set(allClubMemberIds)].length !== allClubMemberIds.length) {
            throw new Error("Duplicate helms exist in new members and existing members");
        }

        this.helms = helms;
        this.ryaClassesStore = ryaClasses;
        this.clubClassesStore = clubClasses;
        this.ryaClasses = mapGroupBy(ryaClasses.all(), [BoatClass.getClassName]);
        this.clubClasses = mapGroupBy(clubClasses.all(), [BoatClass.getClassName]);
        this.seriesRaces = seriesRaces;

        const getOODsFromStore = (result) => HelmResult.fromStore(
            result,
            (helmId) => this.helms.get(helmId),
        );

        const promiseOODs = createStoreWrapper("OODs", this.raceResultsDocument, this, HelmResult, getOODsFromStore);
        const promisePursuitResults = createStoreWrapper("Pursuit Race Results", this.raceResultsDocument, this, Result, (storeResult) => this.deserialiseResult(storeResult));
        const promiseFleetResults = createStoreWrapper("Fleet Race Results", this.raceResultsDocument, this, Result, (storeResult) => this.deserialiseResult(storeResult));
        const [oods, pursuitResults, fleetResults] = await Promise.all([promiseOODs, promisePursuitResults, promiseFleetResults]);
        this.oods = oods;
        this.pursuitResults = pursuitResults;
        this.results = fleetResults;


        // const clubMembersByName = mapGroupBy(this.clubMembers.all(), [ClubMember.getId]);
        // this.helms.all()
        //     .filter((helm) => !clubMembersByName.has(Helm.getId(helm)))
        //     .forEach((helm) => console.log(`Helm not current member ${Helm.getId(helm)}`));

        this.processResults();
    }

    getStores() {
        return Object.entries(this)
            .filter(([, storeWrapper]) => storeWrapper instanceof StoreWrapper)
            .map(([, storeWrapper]) => storeWrapper.store);
    }

    getStoresNames() {
        return this.getStores()
            .map((store) => store.storeName);
    }

    getStatus() {
        return this.getStores()
            .reduce((acc, store) => ({ ...acc, [store.storeName]: store.storesInSync() }), {});
    }

    async syncroniseStore(storeName) {
        const store = this.getStores()
            .find((store) => store.storeName === storeName);

        await store.syncRemoteStateToLocalState();
    }

    async syncroniseStores(storeNames = this.getStoresNames()) {
        console.log(`Syncronising stores ${storeNames.join()}`);
        await this.writeStoreLastUpdated();
        for (let storeName of storeNames) {
            await this.syncroniseStore(storeName);
        }
    }

    getBoatClassForRace(boatClassName, race) {
        const clubClasses = this.clubClasses.get(boatClassName) || [];
        const ryaClasses = this.ryaClasses.get(boatClassName) || [];

        return BoatClass.getBoatClassesForRace(race, [ryaClasses], [clubClasses]).get(boatClassName);
    }

    deserialiseResult(storeResult, newHelms = [], Type = Result) {
        return Type.fromStore(
            storeResult,
            (helmId) => this.getHelmFromHelmId(helmId, newHelms),
            (boatClassName, race) => this.getBoatClassForRace(boatClassName, race)
        );
    }

    getHelmFromHelmId(helmId, newHelms = []) {
        if (this.helms.has(helmId)) {
            return this.helms.get(helmId);
        }
        const newHelm = newHelms.find((newHelm) => Helm.getId(newHelm) === helmId);
        if (!newHelm) {
            throw new Error(`Helm ${helmId} didn't exist in store or new helms`);
        }
        return newHelm;
    }

    deserialiseHelm(storeHelm) {
        return Helm.fromStore(storeHelm);
    }

    getRaceFinishes() {
        return this.raceFinishes;
    }

    getRaceFinish(race) {
        assertType(race, Race);
        const raceId = Race.getId(race);
        return this.raceFinishes.find((raceFinish) => Race.getId(raceFinish) === raceId);
    }

    processResults(tranformResults) {
        const [seriesPoints, raceFinishes, allCorrectedResults, allSeriesRacesByRace, helmResultsByRaceAsc] = Stores.processResultsStatic(this.oods.all(), this.pursuitResults.all(), this.results.all(), this.seriesRaces.all(), tranformResults);
        this.raceFinishes = raceFinishes;
        this.allCorrectedResults = allCorrectedResults;
        this.seriesPoints = seriesPoints;
        this.allSeriesRacesByRace = allSeriesRacesByRace;
        this.helmResultsByRaceAsc = helmResultsByRaceAsc;
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

        const allCorrectedResults = [...previousCorrectedResults.sort(Result.sortByRaceAsc)];

        const initialResultsByHelm = new mapGroupBy(allCorrectedResults, [Result.getHelmId]);
        const helmResultsByRaceAsc = new AutoMap(Result.getHelmId, (result, helmId) => initialResultsByHelm.get(helmId) || []);

        for (let [race, raceResults] of Race.groupResultsByRaceAsc(transformResults(allFleetResults))) {
            const raceFinish = MutableRaceFinish.fromResults(raceResults, (helmId) => helmResultsByRaceAsc.get(helmId) || initialResultsByHelm.get(helmId) || [], oodsByRace.get(Race.getId(race)) || []);

            raceFinishes.upsert(raceFinish);
            const correctedResults = raceFinish.getCorrectedResults();
            correctedResults.forEach((result) => helmResultsByRaceAsc.upsert(result, (arr) => [...arr, result]));
            allCorrectedResults.push(...correctedResults);
        }

        const allSeriesRacesByRace = mapGroupBy(allSeriesRaces, [(seriesRace) => Race.getId(seriesRace.getRace())]);
        [...allSeriesRacesByRace].forEach(([, seriesRaces]) => {
            const firstRace = seriesRaces.at(0);
            if (seriesRaces.length > 1) {
                console.log(`Duplicate series for race ${SeriesRace.getId(firstRace)}`)
                const inconsistent = seriesRaces.find((seriesRace) => seriesRace.isPursuit() !== firstRace.isPursuit());
                if (inconsistent) {
                    throw new Error(`Series races: ${SeriesRace.getId(inconsistent)} and ${SeriesRace.getId(firstRace)} have inconsistent race types (fleet/pursuit)`);
                }
            }
        });

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

        const allProcesssed = [seriesPoints, [...raceFinishes.values()], allCorrectedResults, allSeriesRacesByRace, helmResultsByRaceAsc];
        console.log(`Finished processing results in ${Math.round(Date.now() - started)} ms`);

        return allProcesssed;
    }

    static async create(auth, raceResultsSheetId, forceCacheRefresh, readOnly, skipStoreInit) {
        await bootstrapLocalStorage();
        const stores = new Stores(auth, raceResultsSheetId, readOnly);
        const started = Date.now();
        console.log(`Started loading`);
        skipStoreInit || await stores.init(forceCacheRefresh);
        console.log(`Loaded results in ${Math.round(Date.now() - started)} ms`);
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
            [
                ...this.stores.clubMembers.all(),
                ...this.stores.newMembers.all(),
                ...this.stores.helms.all()
                    .filter((helm) => helm.isGuestHelm())
                    .map((guestHelm) => ClubMember.fromName(guestHelm.getName())),
            ]
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
        const ryaClasses = [...this.stores.ryaClasses].map(([, classes]) => classes);
        const clubClasses = [...this.stores.clubClasses].map(([, classes]) => classes);

        const allClassesForYearByClassName = BoatClass.getBoatClassesForRace(race, ryaClasses, clubClasses, true);
        const allClassesForYear = [...allClassesForYearByClassName].map(([, boatClass]) => boatClass);

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
    constructor(stores, superUser, editableRaceDate, readOnly, isLive) {
        this.stores = stores;
        this.getRaces = this.getRaces;
        this.getSeriesPoints = this.getSeriesPoints;
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
        this.isPursuitRace = this.isPursuitRace;
        this.isRaceMutable = this.isRaceMutable;
        this.isRaceEditableByUser = this.isRaceEditableByUser;
        this.getSailNumberIndexForHelmBoat = this.getSailNumberIndexForHelmBoat;
        this.setSailNumberCounts = this.setSailNumberCounts;
        this.commitResultsForRace = this.commitResultsForRace;
        this.commitNewHelmsForResults = this.commitNewHelmsForResults;
        this.getResultsOODsForRace = this.getResultsOODsForRace;
        this.createHelmFromClubMember = this.createHelmFromClubMember;
        this.assertHelmNotStored = this.assertHelmNotStored;
        this.getStoresStatus = this.getStoresStatus;
        this.updateStoresStatus = this.updateStoresStatus;
        this.syncroniseStore = this.syncroniseStore;
        this.syncroniseStores = this.syncroniseStores;
        this.reprocessStoredResults = this.reprocessStoredResults;
        this.getLatestHelmPersonalHandicap = this.getLatestHelmPersonalHandicap;
        this.helmIsClubMember = this.helmIsClubMember;
        this.superUser = superUser;
        this.editableRaceDate = editableRaceDate;
        this.readOnly = readOnly;
        this.isLive = isLive;
        this.indexes = new Indexes(this.stores);
    }

    static async create(forceRefresh, auth, raceResultsSheetId, editableRaceDateStr, superUser, isLive, hasToken) {
        const readOnly = Boolean(!hasToken);
        const stores = await Stores.create(
            auth,
            raceResultsSheetId,
            forceRefresh,
            readOnly
        );
        return new StoreFunctions(
            stores,
            superUser,
            editableRaceDateStr && parseURLDate(editableRaceDateStr),
            readOnly,
            isLive,
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

    syncroniseStores(storeNames) {
        return this.stores.syncroniseStores(storeNames);
    }

    getStoresStatus() {
        return this.stores.getStatus();
    }

    helmIsClubMember(helm) {
        return this.stores.clubMembers.has(Helm.getId(helm)) || this.stores.newMembers.has(Helm.getId(helm));
    }

    async commitNewHelmsForResults(race, results, oods, newHelms) {
        await promiseSleep(0);
        const [raceResults, raceOODs] = this.getResultsOODsForRace(race, results, oods);
        const newHelmsById = mapGroupBy(newHelms, [Helm.getId]);
        const helmsToCommit = new AutoMap(Helm.getId);
        const newMembersToCommit = new AutoMap(ClubMember.getId);
        for (let result of raceResults) {
            if (newHelmsById.has(Result.getHelmId(result))) {
                helmsToCommit.upsert(result.getHelm());
            }
            if (!this.helmIsClubMember(result.getHelm())) {
                newMembersToCommit.upsert(ClubMember.fromName(Result.getHelmId(result)));
            }
        }
        for (let ood of raceOODs) {
            if (newHelmsById.has(HelmResult.getHelmId(ood))) {
                helmsToCommit.upsert(ood.getHelm());
            }
            if (!this.helmIsClubMember(ood.getHelm())) {
                newMembersToCommit.upsert(ClubMember.fromName(Result.getHelmId(ood)));
            }
        }
        for (let [, helm] of [...helmsToCommit]) {
            if (!this.stores.helms.has(Helm.getId(helm))) {
                this.stores.helms.add(helm);
            }
        }
        for (let [, clubMember] of [...newMembersToCommit]) {
            this.stores.newMembers.add(clubMember);
        }
        return [...helmsToCommit].map(([helmId]) => helmId);
    }

    getResultsOODsForRace(race, results, oods) {
        const raceResults = results.filter((result) => Result.getRaceId(result) === Race.getId(race));
        const raceOODs = oods.filter((ood) => Result.getRaceId(ood) === Race.getId(race));
        return [raceResults, raceOODs];
    }

    async commitResultsForRace(race, results, oods) {
        await promiseSleep(0);
        const [raceResults, raceOODs] = this.getResultsOODsForRace(race, results, oods);
        const raceFinish = this.getRaceFinishForResults(race, results);
        const resultsStore = raceFinish.isPursuitRace()
            ? this.stores.pursuitResults
            : this.stores.results;

        for (let result of raceResults) {
            resultsStore.add(result);
        }
        for (let ood of raceOODs) {
            this.stores.oods.add(ood);
        }
    }

    getSeriesPoints() {
        return this.stores.seriesPoints
            .map(([, seriesPoints]) => seriesPoints);
    }

    isRaceEditableByUser(race) {
        return this.superUser || (this.editableRaceDate && race.getDate().getTime() === this.editableRaceDate.getTime());
    }

    isPursuitRace(race) {
        assertType(race, Race);
        const seriesRacesForRace = this.stores.allSeriesRacesByRace.get(Race.getId(race));
        return seriesRacesForRace && seriesRacesForRace.at(0).isPursuit();
    }

    isRaceMutable(raceDate, raceNumber) {
        assertType(raceDate, Date);
        assertType(raceNumber, "number");
        const raceToCheck = new Race(raceDate, raceNumber);

        const immutableResults = Race.groupResultsByRaceAsc([...this.stores.results.all(), ...this.stores.pursuitResults.all()])
            .find(([race]) => Race.getId(race) === Race.getId(raceToCheck));

        if (immutableResults) {
            return false;
        }

        return this.isRaceEditableByUser(raceToCheck);
    }

    getRaces(exludeFutureMutableRaces) {
        const now = new Date();
        const tomorrowsRace = new Race(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), 1);

        const storedPursuitResults = this.stores.pursuitResults.all();
        const storedFleetResults = this.stores.results.all();
        const immutableRaces = Race.groupResultsByRaceAsc([...storedPursuitResults, ...storedFleetResults])
            .map(([race]) => race);

        const mutableRaces = this.stores.seriesRaces.all()
            .map((seriesRace) => seriesRace.getRace())
            .filter((race) => !immutableRaces.find((immutable) => Race.getId(race) === Race.getId(immutable)))
            .sort((a, b) => a.sortByRaceAsc(b))
            .filter((race) => !exludeFutureMutableRaces || !tomorrowsRace.isBefore(race));

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
            this.stores.getBoatClassForRace(boatClass.getClassName(), race),
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

    getLatestHelmPersonalHandicap(helmId) {
        if (this.stores.helmResultsByRaceAsc.has(helmId)) {
            const latestFleetResult = this.stores.helmResultsByRaceAsc.get(helmId).at(-1);
            const [ph, pi] = (latestFleetResult && latestFleetResult.getRollingHandicapsAtRace()) || [];
            return pi;
        }
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
            mutablePursuitResults,
            mutableFleetResults,
            storedSeriesRaces,
            undefined,
            this.stores.getRaceFinishes(),
            this.stores.allCorrectedResults,
        );

        return raceFinishes.find((raceFinish) => Race.getId(raceFinish) === raceId);
    }
}
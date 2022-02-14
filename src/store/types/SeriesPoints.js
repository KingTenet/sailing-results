import { assertType, AutoMap, groupBy, flatten, average } from "../../common.js";
import Helm from "./Helm.js";
import HelmResult from "./HelmResult.js";
import Race from "./Race.js";
import RaceFinish from "./RaceFinish.js";
import Result from "./Result.js";
import Series from "./Series.js";
import SeriesRace from "./SeriesRace.js";
import StoreObject from "./StoreObject.js";

const midnightTonight = () => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1, 0, 0, 0));

class ResultPoints extends HelmResult {
    constructor(result, racePoints, oodPoints, pnsPoints, isCounted = true) {
        super(result.race, result.helm, StoreObject.fromStore({}));
        // super(result.race, result.helm, result.boatClass, result.boatSailNumber, result.laps, result.pursuitFinishPosition, result.finishTime, result.finishCode, new StoreObject(result));
        this.result = result;
        this.racePoints = racePoints;
        this.oodPoints = oodPoints;
        this.pnsPoints = pnsPoints;
        this.isCounted = isCounted;
    }

    getTotal() {
        return this.racePoints + this.oodPoints + this.pnsPoints;
    }

    sortAllPointsDesc(secondPoints) {
        return this.getTotal() - secondPoints.getTotal();
    }

    static fromPoints(points, isCounted) {
        return new ResultPoints(points, points.racePoints, points.oodPoints, points.pnsPoints, isCounted);
    }

    static aggregate(resultPoints, countedOnly = true) {
        resultPoints.forEach((rp) => assertType(rp, ResultPoints));
        return resultPoints.reduce((acc, rp) => acc + ((countedOnly && !rp.isCounted) ? 0 : rp.getTotal()), 0);
    }
}

export default class SeriesPoints extends Series {
    constructor(series, seriesRaces, raceFinishes, oods) {
        assertType(series, Series);
        super(series.getSeasonName(), series.getSeriesName());
        seriesRaces.forEach((seriesRace) => assertType(seriesRace, SeriesRace));
        raceFinishes.forEach((raceFinish) => assertType(raceFinish, RaceFinish));
        this.seriesRaces = seriesRaces;
        this.raceFinishes = raceFinishes;
        const plannedRaces = this.seriesRaces.length;
        const finishedRaces = this.raceFinishes.length;
        const racesToQualify = Math.ceil(plannedRaces / 2 + 1);

        this.validateSeriesRaces();
        this.validateRaceFinishes();
    }

    validateSeriesRaces() {
        const seriesId = Series.getId(this);
        if (!this.seriesRaces.map(SeriesRace.getSeriesId).every((id) => id === seriesId)) {
            throw new Error("All series races must be part of series");
        }
    }

    validateRaceFinishes() {
        const seriesRacesById = new Map(groupBy(this.seriesRaces, SeriesRace.getRaceId));
        if (!this.raceFinishes.map(Race.getId).every((id) => seriesRacesById.has(id))) {
            throw new Error("All race finishes must have an associated series race");
        }
    }

    getPoints(points, racesToCount, pointsNotScored, oodCount = 0) {
        console.log(racesToCount);
        console.log(pointsNotScored);
        console.log(oodCount);
        const pnsCount = Math.max(0, racesToCount - points.length - oodCount);
        const pointsCount = racesToCount - pnsCount - oodCount;
        const totalPoints = points
            .sort((a, b) => b - a)
            .slice(-pointsCount)

        const OODpointsPerRace = Math.round(average(totalPoints) * 10) / 10; // Round to 1dp

        return [
            (new Array(pnsCount)).fill(pointsNotScored),
            (new Array(oodCount)).fill(OODpointsPerRace),
            totalPoints,
        ];
    }

    getOODPointsFromResults(results, oods, racesToCount) {
        const pnsCount = Math.max(0, racesToCount - results.length - oods.length);
        const pointsCount = racesToCount - pnsCount - oods.length;
        const totalPoints = results
            .map(([, points]) => points)
            .sort((a, b) => b - a)
            .slice(-pointsCount)

        return Math.round(average(totalPoints) * 10) / 10; // Round to 1dp
    }

    /**
     * Build a set of results for all helms that took raced in series.
     * If they were an OOD, create an OOD result for them (and associated points).
     * If they didn't take part in race, create a PNS result for them (and associated points).
     * Flag points that won't be counted (if the helm has sailed more than races to count)
     */
    getPointsByAllResults(date = new Date()) {
        const finishes = this.raceFinishes
            .filter((race) => race.isBefore(new Race(date, 1)));

        const finishedRaces = finishes.filter((race) => race.hasResults());
        const racesToCount = Math.ceil((finishedRaces.length + 1) / 2);

        const pointsByRaceResult = flatten(
            finishes
                .map((raceFinish) => raceFinish.isPursuitRace()
                    ? raceFinish.getPursuitCorrectedPointsByResult()
                    : raceFinish.getClassCorrectedPointsByResult()
                ));

        const pointsByHelm = new Map(groupBy(pointsByRaceResult, ([result]) => Result.getHelmId(result)));

        const raceResults = flatten(finishedRaces.map((raceFinish) => raceFinish.getCorrectedResults()));
        const allOODs = flatten(finishes.map((raceFinish) => raceFinish.getOODs()));

        const allHelms = groupBy(raceResults, Result.getHelmId).map(([, results]) => [results.at(0).getHelm(), results]);
        const allOODHelms = new Map(groupBy(allOODs, Result.getHelmId));

        const numberOfHelms = allHelms.length;
        const pointsNotScored = numberOfHelms + 1;

        const pointResultsMap = new AutoMap(ResultPoints.getId);
        for (let race of finishes) {
            if (race.hasResults()) {
                for (let [helm] of allHelms) {
                    const pnsResult = HelmResult.fromHelmRace(helm, race);
                    pointResultsMap.upsert(new ResultPoints(pnsResult, 0, 0, pointsNotScored));
                }
                for (let [result, finishPoints] of race.getClassCorrectedPointsByResult()) {
                    pointResultsMap.upsert(new ResultPoints(result, finishPoints, 0, 0));
                }
            }
            for (let result of race.getOODs()) {
                const helmId = Result.getHelmId(result);
                const oodPoints = this.getOODPointsFromResults(pointsByHelm.get(helmId), allOODHelms.get(helmId), racesToCount)
                pointResultsMap.upsert(new ResultPoints(result, 0, oodPoints, 0));
            }
        }

        const allPointResults = [...pointResultsMap].map(([, pointResult]) => pointResult);
        return flatten(groupBy(allPointResults, HelmResult.getHelmId)
            .map(([, helmPointResults]) => helmPointResults
                .sort((a, b) => a.sortAllPointsDesc(b))
                .map((pointResult, key) => ResultPoints.fromPoints(pointResult, Boolean(key < racesToCount))))
        )
    }

    summarize(date = new Date()) {
        console.log(`Series Summary: ${this.getSheetName()}`);
        const allResultPoints = this.getPointsByAllResults(date);
        groupBy(allResultPoints, HelmResult.getHelmId)
            .map(([helmId, resultsPoints]) => [helmId, ResultPoints.aggregate(resultsPoints)])
            .sort(([, a], [, b]) => a - b)
            .forEach(([helmId, points]) => {
                console.log(`           ${helmId}: ${points}`);
            })

        allResultPoints
            .filter((result) => HelmResult.getHelmId(result) === "Simon Hall")
            .forEach((points) => {
                console.log(`${points.getRace().getDate()} ${points.getTotal()}`);
            })

    }

    static fromSeriesRaces(seriesRaces, raceFinishes) {
        if (!seriesRaces.length) {
            throw new Error("Series points requires at least one series race");
        }
        const series = Series.fromSeriesRace(seriesRaces[0]);
        return new SeriesPoints(series, seriesRaces, raceFinishes);
    }
}

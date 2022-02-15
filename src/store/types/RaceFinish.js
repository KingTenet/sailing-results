import { assertType, groupBy, assert, AutoMap } from "../../common.js";
import Result from "./Result.js";
import { calculateSCTFromRaceResults } from "../../../scripts/personalHandicapHelpers.js";
import Race from "./Race.js";
import CorrectedResult from "./CorrectedResult.js";
import HelmResult from "./HelmResult.js";

export default class RaceFinish extends Race {
    constructor(results, previousResults, oods) {
        results.forEach((result) => assertType(result, Result));
        previousResults.forEach((result) => assertType(result, CorrectedResult));
        oods.forEach((ood) => assertType(ood, HelmResult));

        const races = groupBy(results, Result.getRaceId);
        const oodRaces = groupBy(oods, HelmResult.getRaceId);
        assert(races.length < 2, "RaceFinish requires results are from a single race only.");
        assert(oodRaces.length < 2, "RaceFinish requires oods are from a single race only.");

        const race = (results.at(0) || oods.at(0)).getRace();
        if (oodRaces.length && results.length) {
            assert(oodRaces.at(0) !== Race.getId(race), "RaceFinish requires that OODs and results are from same race.");
        }

        const raceDate = race.getDate();
        const raceNumber = race.getNumber();
        super(raceDate, raceNumber);

        this.results = results;

        if (results.length) {
            const [sct, raceMaxLaps] = calculateSCTFromRaceResults(results) || [];
            this.sct = sct;
            this.raceMaxLaps = raceMaxLaps;
            // console.log(`${Race.getId(this)} ${sct / this.raceMaxLaps}`);
        }

        this.previousResults = previousResults;
        this.oods = oods;

        this.validateRaceType();
        if (!this.isPursuitRace()) {
            this.setCorrectedResults();
        }

        // this.assignPointsToRace();
    }

    hasResults() {
        return this.results.length;
    }

    validateRaceType() {
        if (this.results.some((result) => result.getFinishTime())
            && this.isPursuitRace()
        ) {
            throw new Error(`RaceFinish date:${raceDate} number:${this.raceNumber} must contain only one type of race`);
        }
    }

    isPursuitRace() {
        return Race.isPursuitRace(this.results);
    }

    setCorrectedResults() {
        const allResultsByRaceAsc = this.previousResults.sort(Result.sortByRaceAsc);
        const helmResultsByRaceAsc = new Map(groupBy(allResultsByRaceAsc, Result.getHelmId));
        const getHelmResults = (helmId) => helmResultsByRaceAsc.get(helmId) || [];

        this.correctedResults = this.results
            .map((result) => CorrectedResult.fromResult(result, getHelmResults(Result.getHelmId(result)), this));
    }

    getCorrectedResults() {
        return this.isPursuitRace()
            ? this.results
            : this.correctedResults;
    }

    getSCT() {
        return !Number.isNaN(this.sct) ? this.sct : undefined;
    }

    /**
     * Assigns points equal to positional order + 1, except for ties.
     * For a tie, points are the average of the positional order.
     * eg. joint 2nd and 3rd position share 2.5 points.
     */
    static assignPointsToResults(allFinishers, sortBy, setPosition) {
        const groupedFinishTimes = groupBy(allFinishers, sortBy)
            .sort(([a], [b]) => a - b);

        groupedFinishTimes.reduce((position, [, finishers]) => {
            finishers.forEach((finisher) => {
                setPosition(finisher, position + (finishers.length - 1) / 2);
            })
            return position + finishers.length;
        }, 1);
    }

    sortResultsByPointsDesc(resultsPoints) {
        return [...resultsPoints]
            .map(([result, points]) => [points, result])
            .sort(([pointsA], [pointsB]) => pointsA - pointsB)
            .map(([points, result]) => [result, points]);
    }

    // getPersonalCorrectedPointsByResult() {
    //     return this.sortResultsByPointsDesc(this.personalAdjustedPoints);
    // }

    // getPursuitCorrectedPointsByResult() {
    //     return this.sortResultsByPointsDesc(this.pursuitPoints);
    // }

    // getClassCorrectedPointsByResult() {
    //     return this.sortResultsByPointsDesc(this.classAdjustedPoints);
    // }

    getPersonalCorrectedPointsByResult(personalHandicapAtRace) {
        const [, personalAdjustedPoints] = RaceFinish.getPointsForResults(this.getCorrectedResults(), personalHandicapAtRace);
        return this.sortResultsByPointsDesc(personalAdjustedPoints);
    }

    getClassCorrectedPointsByResult(personalHandicapAtRace) {
        const [classAdjustedPoints] = RaceFinish.getPointsForResults(this.getCorrectedResults(), personalHandicapAtRace);
        return this.sortResultsByPointsDesc(classAdjustedPoints);
    }

    getOODs() {
        return this.oods;
    }

    // assignPointsToRace() {
    //     const [classAdjustedPoints, personalAdjustedPoints] = RaceFinish.getPointsForResults(this.getCorrectedResults());
    //     this.classAdjustedPoints = classAdjustedPoints;
    //     this.personalAdjustedPoints = personalAdjustedPoints;
    // }

    static getPointsForResults(results, personalHandicapAtRace) {
        const classAdjustedPoints = new Map();
        const personalAdjustedPoints = new Map();

        const pointsForDNF = results.length + 1;

        const allFinishers = results
            .filter((result) => result.isValidFinish())

        if (Race.isPursuitRace(results)) {
            results
                .filter((result) => !result.isValidFinish())
                .forEach((result) => classAdjustedPoints.set(result, pointsForDNF));

            RaceFinish.assignPointsToResults(
                allFinishers,
                (result) => result.getPursuitFinishPosition(),
                (result, points) => classAdjustedPoints.set(result, points),
            );
        }
        else {
            results
                .filter((result) => !result.isValidFinish())
                .forEach((result) => {
                    classAdjustedPoints.set(result, pointsForDNF);
                    personalAdjustedPoints.set(result, pointsForDNF);
                });

            RaceFinish.assignPointsToResults(
                allFinishers,
                (result) => result.getClassCorrectedFinishTime(),
                (result, points) => classAdjustedPoints.set(result, points),
            );

            RaceFinish.assignPointsToResults(
                allFinishers,
                (result) => result.getPersonalCorrectedFinishTimeUsingPHDate(personalHandicapAtRace),
                (result, points) => personalAdjustedPoints.set(result, points),
            );
        }

        return [classAdjustedPoints, personalAdjustedPoints];
    }

    getMaxLaps() {
        return this.raceMaxLaps;
    }
}

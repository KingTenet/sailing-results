import { assertType, groupBy, assert } from "../../common.js";
import Result from "./Result.js";
import { calculateSCTFromRaceResults } from "../../common/personalHandicapHelpers.js";
import Race from "./Race.js";
import CorrectedResult from "./CorrectedResult.js";
import HelmResult from "./HelmResult.js";

export default class MutableRaceFinish extends Race {
    constructor(raceDate, raceNumber, results = [], previousResults, oods) {
        super(raceDate, raceNumber);
        results.forEach((result) => assertType(result, Result));
        (previousResults || []).forEach((result) => assertType(result, CorrectedResult));
        (oods || []).forEach((ood) => assertType(ood, HelmResult));
        (results || []).forEach((result) => assert(HelmResult.getRaceId(result) === Race.getId(this), "RaceFinish requires that OODs and results are from same race."));
        (oods || []).forEach((ood) => assert(HelmResult.getRaceId(ood) === Race.getId(this), "RaceFinish requires that OODs and results are from same race."));

        this.results = results;
        this.previousResults = previousResults;
        this.oods = oods;
        this.processResults();
    }

    processResults() {
        if (this.hasResults()) {
            this.calculateSCT();
            this.validateRaceType();
            if (!this.isPursuitRace()) {
                if (!this.previousResults) {
                    throw new Error("Cannot process race results without previous results");
                }
                this.setCorrectedResults();
            }
            this.processed = true;
        }
    }

    calculateSCT() {
        const [sct, raceMaxLaps, ryaApprovedSCT] = calculateSCTFromRaceResults(this.results) || [];
        this.sct = sct;
        this.raceMaxLaps = raceMaxLaps;
        this.ryaApprovedSCT = ryaApprovedSCT;
    }

    hasResults() {
        return Boolean(this.results && this.results.length);
    }

    isPursuitRace() {
        if (!this.hasResults()) {
            throw new Error("Cannot determine race type without race results");
        }
        return Race.isPursuitRace(this.results);
    }

    hasImmutableResults() {
        return Boolean(this.hasResults() && this.results.some((result) => !result.hasStaleRemote()));
    }

    getCorrectedResults() {
        return this.isPursuitRace()
            ? this.results
            : this.correctedResults;
    }

    // addResult(result) {
    //     assertType(result, Result);
    //     assert(Result.getRaceId(result) === Race.getId(this), "RaceFinish requires that OODs and results are from same race.");
    //     assert(!this.hasImmutableResults(), "Cannot add results to an immutable race finish");
    //     this.results.push(result);
    //     this.processResults();
    // }

    // addOOD(ood) {
    //     assertType(ood, HelmResult);
    //     assert(HelmResult.getRaceId(ood) === Race.getId(this), "RaceFinish requires that OODs and results are from same race.");
    //     assert(!this.hasImmutableResults(), "Cannot add oods to an immutable race finish");
    //     this.oods = [...this.oods, ood];
    // }

    validateRaceType() {
        assert(this.results.some((result) => result.finishCode.validFinish()), `RaceFinish date:${this.date} number:${this.raceNumber} has no valid finishers`);
        if (this.results.some((result) => result.getFinishTime())
            && this.isPursuitRace()
        ) {
            throw new Error(`RaceFinish date:${this.date} number:${this.raceNumber} must contain only one type of race`);
        }
    }

    setCorrectedResults() {
        const allResultsByRaceAsc = this.previousResults.sort(Result.sortByRaceAsc);
        const helmResultsByRaceAsc = new Map(groupBy(allResultsByRaceAsc, Result.getHelmId));
        const getHelmResults = (helmId) => helmResultsByRaceAsc.get(helmId) || [];

        this.correctedResults = this.results
            .map((result) => CorrectedResult.fromResult(result, getHelmResults(Result.getHelmId(result)), this));
    }

    getSCT() {
        return !Number.isNaN(this.sct) ? this.sct : undefined;
    }

    getMaxLaps() {
        return this.raceMaxLaps;
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

    getPersonalCorrectedPointsByResult(personalHandicapAtRace) {
        const [, personalAdjustedPoints] = MutableRaceFinish.getPointsForResults(this.getCorrectedResults(), personalHandicapAtRace);
        return this.sortResultsByPointsDesc(personalAdjustedPoints);
    }

    getClassCorrectedPointsByResult() {
        const [classAdjustedPoints] = MutableRaceFinish.getPointsForResults(this.getCorrectedResults());
        return this.sortResultsByPointsDesc(classAdjustedPoints);
    }

    getFinishersByFinishTime() {
        return this.getCorrectedResults()
            .sort((a, b) => b.sortByFinishTimeDesc(a));
    }

    getOODs() {
        return this.oods;
    }

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

            MutableRaceFinish.assignPointsToResults(
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

            MutableRaceFinish.assignPointsToResults(
                allFinishers,
                (result) => result.getClassCorrectedFinishTime(),
                (result, points) => classAdjustedPoints.set(result, points),
            );

            MutableRaceFinish.assignPointsToResults(
                allFinishers,
                (result) => result.getPersonalCorrectedFinishTimeUsingPHDate(personalHandicapAtRace),
                (result, points) => personalAdjustedPoints.set(result, points),
            );
        }

        return [classAdjustedPoints, personalAdjustedPoints];
    }

    static fromResults(results, previousResults, oods) {
        assert(results.length, "Minimum number of results to create a race finish is 1");
        assertType(results.at(0), Result);
        const race = results.at(0).getRace();
        return new MutableRaceFinish(race.getDate(), race.getNumber(), results, previousResults, oods);
    }

    static fromOODs(oods) {
        assert(oods.length, "Minimum number of oods to create a race finish is 1");
        assertType(oods.at(0), HelmResult);
        const race = oods.at(0).getRace();
        return new MutableRaceFinish(race.getDate(), race.getNumber(), undefined, undefined, oods);
    }
}

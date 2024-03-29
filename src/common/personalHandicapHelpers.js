import { groupBy, assertType, average, parseISOString, logDebug } from "../common.js";
import BoatClass from "../store/types/BoatClass.js";
import CorrectedResult from "../store/types/CorrectedResult.js";
import Race from "../store/types/Race.js";
import Result from "../store/types/Result.js";

const PREVIOUS_RACES_TO_COUNT_FOR_PERSONAL_HANDICAP = 10;
const FIRST_RACE_FOR_ADVANCED_SCT_CALC = new Race(parseISOString("2016-11-06T00:00:00.000Z"), 1); // First Frostbite 2016 race (when advanced SCT brought in)
/*
Average corrected time ACT = average of Class handicap corrected times of top 2/3rd finishers, where the number of results to use is rounded up, i.e. 2/3 of 8 = 5.333 and the top 6 results are averaged.
The Standard Corrected Time is then calculated as:
SCT = average of Class handicap corrected times of helms who finish within 105% of ACT
Note 1: SCT may be an average of more or less than the number of helms used to calculate ACT.
Note 2: SCT does not exclude very fast results which may be quicker than 95% of ACT.
Note 3: The RYA only calculates adjustments to handicaps for races with at least 4 finishing helms including at least 2 classes of boat.

PI = [ (helm time corrected for class PN) / (Standard Corrected Time) – 1 ]*100 percent
The PI is also expressed as the equivalent increment (PH) to the class PN, rounded to a whole number:

PH = PI / 100 * (class PN)
The values of PH in each race are shown on the race results, and saved in a database to be used to calculate the fixed average personal handicap used for the personal handicap based series results

*/
export function calculateSCTFromRaceResults(raceResults, debug) {
    const log = (msg) => logDebug(msg, debug);

    const finishers = raceResults
        .filter((result) => result.finishCode.validFinish());

    let compliesWithRYA = true;

    if (finishers.length < 4) {
        compliesWithRYA = false;
    }

    const classes = groupBy(finishers, Result.getBoatClassId);
    if (classes.length < 2) {
        compliesWithRYA = false;
    }

    log("Complies with RYA " + compliesWithRYA);

    if (raceResults.some((result) => result.getRace().isBefore(FIRST_RACE_FOR_ADVANCED_SCT_CALC))) {
        log("Using basic SCT calculation");
        return [...calculateBasicSCTFromRaceResults(raceResults), compliesWithRYA];
    }

    log("Valid finishers " + finishers.length);
    const raceMaxLaps = getLapsForNormalisation(finishers);

    log("Max laps " + raceMaxLaps);

    // The previous system has variously used Math.round and Math.ceil for this calculation
    // the documentation suggests it should be Math.ceil
    const numResultsToCountForACT = Math.ceil(finishers.length * 2 / 3);

    log(`Number of results to count for ACT: ${numResultsToCountForACT}`);

    const finishTimes = finishers
        .map((result) => result.getClassCorrectedTime(raceMaxLaps))
        .sort((a, b) => b - a);

    log(`Class corrected times: ${finishTimes}`);
    log(`Class corrected times per lap: ${finishTimes.map((ft) => ft / raceMaxLaps)}`);

    const resultsToCountForACT = finishTimes.slice(-numResultsToCountForACT);
    log(`Results to count for ACT: ${resultsToCountForACT}`);

    const ACT = average(resultsToCountForACT);

    log(`ACT: ${ACT}`);
    log(`ACT per lap: ${ACT / raceMaxLaps}`);

    const resultsToCountForSCT = finishTimes.filter((time) => time < (ACT * 1.05));
    log(`Number of results to count for SCT: ${resultsToCountForSCT.length}`);
    log(`Results to count for SCT: ${resultsToCountForSCT}`);
    const SCT = average(resultsToCountForSCT);

    log(`SCT: ${SCT}`);
    log(`SCT per lap: ${SCT / raceMaxLaps}`);
    log(`SCT x 105%: ${SCT * 1.05}`);
    log(`SCT per lap x 105%: ${SCT / raceMaxLaps * 1.05}`);

    log(`Results < 105% SCT: ${finishTimes.filter((time) => time < (SCT * 1.05))}`)

    return [SCT, raceMaxLaps, compliesWithRYA];
}

export function calculateBasicSCTFromRaceResults(raceResults) {
    const finishers = raceResults
        .filter((result) => result.finishCode.validFinish());
    const raceMaxLaps = getLapsForNormalisation(finishers);

    const resultsToCountForACT = Math.round(finishers.length * 2 / 3);

    const finishTimes = finishers
        .map((result) => result.getClassCorrectedTime(raceMaxLaps))
        .sort((a, b) => b - a);

    return [average(finishTimes.slice(-resultsToCountForACT)), raceMaxLaps];
}

function getLapsForNormalisation(results) {
    return results
        .map(Result.getLaps)
        .reduce((maxLaps, laps) => Math.max(laps, maxLaps), 0);
}

export function getRollingPIFromResults(previousResults, boatClass, initialPI) {
    assertType(boatClass, BoatClass);
    previousResults.forEach((result) => assertType(result, CorrectedResult));

    const allPreviousResults = previousResults
        .filter((result) => result.getPersonalHandicapFromRace() !== undefined);

    if (!allPreviousResults.length) {
        return initialPI;
    }

    return getRollingMetric(transformPersonalHandicapToPI(allPreviousResults, boatClass));
}

export function getRollingPersonalHandicapFromResults(previousResults, boatClass, initialPI) {
    assertType(boatClass, BoatClass);
    previousResults.forEach((result) => assertType(result, CorrectedResult));

    const classPreviousResults = previousResults
        .filter((result) => result.getPersonalHandicapFromRace() !== undefined)
        .filter((result) => result.getBoatClass().getClassName() === boatClass.getClassName());

    if (!classPreviousResults.length) {
        const overallRollingPI = getRollingPIFromResults(previousResults, boatClass, initialPI);
        return calculatePersonalHandicapFromPI(boatClass.getPY(), overallRollingPI);
    }

    const initialClassPH = classPreviousResults.at(0).getRollingPersonalHandicapBeforeRace();
    const classPreviousResultsPH = classPreviousResults
        .map((result) => result.getPersonalHandicapFromRace())

    // TODO - changed for consistency with previous system.
    return getRollingMetric([...classPreviousResultsPH]);
    // return getRollingMetric([initialClassPH, ...classPreviousResultsPH]);
}

function getRollingMetric(allMetrics) {
    const metricsToCount = allMetrics.slice(-PREVIOUS_RACES_TO_COUNT_FOR_PERSONAL_HANDICAP);
    const worst = metricsToCount.reduce((prevMax, current) => Math.max(prevMax, current), -Infinity);
    const sum = metricsToCount.reduce((sum, current) => sum + current, 0);

    if (metricsToCount.length < 2) {
        return sum / metricsToCount.length;
    }
    return (sum - worst) / (metricsToCount.length - 1);

    // TODO - changed for consistency with previous system.
    // if (metricsToCount.length < PREVIOUS_RACES_TO_COUNT_FOR_PERSONAL_HANDICAP) {
    //     return sum / metricsToCount.length;
    // }
    // return (sum - worst) / (metricsToCount.length - 1);
}

export function calculatePersonalHandicapFromPI(classPY, PI) {
    return classPY * (100 + PI) / 100;
}

export function calculatePIFromPersonalHandicap(classPY, PH) {
    return (PH / classPY) * 100 - 100;
}

function transformPersonalHandicapToPI(validResults, boatClass) {
    assertType(boatClass, BoatClass);
    validResults.forEach((result) => assertType(result, CorrectedResult));

    // TODO - disabled for consistency with previous system
    // const firstResult = validResults.at(0);
    // const initialPersonalHandicap = firstResult.getRollingPersonalHandicapBeforeRace();

    return [
        //calculatePIFromPersonalHandicap(firstResult.getBoatClass().getPY(), initialPersonalHandicap),
        ...validResults.map((result) => calculatePIFromPersonalHandicap(result.getBoatClass().getPY(), result.getPersonalHandicapFromRace()))
    ];
}

export function getRollingHandicaps(previousResults, result) {
    assertType(result, Result);
    previousResults.forEach((result) => assertType(result, CorrectedResult));
    const rollingPH = Math.round(getRollingPersonalHandicapFromResults(previousResults, result.getBoatClass(), result.getHelm().getInitialPI()));
    const rollingPI = Math.round(getRollingPIFromResults(previousResults, result.getBoatClass(), result.getHelm().getInitialPI()));
    return [rollingPH, rollingPI];
}

export function calculatePersonalInterval(classCorrectedTime, standardCorrectedTime) {
    return (classCorrectedTime / standardCorrectedTime - 1) * 100;
}
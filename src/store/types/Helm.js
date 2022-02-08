import StoreObject from "./StoreObject.js";
import { assertType, generateId, parseBoolean } from "../../common.js";
import Race from "./Race.js";
import BoatClass from "./BoatClass.js";
import Result from "./Result.js";
// import CorrectedResult from "./CorrectedResult.js";

const MAX_NOVICE_RACES = 10;
const PREVIOUS_RACES_TO_COUNT_FOR_PERSONAL_HANDICAP = 10;

// TODO - change initial PI for novice helms
const INITIAL_PI_FOR_NOVICE_HELM = 0; // In percent
const INITIAL_PI_FOR_EXPERIENCED_HELM = 0; // In percent

export default class Helm extends StoreObject {
    constructor(name, yearOfBirth, gender, noviceInFirstRace, metaData) {
        super(metaData)
        this.name = assertType(name, "string");
        this.yearOfBirth = assertType(yearOfBirth, "number");
        this.gender = assertType(gender, "string");
        this.noviceInFirstRace = assertType(noviceInFirstRace, "boolean");
    }

    static getId(helm) {
        assertType(helm, Helm);
        return helm.name;
        return generateId(Helm, [helm.name]);
    }

    static fromStore(storeHelm) {
        let {
            "Name": name,
            "Year Of Birth": yearOfBirth,
            "Gender": gender,
            "Was Novice In First Race": noviceInFirstRace,
        } = storeHelm;
        return new Helm(name, parseInt(yearOfBirth || 1970), gender, parseBoolean(noviceInFirstRace), StoreObject.fromStore(storeHelm));
    }

    wasCadetInRace(race) {
        assertType(race, Race);
        return false;
    }

    wasJuniorInRace(race) {
        assertType(race, Race);
        return false;
    }

    wasNoviceInRace(helmResultsAsc, race) {
        assertType(race, Race);
        const previousResults = helmResultsAsc.filter((result) => result.getRace().isBefore(race));
        return this.wasNoviceAfterResults(previousResults)
    }

    wasNoviceAfterResults(results) {
        return this.noviceInFirstRace && results.length >= MAX_NOVICE_RACES;
    }

    getInitialPI(helmResultsAsc, race) {
        return this.wasNoviceInRace(helmResultsAsc, race)
            ? INITIAL_PI_FOR_NOVICE_HELM
            : INITIAL_PI_FOR_EXPERIENCED_HELM
    }

    getPersonalHandicapsFromResults(previousResults, boatClass, debug) {
        assertType(boatClass, BoatClass);
        previousResults.forEach((result) => assertType(result, Result));

        const intitialPI = this.wasNoviceAfterResults(previousResults)
            ? INITIAL_PI_FOR_NOVICE_HELM
            : INITIAL_PI_FOR_EXPERIENCED_HELM

        if (!previousResults.length) {
            return [Math.round(intitialPI), Math.round(intitialPI)];
        }

        const initialOverallPI = previousResults.at(0).getRollingOverallPIBeforeRace();
        const previousResultsPI = previousResults
            .filter((result) => Number.isInteger(result.getPI()))
            .map((result) => result.getPI());

        const classPreviousResults = previousResults
            .filter((result) => result.getBoatClass().getClassName() === boatClass.getClassName());

        const overallPI = this.getRollingPI([initialOverallPI, ...previousResultsPI]);

        if (!classPreviousResults.length) {
            return [Math.round(overallPI), Math.round(overallPI)];
        }

        const initialClassPI = classPreviousResults.at(0).getRollingClassPIBeforeRace();
        const classPreviousResultsPI = classPreviousResults
            .filter((result) => Number.isInteger(result.getPI()))
            .map((result) => result.getPI());

        const classPI = this.getRollingPI([initialClassPI, ...classPreviousResultsPI]);
        if (debug) {
            console.log([initialClassPI, ...classPreviousResultsPI])
            console.log(classPI)
            console.log("-----");
        }

        return [Math.round(overallPI), Math.round(classPI)];
    }

    getRollingPI(allResultsPI) {
        const resultsPI = allResultsPI.slice(-PREVIOUS_RACES_TO_COUNT_FOR_PERSONAL_HANDICAP);
        const worstPI = resultsPI.reduce((max, PI) => Math.max(max, PI), -Infinity);
        const sumOfPI = resultsPI.reduce((sum, PI) => sum + PI, 0);
        if (resultsPI.length < PREVIOUS_RACES_TO_COUNT_FOR_PERSONAL_HANDICAP) {
            return Math.round(sumOfPI / resultsPI.length);
        }
        return Math.round(sumOfPI - worstPI) / (resultsPI.length - 1);
    }

    getGender() {
        return this.gender;
    }

    toStore() {
        return {
            "Name": this.name,
            "Year Of Birth": this.yearOfBirth,
            "Gender": this.gender,
            "Was Novice In First Race": this.noviceInFirstRace,
            ...super.toStore(this),
        };
    }
}

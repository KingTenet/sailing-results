import StoreObject from "./StoreObject.js";
import { assertType, generateId, parseBoolean } from "../../common.js";
import Race from "./Race.js";
import BoatClass from "./BoatClass.js";
import Result from "./Result.js";
// import CorrectedResult from "./CorrectedResult.js";

const MAX_NOVICE_RACES = 10;
const PREVIOUS_RACES_TO_COUNT_FOR_PERSONAL_HANDICAP = 10;

// TODO - change initial PI for novice helms
const INITIAL_PI_FOR_NOVICE_HELM = 20; // In percent
const INITIAL_PI_FOR_EXPERIENCED_HELM = 0; // In percent

function calculatePersonalHandicapFromPI(classPY, PI) {
    return classPY * (100 + PI) / 100;
}

function calculatePIFromPersonalHandicap(classPY, PH) {
    return (PH / classPY) * 100 - 100;
}

function transformPersonalHandicapToPI(validResults, boatClass) {
    assertType(boatClass, BoatClass);
    validResults.forEach((result) => assertType(result, Result));
    const firstResult = validResults.at(0);
    const initialPersonalHandicap = firstResult.getRollingPersonalHandicapBeforeRace();
    return [
        calculatePIFromPersonalHandicap(firstResult.getBoatClass().getPY(), initialPersonalHandicap),
        ...validResults.map((result) => calculatePIFromPersonalHandicap(result.getBoatClass().getPY(), result.getPersonalHandicapFromRace()))
    ];
}

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
        return this.noviceInFirstRace && results.length <= MAX_NOVICE_RACES;
    }

    getInitialPI(helmResultsAsc, race) {
        return this.wasNoviceInRace(helmResultsAsc, race)
            ? INITIAL_PI_FOR_NOVICE_HELM
            : INITIAL_PI_FOR_EXPERIENCED_HELM
    }

    getRollingPIFromResults(previousResults, boatClass) {
        assertType(boatClass, BoatClass);
        previousResults.forEach((result) => assertType(result, Result));

        const allPreviousResults = previousResults
            .filter((result) => result.getPersonalHandicapFromRace() !== undefined);

        debugger;
        if (!allPreviousResults.length) {
            return this.wasNoviceAfterResults(previousResults)
                ? INITIAL_PI_FOR_NOVICE_HELM
                : INITIAL_PI_FOR_EXPERIENCED_HELM;
        }

        return this.getRollingMetric(transformPersonalHandicapToPI(allPreviousResults, boatClass));
    }

    getRollingPersonalHandicapFromResults(previousResults, boatClass) {
        assertType(boatClass, BoatClass);
        previousResults.forEach((result) => assertType(result, Result));

        const classPreviousResults = previousResults
            .filter((result) => result.getPersonalHandicapFromRace() !== undefined)
            .filter((result) => result.getBoatClass().getClassName() === boatClass.getClassName());

        if (!classPreviousResults.length) {
            const overallRollingPI = this.getRollingPIFromResults(previousResults, boatClass);
            return calculatePersonalHandicapFromPI(boatClass.getPY(), overallRollingPI);
        }

        const initialClassPH = classPreviousResults.at(0).getRollingPersonalHandicapBeforeRace();
        const classPreviousResultsPH = classPreviousResults
            .map((result) => result.getPersonalHandicapFromRace())

        return this.getRollingMetric([initialClassPH, ...classPreviousResultsPH]);
    }

    getRollingMetric(allMetrics) {
        const metricsToCount = allMetrics.slice(-PREVIOUS_RACES_TO_COUNT_FOR_PERSONAL_HANDICAP);
        const worst = metricsToCount.reduce((prevMax, current) => Math.max(prevMax, current), -Infinity);
        const sum = metricsToCount.reduce((sum, current) => sum + current, 0);
        if (metricsToCount.length < PREVIOUS_RACES_TO_COUNT_FOR_PERSONAL_HANDICAP) {
            return sum / metricsToCount.length;
        }
        return (sum - worst) / (metricsToCount.length - 1);
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

import StoreObject from "./StoreObject.js";
import { assertType, generateId, parseBoolean } from "../../common.js";
import Race from "./Race.js";

const MAX_NOVICE_RACES = 12;

const INITIAL_PI_FOR_NOVICE_HELM = 20; // In percent
const INITIAL_PI_FOR_EXPERIENCED_HELM = 0; // In percent

export default class Helm extends StoreObject {
    constructor(name, yearOfBirth, gender, noviceInFirstRace, duplicates, metaData) {
        super(metaData)
        this.name = assertType(name, "string");
        this.yearOfBirth = assertType(yearOfBirth, "number");
        this.gender = assertType(gender, "string");
        this.noviceInFirstRace = assertType(noviceInFirstRace, "boolean");
        this.duplicates = duplicates;
    }

    static getId(helm) {
        assertType(helm, Helm);
        return helm.name;
    }

    static sheetHeaders() {
        return [
            "Name",
            "Year Of Birth",
            "Gender",
            "Was Novice In First Race",
            ...StoreObject.sheetHeaders()
        ];
    }

    static fromStore(storeHelm) {
        let {
            "Name": name,
            "Year Of Birth": yearOfBirth,
            "Gender": gender,
            "Was Novice In First Race": noviceInFirstRace,
            "Duplicates": duplicates,
        } = storeHelm;
        return new Helm(name, parseInt(yearOfBirth || 1970), gender, parseBoolean(noviceInFirstRace), duplicates, StoreObject.fromStore(storeHelm));
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
        if (!this.noviceInFirstRace) {
            return false;
        }

        const previousResults = helmResultsAsc.filter((result) => result.getRace().isBefore(race));
        return previousResults.length < MAX_NOVICE_RACES;

        // const ONE_YEAR_IN_MILLISECONDS = 365.25 * 24 * 60 * 60 * 1000;
        // const sortedResults = previousResults.sort(Result.sortByRaceAsc);
        // const lastNoviceResult = sortedResults.at(MAX_NOVICE_RACES - 1);
        // const lastNoviceResultDateThreshold = lastNoviceResult.getRace().getDate().getTime() + ONE_YEAR_IN_MILLISECONDS;

        // // If last novice result was less than one year ago, then still a novice.
        // return race.getDate().getTime() < lastNoviceResultDateThreshold;
    }

    getGender() {
        return this.gender;
    }

    getInitialPI() {
        return this.noviceInFirstRace
            ? INITIAL_PI_FOR_NOVICE_HELM
            : INITIAL_PI_FOR_EXPERIENCED_HELM;
    }

    toStore() {
        return {
            "Name": this.name,
            "Year Of Birth": this.yearOfBirth,
            "Gender": this.gender,
            "Was Novice In First Race": this.noviceInFirstRace,
            "Duplicates": this.duplicates,
            ...super.toStore(this),
        };
    }
}

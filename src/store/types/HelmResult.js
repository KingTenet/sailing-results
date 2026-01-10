import {
    assertType,
    getURLDate,
    parseURLDate,
    generateId,
} from "../../common.js";
import StoreObject from "./StoreObject.js";
import Helm from "./Helm.js";
import Race from "./Race.js";

export default class HelmResult extends StoreObject {
    constructor(race, helm, crew, metadata) {
        super(metadata);
        this.race = assertType(race, Race);
        this.helm = assertType(helm, Helm);
        this.crew = crew ? assertType(crew, Helm) : undefined;
    }

    static getId(result) {
        assertType(result, HelmResult);
        return generateId("HelmResult", [
            Helm.getId(result.helm),
            Race.getId(result.race),
        ]);
    }

    static getCrewResultId(result) {
        assertType(result, HelmResult);
        return generateId("HelmResult", [
            Helm.getId(result.crew),
            Race.getId(result.race),
        ]);
    }

    static getCrewId(result) {
        assertType(result, HelmResult);
        return result.crew && Helm.getId(result.crew);
    }

    static getRaceId(result) {
        assertType(result, HelmResult);
        return Race.getId(result.race);
    }

    static getHelmId(result) {
        assertType(result, HelmResult);
        return Helm.getId(result.helm);
    }

    static sortByRaceAsc(firstResult, secondResult) {
        assertType(firstResult, HelmResult);
        assertType(secondResult, HelmResult);
        return firstResult.getRace().sortByRaceAsc(secondResult.getRace());
    }

    static sheetHeaders() {
        return ["Date", "Race Number", "Helm", "Crew", ...StoreObject.sheetHeaders()];
    }

    static fromStore(storeResult, getHelm) {
        let {
            Date: dateString,
            "Race Number": raceNumber,
            Helm: helmId,
            Crew: crewId,
        } = storeResult;
        const race = new Race(parseURLDate(dateString), parseInt(raceNumber));
        return new HelmResult(
            race,
            getHelm(helmId),
            crewId ?  getHelm(crewId) : undefined,
            StoreObject.fromStore(storeResult),
        );
    }

    static fromHelmRace(helm, race, crew) {
        return new HelmResult(race, helm, crew, StoreObject.fromStore({}));
    }

    static fromPreviousResult(result, race) {
        assertType(result, HelmResult);
        assertType(race, Race);
        return new HelmResult(
            race,
            result.getHelm(),
            result.getCrew(),
            StoreObject.fromStore({}),
        );
    }

    getRace() {
        return this.race;
    }

    getHelm() {
        return this.helm;
    }

    getCrew() {
        return this.crew;
    }

    toJSON() {
        return this.toStore();
    }

    toStore() {
        return {
            Date: getURLDate(this.race.getDate()),
            "Race Number": this.race.getNumber(),
            Helm: Helm.getId(this.helm),
            Crew: this.crew && Helm.getId(this.crew),
            ...super.toStore(this),
        };
    }
}

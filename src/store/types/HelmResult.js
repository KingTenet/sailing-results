import { assertType, getURLDate, parseURLDate, generateId } from "../../common.js";
import StoreObject from "./StoreObject.js";
import Helm from "./Helm.js";
import Race from "./Race.js";

export default class HelmResult extends StoreObject {
    constructor(race, helm, metadata) {
        super(metadata);
        this.race = assertType(race, Race);
        this.helm = assertType(helm, Helm);
    }

    static getId(result) {
        assertType(result, HelmResult);
        return generateId("HelmResult", [Helm.getId(result.helm), Race.getId(result.race)]);
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
        return firstResult.getRace().sortByRaceAsc(secondResult.getRace())
    }

    static sheetHeaders() {
        return [
            "Date",
            "Race Number",
            "Helm",
            ...StoreObject.sheetHeaders(),
        ];
    }

    static fromStore(storeResult, getHelm) {
        let {
            "Date": dateString,
            "Race Number": raceNumber,
            "Helm": helmId,
        } = storeResult;
        const race = new Race(parseURLDate(dateString), parseInt(raceNumber));
        return new HelmResult(race, getHelm(helmId), StoreObject.fromStore(storeResult));
    }

    static fromHelmRace(helm, race) {
        return new HelmResult(race, helm, StoreObject.fromStore({}));
    }

    static debugResult(result, helmId, boatClassName, raceDate, raceNumber) {
        assertType(result, HelmResult);
        const helmMatch = !helmId || HelmResult.getHelmId(result) === helmId;
        const boatClassMatch = !boatClassName || HelmResult.getBoatClassName(result) === boatClassName;
        const raceDateMatch = !raceDate || result.getRace().getDate().toISOString() === raceDate.toISOString();
        const raceNumberMatch = !raceNumber || result.getRace().getNumber() === raceNumber;
        if (helmMatch && boatClassMatch && raceDateMatch && raceNumberMatch) {
            debugger;
        }
    }


    getRace() {
        return this.race;
    }

    getHelm() {
        return this.helm;
    }

    toJSON() {
        return this.toStore();
    }

    toStore() {
        return {
            "Date": getURLDate(this.race.getDate()),
            "Race Number": this.race.getNumber(),
            "Helm": Helm.getId(this.helm),
            ...super.toStore(this),
        };
    }
}

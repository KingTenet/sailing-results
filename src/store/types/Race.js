import { assertType, generateId, fromId, parseISOString } from "../../common.js";
import Result from "./Result.js";

export default class Race {
    constructor(raceDate, raceNumber) {
        this.date = assertType(raceDate, Date);
        this.raceNumber = assertType(raceNumber, "number");
    }

    static getId(race) {
        assertType(race, Race);
        return generateId(Race, [race.date.toISOString(), race.raceNumber]);
    }

    static fromId(id) {
        let [raceDateString, raceNumber] = fromId(id);
        return new Race(parseISOString(raceDateString), parseInt(raceNumber));
    }

    static prettyPrintFromId(id) {
        let race = Race.fromId(id);
        return race.prettyPrintId();
    }

    static isPursuitRace(results) {
        return results.some((result) => result.getPursuitFinishPosition());
    }

    prettyPrint() {
        return `Date=${this.date.toISOString().slice(0, 10)}, Number=${this.raceNumber}`
    }

    getDate() {
        return this.date;
    }

    getNumber() {
        return this.raceNumber;
    }

    sort(otherRace) {
        assertType(otherRace, Race);
        if (this.date === otherRace.date) {
            return this.raceNumber > otherRace.raceNumber ? 1 : -1;
        }
        return this.date > otherRace.date ? 1 : -1;
    }

    static fromResult(result) {
        assertType(result, Result);
        return new Race(result.raceDate, result.raceNumber)
    }
}
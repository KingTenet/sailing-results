import { assertType, generateId, fromId, parseISOString, groupBy } from "../../common.js";
import HelmResult from "./HelmResult.js";
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

    sortByRaceAsc(secondRace) {
        assertType(secondRace, Race);
        return this.isBefore(secondRace)
            ? -1
            : 1;
    }

    isBefore(race) {
        assertType(race, Race);
        if (this.date.getTime() === race.date.getTime()) {
            return this.raceNumber < race.raceNumber;
        }
        return this.date < race.date;
    }

    static fromResult(result) {
        assertType(result, Result);
        return new Race(result.raceDate, result.raceNumber)
    }

    static groupResultsByRaceAsc(results) {
        return groupBy(results, HelmResult.getRaceId)
            .map(([raceId, raceResults]) => [raceResults.at(0).getRace(), raceResults])
            .sort(([raceA], [raceB]) => raceA.sortByRaceAsc(raceB));
    }
}
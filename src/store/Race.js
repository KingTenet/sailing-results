import { assertType, generateId } from "../common.js";
import Result from "./Result.js";

export default class Race {
    constructor(raceDate, raceNumber) {
        this.date = assertType(raceDate, Date);
        this.raceNumber = assertType(raceNumber, "number");
    }

    // static getRaceId() {
    //     return generateId("Race", [raceDate.toISOString(), raceNumber]);
    // }

    static getId(race) {
        assertType(race, Race);
        return generateId("Race", [race.date.toISOString(), race.raceNumber]);
    }

    getDate() {
        return this.date;
    }

    getNumber() {
        return this.raceNumber;
    }

    static fromResult(result) {
        assertType(result, Result);
        return new Race(result.raceDate, result.raceNumber)
    }
}
import MutableRaceFinish from "./MutableRaceFinish";

export default class ReactiveRaceFinish extends MutableRaceFinish {
    addResult(result) {
        super.addResult(result);
        return this;
    }

    static fromRaceFinish(raceFinish) {
        return new ReactiveRaceFinish(raceFinish.getDate(), raceFinish.getNumber(), raceFinish.results, raceFinish.previousResults, raceFinish.oods);
    }
}
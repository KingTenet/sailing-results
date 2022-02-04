import { assertType } from "../../common.js";
import Result from "./Result.js";
import StoreObject from "./StoreObject.js";

/**
 [
  CorrectedResult {
    lastUpdated: 2022-02-03T13:59:04.037Z,
    dateCreated: 1970-01-01T00:00:00.000Z,
    race: Race { date: 2017-12-17T00:00:00.000Z, raceNumber: 2 },
    helm: Helm {
      lastUpdated: 1970-01-01T00:00:00.000Z,
      dateCreated: 1970-01-01T00:00:00.000Z,
      name: 'Stewart Gordon',
      yearOfBirth: 1970,
      gender: 'male',
      noviceInFirstRace: false
    },
    boatClass: BoatClass {
      lastUpdated: 1970-01-01T00:00:00.000Z,
      dateCreated: 1970-01-01T00:00:00.000Z,
      className: 'DEVOTI D-ZERO',
      boatConfiguration: [BoatConfiguration],
      PY: 1029,
      validYear: 2017
    },
    boatSailNumber: 181,
    laps: 3,
    pursuitFinishPosition: undefined,
    finishTime: 2161,
    finishCode: FinishCode { code: undefined },
    classCorrectedTime: 2100,
    handicapPI: NaN,
    handicapPH: NaN
  },
 
 */
function calculateClassCorrectedTime(PY, finishTime, lapsCompleted, lapsToUse) {
    return lapsCompleted ? Math.round(finishTime * lapsToUse * 1000 / (lapsCompleted * PY)) : undefined;
}

export default class CorrectedResult extends Result {
    static fromResult(result) {
        assertType(result, Result);
        return new CorrectedResult(result.race, result.helm, result.boatClass, result.boatSailNumber, result.laps, result.pursuitFinishPosition, result.finishTime, result.finishCode, new StoreObject(result));
    }

    calculateClassCorrectedTime(raceMaxLaps) {
        let boatClass = this.getBoatClass();
        this.classCorrectedTime = this.finishCode.validFinish()
            ? calculateClassCorrectedTime(boatClass.getPY(), this.getFinishTime(), this.getLaps(), raceMaxLaps)
            : undefined;
    }

    /**
     * handicapPI is the percentage change in time (or PY) required for helm to finish at standard corrected time.
     * // handicapPH is the absolute change in boat/class PY required for helm to finish at standard corrected time.
     */
    calculatePersonalHandicap(standardCorrectedTime) {
        this.handicapPI = (this.classCorrectedTime / standardCorrectedTime - 1) * 100;
        this.handicapPH = this.handicapPI * this.getBoatClass().getPY() / 100;
    }

    sortByCorrectedFinishTime(otherResult) {
        assertType(otherResult, CorrectedResult);
        if (this.classCorrectedTime === otherResult) {
            return 0;
        }
        return this.classCorrectedTime > (otherResult.classCorrectedTime || 0) ? 1 : -1;
    }

    getClassCorrectedTime() {
        return this.classCorrectedTime;
    }
}

import { assertType, generateId, getURLDate } from "../../src/common.js";
import CorrectedResult from "../../src/store/types/CorrectedResult.js";
import Helm from "../../src/store/types/Helm.js";
import SeriesPoints from "../../src/store/types/SeriesPoints.js";
import MutableRaceFinish from "../../src/store/types/MutableRaceFinish.js";
import StoreObject from "../../src/store/types/StoreObject.js";
import ResultPoints from "../../src/store/types/ResultPoints.js";

export default class PYUpload extends StoreObject {
  constructor(seriesPoints, raceFinish, result, resultPoints) {
    assertType(seriesPoints, SeriesPoints);
    assertType(raceFinish, MutableRaceFinish);
    assertType(result, CorrectedResult);
    assertType(resultPoints, ResultPoints);

    super({});
    this.correctedResult = result;
    this.raceFinish = raceFinish;
    this.seriesPoints = seriesPoints;
    this.resultPoints = resultPoints;
  }

  static getId(result) {
    return generateId("PYUpload", [
      CorrectedResult.getId(result.correctedResult),
    ]);
  }

  static fromSeriesPointsFinish(
    seriesPoints,
    raceFinish,
    correctedResult,
    resultPoints
  ) {
    return new PYUpload(
      seriesPoints,
      raceFinish,
      correctedResult,
      resultPoints
    );
  }

  static sheetHeaders() {
    return [
      "Event Name",
      "Race Number",
      "Race Date",
      "Start Name",
      "Rank",
      "SailNo",
      "Helm",
      "Crew",
      "Class",
      "pn",
      "laps",
      "elapsed",
      "corrected",
      "persons",
      "rig",
      "spin",
    ];
  }

  getFinishPosition() {
    return this.resultPoints.racePoints;
  }

  getEventName() {
    const seasonName = this.seriesPoints.getSeasonName();
    const seriesName = this.seriesPoints.getSeriesName();
    return `${seasonName} ${seriesName}`;
  }

  //   static fromStore(storeResult, getHelm, getBoatClassForRace) {
  // /*

  //             // "Date": getURLDate(this.race.getDate()),
  //             // "Race Number": this.race.getNumber(),
  //             // "Helm": Helm.getId(this.helm),
  //             "Sail Number": this.boatSailNumber,
  //             "Class": this.boatClass.getClassName(),
  //             "Laps": this.laps,
  //             "Pursuit Finish Position": this.pursuitFinishPosition,
  //             "Finish Time": this.finishTime,
  //             "Finish Code": this.finishCode.getCode(),
  //             ...super.toStore(this),
  //             */

  //     let {
  //         "Date": dateString,
  //         "Race Number": raceNumber,
  //         "Helm": helmId,
  //         "Sail Number": boatSailNumber,
  //         "Class": boatClassName,
  //         "Laps": laps,
  //         "Pursuit Finish Position": pursuitFinishPosition,
  //         "Finish Time": finishTime,
  //         "Finish Code": finishCodeString,
  //     } = storeResult;
  //     const race = new Race(parseURLDate(dateString), parseInt(raceNumber));
  //     const finishCode = new FinishCode(finishCodeString);
  //     return new Result(race, getHelm(helmId), getBoatClassForRace(boatClassName, race), parseInt(boatSailNumber), parseIntOrUndefined(laps), parseIntOrUndefined(pursuitFinishPosition), parseIntOrUndefined(finishTime), finishCode, StoreObject.fromStore(storeResult));
  // }

  toStore() {
    return {
      "Event Name": this.getEventName(),
      "Race Number": this.correctedResult.race.getNumber(),
      "Race Date": getURLDate(this.correctedResult.race.getDate()),
      "Start Name": "Handicap",
      Rank: this.getFinishPosition(),
      SailNo: this.correctedResult.boatSailNumber,
      Helm: Helm.getId(this.correctedResult.helm),
      Crew:
        this.correctedResult.getBoatClass().boatConfiguration.crew > 1
          ? "Unknown"
          : "",
      Class: this.correctedResult.getBoatClass().getClassName(),
      pn: this.correctedResult.getBoatClass().getPY(),
      laps: this.correctedResult.laps,
      elapsed: this.correctedResult.finishTime,
      corrected: this.correctedResult.classCorrectedTime,
      persons: this.correctedResult.getBoatClass().boatConfiguration.crew,
      rig: this.correctedResult.getBoatClass().boatConfiguration.rig,
      spin: this.correctedResult.getBoatClass().boatConfiguration.spinnaker,
    };
  }

  toJSON() {
    return this.toStore();
  }
}

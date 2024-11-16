import { assertType, generateId, getURLDate } from "../../common.js";
import CorrectedResult from "./CorrectedResult.js";
import Helm from "./Helm.js";
import SeriesPoints from "./SeriesPoints.js";
import MutableRaceFinish from "./MutableRaceFinish.js";
import StoreObject from "./StoreObject.js";
import ResultPoints from "./ResultPoints.js";

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

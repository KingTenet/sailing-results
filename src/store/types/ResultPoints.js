import {
  assertType,
  AutoMap,
  groupBy,
  flatten,
  average,
  mapGroupBy,
} from "../../common.js";
import CorrectedResult from "./CorrectedResult.js";
import Helm from "./Helm.js";
import HelmResult from "./HelmResult.js";
import Race from "./Race.js";
import MutableRaceFinish from "./MutableRaceFinish.js";
import Result from "./Result.js";
import Series from "./Series.js";
import SeriesRace from "./SeriesRace.js";
import StoreObject from "./StoreObject.js";

export default class ResultPoints extends HelmResult {
  constructor(result, racePoints, oodPoints, pnsPoints, isCounted = true) {
    super(result.race, result.helm, StoreObject.fromStore({}));
    this.result = result;
    this.racePoints = racePoints;
    this.oodPoints = oodPoints;
    this.pnsPoints = pnsPoints;
    this.isCounted = isCounted;
  }

  getTotal() {
    return this.racePoints + this.oodPoints + this.pnsPoints;
  }

  sortAllPointsDesc(secondPoints) {
    return this.getTotal() - secondPoints.getTotal();
  }

  isPNS() {
    return Boolean(this.pnsPoints);
  }

  isOOD() {
    return Boolean(this.oodPoints);
  }

  isDNF() {
    return Boolean(this.result?.finishCode?.validFinish());
  }

  static getBoatClassName(points) {
    const boatClass = ResultPoints.getBoatClass(points);
    return boatClass ? boatClass.getClassName() : undefined;
  }

  static getBoatClass(points) {
    if (!points.result || !(points.result instanceof Result)) {
      return undefined;
    }
    return points.result.getBoatClass();
  }

  static getPersonalHandicapForRace(points, race) {
    if (!points.result || !(points.result instanceof CorrectedResult)) {
      return undefined;
    }
    return points.result.getRollingHandicapsAtRace(race);
  }

  static fromPoints(points, isCounted) {
    return new ResultPoints(
      points.result,
      points.racePoints,
      points.oodPoints,
      points.pnsPoints,
      isCounted
    );
  }

  static aggregate(resultPoints, countedOnly = true) {
    resultPoints.forEach((rp) => assertType(rp, ResultPoints));
    return resultPoints.reduce(
      (acc, rp) => acc + (countedOnly && !rp.isCounted ? 0 : rp.getTotal()),
      0
    );
  }
}

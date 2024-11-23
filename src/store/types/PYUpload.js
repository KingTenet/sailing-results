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
        resultPoints,
    ) {
        return new PYUpload(
            seriesPoints,
            raceFinish,
            correctedResult,
            resultPoints,
        );
    }

    static sheetHeaders() {
        //Class	Race Number	Race Date	Start Name	Rank	SailNo	Helm	Crew	pn	Laps	Elapsed	Corrected	Persons	Rig	Spin
        return [
            "Class",
            "Race Number",
            "Race Date",
            "Start Name",
            "Rank",
            "SailNo",
            "Helm",
            "Crew",
            "pn",
            "Laps",
            "Elapsed",
            "Corrected",
            "Persons",
            "Rig",
            "Spin",
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
            Class: this.correctedResult.getBoatClass().getClassName(),
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
            pn: this.correctedResult.getBoatClass().getPY(),
            Laps: this.correctedResult.laps,
            Elapsed: this.correctedResult.finishTime,
            Corrected: this.correctedResult.classCorrectedTime,
            Persons: this.correctedResult.getBoatClass().boatConfiguration.crew,
            Rig: this.correctedResult.getBoatClass().boatConfiguration.rig,
            Spin: this.correctedResult.getBoatClass().boatConfiguration
                .spinnaker,
        };
    }

    toJSON() {
        return this.toStore();
    }
}

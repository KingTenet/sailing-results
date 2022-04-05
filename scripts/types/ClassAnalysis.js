import { assert, assertType, generateId, getURLDate } from "../../src/common.js";
import StoreObject from "../../src/store/types/StoreObject.js";
import BoatClass from "../../src/store/types/BoatClass.js";
import { calculatePIFromPersonalHandicap } from "../../src/common/personalHandicapHelpers.js";
import CorrectedResult from "../../src/store/types/CorrectedResult.js";
import MutableRaceFinish from "../../src/store/types/MutableRaceFinish.js";

const MAX_PI_WITHIN_105_SCT = 5;

export default class ClassAnalysis extends StoreObject {
    constructor(raceFinish, boatClass, metadata) {
        super(metadata);
        assertType(raceFinish, MutableRaceFinish);
        assertType(boatClass, BoatClass);

        this.boatClass = boatClass;
        this.raceFinish = raceFinish;
        this.finishers = ClassAnalysis.getFinishersForClass(raceFinish, boatClass);
    }

    static getId(classAnalysis) {
        assertType(classAnalysis, ClassAnalysis);
        return generateId(ClassAnalysis, [BoatClass.getId(classAnalysis.boatClass), MutableRaceFinish.getId(classAnalysis.raceFinish)]);
    }

    getPIForResult(result) {
        return calculatePIFromPersonalHandicap(this.boatClass.getPY(), result.getPersonalHandicapFromRace());
    }

    getFinishersWithin105SCT() {
        return this.finishers.filter((result) => this.getPIForResult(result) < MAX_PI_WITHIN_105_SCT);
    }

    static getFinishersForClass(raceFinish, boatClass) {
        return raceFinish.getCorrectedResults()
            .filter((result) => result.isValidFinish())
            .filter((result) => result.getBoatClass().getClassName() === boatClass.getClassName());
    }

    static getTotalPH(finishers) {
        return finishers.reduce((acc, result) => acc + result.getPersonalHandicapFromRace(), 0);
    }

    static fromRaceFinishResults(results) {
        assert(results.length > 0);
        results.forEach((result) => assertType(result, CorrectedResult));
        const firstResult = results[0];
        const raceFinish = firstResult.raceFinish;
        return new ClassAnalysis(raceFinish, firstResult.getBoatClass(), StoreObject.fromStore({}));
    }

    static sheetHeaders() {
        return [
            "Date",
            "Race Number",
            "Class",
            "PY",
            "Total PH",
            "Finishers",
            "Total PH within 105",
            "Finishers within 105",
            "RYA Approved SCT",
            ...StoreObject.sheetHeaders(),
        ];
    }

    toStore() {
        const totalPH = ClassAnalysis.getTotalPH(this.finishers);
        // if (this.finishers.length && !totalPH) {
        //     debugger;
        // }
        const finishersWithin105 = this.getFinishersWithin105SCT();
        const totalPHWithin105 = ClassAnalysis.getTotalPH(finishersWithin105);

        return {
            "Date": getURLDate(this.raceFinish.getDate()),
            "Race Number": this.raceFinish.getNumber(),
            "Class": this.boatClass.getClassName(),
            "PY": this.boatClass.getPY(),
            "Total PH": totalPH,
            "Finishers": this.finishers.length,
            "Total PH within 105": totalPHWithin105,
            "Finishers within 105": finishersWithin105.length,
            "RYA Approved SCT": this.raceFinish.ryaApprovedSCT ? "TRUE" : "FALSE",
            ...super.toStore(this),
        };
    }
}

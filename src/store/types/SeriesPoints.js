import { assertType, AutoMap, groupBy, flatten, average, mapGroupBy } from "../../common.js";
import CorrectedResult from "./CorrectedResult.js";
import Helm from "./Helm.js";
import HelmResult from "./HelmResult.js";
import Race from "./Race.js";
import MutableRaceFinish from "./MutableRaceFinish.js";
import Result from "./Result.js";
import Series from "./Series.js";
import SeriesRace from "./SeriesRace.js";
import StoreObject from "./StoreObject.js";

const USE_PH_FROM_SERIES_START = true;

class AsciiTable {
    constructor(columnHeaders, rowHeaders, cells) {
        this.cells = cells;
        this.columnHeaders = columnHeaders;
        this.rowHeaders = rowHeaders;
        this.totalColumnSize = 200; // chars
        this.rowHeadersWidth = 50;
        this.columnSize = Math.ceil((this.totalColumnSize - (this.rowHeadersWidth * rowHeaders.length)) / this.cells[0].length);

        this.columnSep = " ";
        this.rowSep = " ";
    }

    pad(str = "", char, length) {
        return [...str, ...(new Array(length)).fill(char)].join("").slice(0, length);
    }

    getRow(rowCells, columnWidth) {
        return `${this.columnSep} ` +
            rowCells.map((value, key) => this.pad(value, " ", key < this.rowHeaders.length ? this.rowHeadersWidth : columnWidth)).join(` ${this.columnSep} `) +
            ` ${this.columnSep}`
    }

    getTable() {
        const allRows = [];
        const padRowHeaders = (new Array(this.rowHeaders.length)).fill("");
        let headerRowLength;
        const rowSep = () => [...new Array(headerRowLength).fill(this.rowSep)].join("");

        this.columnHeaders.forEach((columnHeader) => {
            const headerRow = this.getRow([...padRowHeaders, ...columnHeader], this.columnSize - 3)
            headerRowLength = headerRow.length;
            allRows.push(headerRow);
            allRows.push(rowSep());
        });

        const rows = this.cells.reduce((prevRows, row, key) => [
            ...prevRows,
            this.getRow([...this.rowHeaders.map((rowHeader) => rowHeader[key]), ...row.map((num) => num === undefined ? "" : num)], this.columnSize - 3),
            rowSep(),
        ], []);

        return [rowSep(), ...allRows, ...rows];
    }
}


class ResultPoints extends HelmResult {
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

    static getBoatClassName(points) {
        const boatClass = ResultPoints.getBoatClass(points);
        return boatClass
            ? boatClass.getClassName()
            : undefined;
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
        return new ResultPoints(points.result, points.racePoints, points.oodPoints, points.pnsPoints, isCounted);
    }

    static aggregate(resultPoints, countedOnly = true) {
        resultPoints.forEach((rp) => assertType(rp, ResultPoints));
        return resultPoints.reduce((acc, rp) => acc + ((countedOnly && !rp.isCounted) ? 0 : rp.getTotal()), 0);
    }
}

export default class SeriesPoints extends Series {
    constructor(series, seriesRaces, raceFinishes, oods) {
        assertType(series, Series);
        super(series.getSeasonName(), series.getSeriesName());
        seriesRaces.forEach((seriesRace) => assertType(seriesRace, SeriesRace));
        raceFinishes.forEach((raceFinish) => assertType(raceFinish, MutableRaceFinish));
        this.seriesRaces = seriesRaces;
        this.raceFinishes = raceFinishes;
        this.plannedRaces = this.seriesRaces.length;
        this.finishedRaces = this.raceFinishes.length;
        this.racesToQualify = Math.ceil(this.plannedRaces / 2 + 1);

        this.validateSeriesRaces();
        this.validateRaceFinishes();
    }

    validateSeriesRaces() {
        const seriesId = Series.getId(this);
        if (!this.seriesRaces.map(SeriesRace.getSeriesId).every((id) => id === seriesId)) {
            throw new Error("All series races must be part of series");
        }
    }

    validateRaceFinishes() {
        const seriesRacesById = new Map(groupBy(this.seriesRaces, [SeriesRace.getRaceId]));
        if (!this.raceFinishes.map(Race.getId).every((id) => seriesRacesById.has(id))) {
            throw new Error("All race finishes must have an associated series race");
        }
    }

    getPoints(points, racesToCount, pointsNotScored, oodCount = 0) {
        console.log(racesToCount);
        console.log(pointsNotScored);
        console.log(oodCount);
        const pnsCount = Math.max(0, racesToCount - points.length - oodCount);
        const pointsCount = racesToCount - pnsCount - oodCount;
        const totalPoints = points
            .sort((a, b) => b - a)
            .slice(-pointsCount)

        const OODpointsPerRace = Math.round(average(totalPoints) * 10) / 10; // Round to 1dp

        return [
            (new Array(pnsCount)).fill(pointsNotScored),
            (new Array(oodCount)).fill(OODpointsPerRace),
            totalPoints,
        ];
    }

    getOODPointsFromResults(results, oods, racesToCount) {
        const pnsCount = Math.max(0, racesToCount - results.length - oods.length);
        const pointsCount = racesToCount - pnsCount - oods.length;
        const totalPoints = results
            .map(([, points]) => points)
            .sort((a, b) => b - a)
            .slice(-pointsCount)

        return Math.round(average(totalPoints) * 10) / 10; // Round to 1dp
    }

    getFinishesWithResults(date) {
        return this.raceFinishes
            .filter((race) => race.isBefore(new Race(date, 1)))
            .filter((race) => race.hasResults());
    }

    getPersonalHandicapRacesToCount(date) {
        return SeriesPoints.getRacesToCount(
            this.getFinishesWithResults(date)
                .filter((race) => race.getSCT())
        );
    }

    getClassHandicapRacesToCount(date) {
        return SeriesPoints.getRacesToCount(
            this.getFinishesWithResults(date)
        );
    }

    static getRacesToCount(finishes) {
        return Math.ceil((finishes.length + 1) / 2);
    }

    /**
     * Build a set of results for all helms that took raced in series.
     * If they were an OOD, create an OOD result for them (and associated points).
     * If they didn't take part in race, create a PNS result for them (and associated points).
     * Flag points that won't be counted (if the helm has sailed more than races to count)
     */
    getPointsByAllResults(date = new Date(), byClassHandicap = true) {
        const finishes = this.raceFinishes
            .filter((race) => race.isBefore(new Race(date, 1)))
            .sort((raceA, raceB) => raceA.sortByRaceAsc(raceB));

        const getPointsByResult = (raceFinish) => {
            if (byClassHandicap) {
                return raceFinish.getClassCorrectedPointsByResult();
            }
            if (USE_PH_FROM_SERIES_START) {
                // Use PH from first race in series..
                return raceFinish.getPersonalCorrectedPointsByResult(finishes.at(0));
            }
            return raceFinish.getPersonalCorrectedPointsByResult();
        };

        const finishedRaces = finishes
            .filter((race) => race.hasResults())
            .filter((race) => byClassHandicap || race.getSCT());

        const racesToCount = byClassHandicap
            ? this.getClassHandicapRacesToCount(date)
            : this.getPersonalHandicapRacesToCount(date);

        const pointsByRaceResult = flatten(finishedRaces.map((raceFinish) => getPointsByResult(raceFinish)));
        const pointsByHelm = new Map(groupBy(pointsByRaceResult, ([result]) => Result.getHelmId(result)));

        const raceResults = flatten(finishedRaces.map((raceFinish) => raceFinish.getCorrectedResults()));
        const allOODs = flatten(finishes.map((raceFinish) => raceFinish.getOODs()));

        const allHelms = groupBy(raceResults, Result.getHelmId).map(([, results]) => [results.at(0).getHelm(), results]);
        const allOODHelms = new Map(groupBy(allOODs, Result.getHelmId));

        const numberOfHelms = allHelms.length;
        const pointsNotScored = numberOfHelms + 1;

        const pointResultsMap = new AutoMap(ResultPoints.getId);
        for (let race of finishes) {
            if (race.hasResults() && (byClassHandicap || race.getSCT())) {
                for (let [helm] of allHelms) {
                    const pnsResult = HelmResult.fromHelmRace(helm, race);
                    pointResultsMap.upsert(new ResultPoints(pnsResult, 0, 0, pointsNotScored));
                }
                for (let [result, finishPoints] of getPointsByResult(race)) {
                    pointResultsMap.upsert(new ResultPoints(result, finishPoints, 0, 0));
                }
            }
            for (let oodResult of race.getOODs()) {
                const helmId = Result.getHelmId(oodResult);
                if (pointsByHelm.has(helmId)) {
                    const oodPoints = this.getOODPointsFromResults(pointsByHelm.get(helmId), allOODHelms.get(helmId), racesToCount)
                    pointResultsMap.upsert(new ResultPoints(oodResult, 0, oodPoints, 0));
                }
                else {
                    console.log(`Warning: no points found for ${helmId} for ${Race.getId(race)}`);
                }
            }
        }

        const allPointResults = [...pointResultsMap].map(([, pointResult]) => pointResult);
        return flatten(groupBy(allPointResults, HelmResult.getHelmId)
            .map(([, helmPointResults]) => helmPointResults
                .sort((a, b) => a.sortAllPointsDesc(b))
                .map((pointResult, key) => ResultPoints.fromPoints(pointResult, Boolean(key < racesToCount))))
        )
    }

    getPersonalHandicapPoints(date) {
        return this.getPointsByAllResults(date, false);
    }

    getClassHandicapPoints(date) {
        return this.getPointsByAllResults(date, true);
    }

    summarizeByClassHandicap(date = new Date()) {
        console.log(`Series Summary: ${this.getSheetName()}`);
        console.log(`  By class handicap`);
        if (!this.allClassHandicapPoints) {
            this.allClassHandicapPoints = this.getClassHandicapPoints(date);
        }
        const racesToCount = this.getClassHandicapRacesToCount(date);
        console.log(`  Races to count: ${racesToCount}`);
        this.summarizeHelms(this.allClassHandicapPoints);
        const seriesTable = this.seriesTable(this.allClassHandicapPoints);
        console.log(seriesTable.getTable().join("\n"));
    }

    summarizeByPersonalHandicap(date = new Date()) {
        console.log(`Series Summary: ${this.getSheetName()}`);
        console.log(`  By personal handicap`);
        if (!this.allPersonalHandicapPoints) {
            this.allPersonalHandicapPoints = this.getPersonalHandicapPoints(date);
        }
        const racesToCount = this.getPersonalHandicapRacesToCount(date);
        console.log(`  Races to count: ${racesToCount}`);
        this.summarizeHelms(this.allPersonalHandicapPoints);
        const seriesTable = this.seriesTable(this.allPersonalHandicapPoints);
        console.log(seriesTable.getTable().join("\n"));
    }

    getPoints(date = new Date()) {
        if (!this.allClassHandicapPoints) {
            this.allClassHandicapPoints = this.getClassHandicapPoints(date);
        }

        if (!this.allPersonalHandicapPoints) {
            this.allPersonalHandicapPoints = this.getPersonalHandicapPoints(date);
        }
    }

    summarize(date = new Date()) {
        this.summarizeByClassHandicap(date);
        this.summarizeByPersonalHandicap(date);
    }

    summarizeHelms(allResultPoints) {
        groupBy(allResultPoints, HelmResult.getHelmId)
            .map(([helmId, resultsPoints]) => [helmId, ResultPoints.aggregate(resultsPoints)])
            .sort(([, a], [, b]) => a - b)
            .forEach(([helmId, points]) => {
                console.log(`           ${helmId}: ${points}`);
            })
    }

    seriesTable(allResultPoints) {
        const allResultsPointsSortedByRace = allResultPoints.sort(HelmResult.sortByRaceAsc);
        const firstRacePointsOfSeries = allResultsPointsSortedByRace.at(0).getRace();
        const allResultsByHelm = mapGroupBy(allResultPoints, [HelmResult.getHelmId], ResultPoints.aggregate);
        // const allBoatsByHelm = groupBy(this.allResultPoints, [HelmResult.getHelmId, ResultPoints.getBoatClassName]);
        const helmPointsMap = mapGroupBy(allResultPoints, [HelmResult.getHelmId, HelmResult.getRaceId, ResultPoints.getBoatClassName]);

        // const pyMap = mapGroupBy(
        //     allResultPoints,
        //     [ResultPoints.getBoatClassName],
        //     (points) => points && points.length
        //         ? ResultPoints.getBoatClass(points.at(0))?.getPY()
        //         : undefined
        // );

        const allBoatsByHelm = groupBy(
            allResultPoints,
            [HelmResult.getHelmId, ResultPoints.getBoatClassName],
            (points) => points && points.length
                ? [
                    ResultPoints.getPersonalHandicapForRace(points.at(0), firstRacePointsOfSeries),
                    ResultPoints.getBoatClass(points.at(0))?.getPY()
                ]
                : undefined
        );

        const sortedRaces = this.seriesRaces.map((sr) => sr.getRace()).sort((a, b) => a.sortByRaceAsc(b));

        const allCells = [];
        let columnIds = sortedRaces.map(Race.getId);
        let columnHeaders = columnIds.map((raceId) => Race.fromId(raceId).prettyPrintTable())

        let rowHeaders = allBoatsByHelm.reduce((acc, [helmId, classes]) => [
            ...acc,
            ...classes.map(([className, [PH, classPY]]) => [helmId, className, PH, classPY]),
        ], [])
            .sort(([helmA, classA], [helmB, classB]) => {
                return allResultsByHelm.get(helmA) !== allResultsByHelm.get(helmB)
                    ? allResultsByHelm.get(helmA) - allResultsByHelm.get(helmB)
                    : classA - classB
                    ;
            });

        const rowHeadersHelm = rowHeaders.reduce((acc, [helmId]) => [...acc, helmId === acc.at(-1) ? "" : helmId], []);
        const rowHeadersBoat = rowHeaders
            // .map((blah) => {
            //     let [helmId, className, PHPI, classPY] = blah;
            //     try {
            //         className
            //             ? [helmId, className, PHPI[0], classPY, PHPI[0] - classPY].join(", ")
            //             : `${helmId}`
            //     }
            //     catch (err) {
            //         console.log(helmId, className, PHPI, classPY);
            //         console.log(this);
            //         debugger;
            //         throw err;
            //     }
            //     return blah;
            // })
            .map(([helmId, className, PHPI = [], classPY]) => className
                ? [helmId, className, PHPI[0], classPY, PHPI[0] - classPY].join(", ")
                : `${helmId}`
            );

        for (let [rowKey, [helmId, className]] of rowHeaders.entries()) {
            allCells[rowKey] = [];
            for (let [columnKey, raceId] of columnIds.entries()) {
                // const helmPoints = helmPointsMap.get(helmId).get(raceId);
                const racePoints = helmPointsMap.get(helmId).get(raceId);
                const helmPoints = racePoints ? racePoints.get(className) : undefined;

                allCells[rowKey][columnKey] = helmPoints
                    ? helmPoints[0].isCounted
                        ? `${helmPoints[0].getTotal()}`
                        : `(${helmPoints[0].getTotal()})`
                    : undefined;
            }
        }

        return new AsciiTable([columnHeaders], [rowHeadersBoat], allCells);
    }

    static fromSeriesRaces(seriesRaces, raceFinishes) {
        if (!seriesRaces.length) {
            throw new Error("Series points requires at least one series race");
        }
        const series = Series.fromSeriesRace(seriesRaces[0]);
        return new SeriesPoints(series, seriesRaces, raceFinishes);
    }
}

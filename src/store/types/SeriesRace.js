import StoreObject from "./StoreObject.js";
import Race from "./Race.js";
import { assertType, parseURLDate, getURLDate, generateId, parseISOString, getISOStringFromDate, parseBoolean } from "../../common.js";
import Series from "./Series.js";

export default class SeriesRace extends StoreObject {
    constructor(series, race, lastImported, isPursuit, metaData) {
        super(metaData);
        this.series = assertType(series, Series);
        this.race = assertType(race, Race);
        this.isPursuitRace = assertType(isPursuit, "boolean");
        // this.lastImported = assertType(lastImported, Date);
    }

    static getId(seriesRace) {
        assertType(seriesRace, SeriesRace);
        return generateId("SeriesRace", [Series.getId(seriesRace.series), Race.getId(seriesRace.race)]);
    }

    static getRaceId(seriesRace) {
        assertType(seriesRace, SeriesRace);
        return Race.getId(seriesRace.race);
    }

    static getSeriesId(seriesRace) {
        assertType(seriesRace, SeriesRace);
        return Series.getId(seriesRace.series);
    }

    static sheetHeaders() {
        return [
            "Season",
            "Series",
            "Race Date",
            "Race Number",
            "Last Imported",
            "Is Pursuit",
            ...StoreObject.sheetHeaders(),
        ];
    }

    static fromStore(storeSeriesRace) {
        let {
            Season: season,
            Series: series,
            "Race Date": raceDate,
            "Race Number": raceNumber,
            "Last Imported": lastImported,
            "Is Pursuit": isPursuit,
        } = storeSeriesRace;

        const race = new Race(parseURLDate(raceDate), parseInt(raceNumber));
        const raceSeries = new Series(season, series);
        return new SeriesRace(raceSeries, race, parseISOString(lastImported, new Date(0)), parseBoolean(isPursuit), StoreObject.fromStore(storeSeriesRace));
    }


    isPursuit() {
        return this.isPursuitRace;
    }

    getSeries() {
        return this.series;
    }

    getRace() {
        return this.race;
    }

    toStore() {
        return {
            Season: this.series.getSeasonName(),
            Series: this.series.getSeriesName(),
            "Race Date": getURLDate(this.race.getDate()),
            "Race Number": this.race.getNumber(),
            "Last Imported": getISOStringFromDate(this.lastImported),
            "Is Pursuit": this.isPursuit(),
            ...super.toStore(this),
        };
    }
}

import { assertType, generateId, fromId } from "../../common.js";
import SeriesRace from "./SeriesRace.js";

export default class Series {
    constructor(season, series) {
        this.season = assertType(season, "string");
        this.series = assertType(series, "string");
    }

    static getId(series) {
        assertType(series, Series);
        return generateId(Series, [series.season, series.series]);
    }

    static fromSeriesRace(seriesRace) {
        assertType(seriesRace, SeriesRace);
        return new Series(seriesRace.season, seriesRace.series)
    }

    static fromId(seriesId) {
        const [season, series] = fromId(seriesId);
        return new Series(season, series);
    }

    getSeasonName() {
        return this.season;
    }

    getSeriesName() {
        return this.series;
    }
}

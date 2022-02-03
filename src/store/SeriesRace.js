import StoreObject from "./StoreObject.js";
import Race from "./Race.js";
import { assertType, transformSheetsDateToDate } from "../common.js";
import { parseURLDate, getURLDate, generateId, parseISOString, getISOStringFromDate } from "../common.js";

export default class SeriesRace extends StoreObject {
    constructor(season, series, race, lastImported, metaData) {
        super(metaData);
        this.season = assertType(season, "string");
        this.series = assertType(series, "string");
        this.race = assertType(race, Race);
        this.lastImported = assertType(lastImported, Date);
    }

    static getId(seriesRace) {
        assertType(seriesRace, SeriesRace);
        return generateId(SeriesRace, [seriesRace.season, seriesRace.series, Race.getId(seriesRace.race)]);
    }

    static fromStore(storeSeriesRace) {
        let {
            Season: season,
            Series: series,
            "Race Date": raceDate,
            "Race Number": raceNumber,
            "Last Imported": lastImported
        } = storeSeriesRace;

        const race = new Race(parseURLDate(raceDate), parseInt(raceNumber));
        return new SeriesRace(season, series, race, parseISOString(lastImported, new Date(0)), StoreObject.fromStore(storeSeriesRace));
    }

    static fromUser(season, series, raceDate, raceNumber, lastImported = new Date(0)) {
        const race = new Race(raceDate, raceNumber);
        return new SeriesRace(season, series, race, lastImported, StoreObject.fromStore({}))
    }

    toStore() {
        return {
            Season: this.season,
            Series: this.series,
            "Race Date": getURLDate(this.race.getDate()),
            "Race Number": this.race.getNumber(),
            "Last Imported": getISOStringFromDate(this.lastImported),
            ...super.toStore(this),
        };
    }
}

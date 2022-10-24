import { assertType, generateId, parseBoolean } from "../../src/common.js";
import StoreObject from "../../src/store/types/StoreObject.js";
import Helm from "../../src/store/types/Helm.js";
import Series from "../../src/store/types/Series.js";

export default class HelmSeries extends StoreObject {
    constructor(series, helm, firstSeries, metadata) {
        super(metadata);
        this.series = assertType(series, Series);
        this.helm = assertType(helm, Helm);
        this.firstSeries = assertType(firstSeries, "boolean");
    }

    static getId(helmSeries) {
        assertType(helmSeries, HelmSeries);
        return generateId("HelmSeries", [Helm.getId(helmSeries.helm), Series.getId(helmSeries.series)]);
    }

    static sheetHeaders() {
        return [
            "Season",
            "Series",
            "Helm",
            "First Series",
            ...StoreObject.sheetHeaders(),
        ];
    }

    static fromStore(storeResult, getHelm) {
        let {
            "Season": season,
            "Series": series,
            "Helm": helmId,
            "First Series": firstSeries,
        } = storeResult;
        return new HelmSeries(new Series(season, series), getHelm(helmId), parseBoolean(firstSeries), StoreObject.fromStore(storeResult));
    }

    static fromSeriesHelm(series, helm, firstSeries) {
        return new HelmSeries(series, helm, firstSeries, StoreObject.fromStore({}));
    }

    toJSON() {
        return this.toStore();
    }

    toStore() {
        return {
            "Season": this.series.season,
            "Series": this.series.series,
            "Helm": Helm.getId(this.helm),
            "First Series": this.firstSeries,
            ...super.toStore(this),
        };
    }
}

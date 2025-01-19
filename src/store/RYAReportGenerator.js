import { AutoMap } from "@/common.js";
import RemoteStore from "./RemoteStore.js";
import StoreWrapper from "./StoreWrapper.js";
import CorrectedResult from "./types/CorrectedResult.js";
import PYUpload from "./types/PYUpload.js";
import Race from "./types/Race.js";

const OUTPUT_DNFS = false;

function getCompletedSeasons(stores, now = new Date()) {
    const lastSeasonSeries = "Autumn";
    const tomorrowsRace = new Race(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        1,
    );

    const completedSeries = stores.seriesPoints.filter(([, seriesPoints]) =>
        seriesPoints.seriesRaces.every(({ race }) =>
            race.isBefore(tomorrowsRace),
        ),
    );

    return completedSeries
        .filter(
            ([, seriesPoints]) =>
                seriesPoints.getSeriesName() === lastSeasonSeries,
        )
        .map(([, seriesPoints]) => [
            seriesPoints.seriesRaces
                .map(({ race }) => race)
                .sort((a, b) => a.sortByRaceAsc(b))
                .at(-1),
            seriesPoints.getSeriesName(),
            seriesPoints.getSeasonName(),
        ])
        .sort(([a], [b]) => a.sortByRaceAsc(b));
}

function getNextPossibleRace(race) {
    return new Race(
        new Date(
            race.date.getFullYear(),
            race.date.getMonth(),
            race.date.getDate() + 1,
        ),
        1,
    );
}

async function newReportReady(metaStore, latestSeason) {
    const output = (await metaStore.getAllRows())[0];
    return !output || output["Last Written Sheet"] !== latestSeason;
}

function generateResultsForReport(stores, completedSeasons) {
    const firstPossibleRaceOfCompletedSeason =
        completedSeasons.length > 1
            ? getNextPossibleRace(completedSeasons.at(-2)[0])
            : undefined;

    const firstPossibleRaceOfCurrentSeason = getNextPossibleRace(
        completedSeasons.at(-1)[0],
    );

    const filterLastCompletedSeason = (race) =>
        race.isBefore(firstPossibleRaceOfCurrentSeason) &&
        (!firstPossibleRaceOfCompletedSeason ||
            firstPossibleRaceOfCompletedSeason.isBefore(race));

    const results = new AutoMap(PYUpload.getId);
    stores.seriesPoints.map(([, seriesPoints]) => {
        seriesPoints.getPoints();
        seriesPoints.allClassHandicapPoints.forEach((points) => {
            if (!OUTPUT_DNFS && !points.result.finishTime) {
                return;
            }

            if (!(points.result instanceof CorrectedResult)) {
                return;
            }

            if (!filterLastCompletedSeason(points.result.raceFinish)) {
                return;
            }

            results.upsert(
                PYUpload.fromSeriesPointsFinish(
                    seriesPoints,
                    points.result.raceFinish,
                    points.result,
                    points,
                ),
            );
        });
    });
    return [...results.values()];
}

export class RYAReportGenerator {
    constructor(stores) {
        this.stores = stores;
        this.metaStore = RemoteStore.retryCreateRemoteStore(
            stores.raceResultsDocument,
            "PY Upload Meta Data",
            true,
            ["Last Written Sheet"],
        );
    }

    async generatePYReports() {
        await this.promiseMetaStore;
        const completedSeasons = getCompletedSeasons(this.stores);
        const [, , latestCompletedYear] = completedSeasons.at(-1);
        const sheetName = `RYA PY - Frostbite ${
            latestCompletedYear - 1
        } to ${latestCompletedYear}`;

        const metaStore = await this.metaStore;
        if (!(await newReportReady(metaStore, sheetName))) {
            console.log(
                `PY data for RYA for ${sheetName} has already been uploaded`,
            );
            return;
        }

        const pyUploadStore = await StoreWrapper.create(
            false,
            sheetName,
            this.stores.raceResultsDocument,
            undefined,
            PYUpload,
            (storeResult) => this.stores.deserialiseResult(storeResult),
            undefined,
            true,
        );

        for (const result of generateResultsForReport(
            this.stores,
            completedSeasons,
        )) {
            pyUploadStore.add(result);
        }

        await metaStore.replace([{ "Last Written Sheet": sheetName }]);
        await pyUploadStore.sync();
        await pyUploadStore.clear();
    }
}

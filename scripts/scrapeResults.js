import cheerio from "cheerio";
import fetch from "node-fetch";
import { devAuth } from "./auth.js";
import { getSheetIdFromURL, getAllCellsFromSheet, getGoogleSheetDoc, parseISOString, mapGroupBy } from "../src/common.js"
// import ClubMember from "../src/store/types/ClubMember.js";
import StoreWrapper from "../src/store/StoreWrapper.js";
import bootstrapLocalStorage from "../src/bootstrapLocalStorage.js";
import Result from "../src/store/types/Result.js";
import Helm from "../src/store/types/Helm.js";
import Race from "../src/store/types/Race.js";
import { StoreFunctions, Stores } from "../src/store/Stores.js";
import BoatClass from "../src/store/types/BoatClass.js";
import FinishCode from "../src/store/types/FinishCode.js";

const expectedColumnHeaders = [
    "Helm",
    "Boat",
    "Rig",
    "PN",
    "Sail",
    "C/J/L/N",
    "Crew",
    "Fin Time",
    "Laps",
    "Cor Time",
    "Pos/Code",
    "Points",
    "PI%",
    "PH",
];

class AutoMap extends Map {
    constructor(getKey = JSON.stringify, getDefaultValue) {
        super();
        this.getKey = getKey;
        this.getDefaultValue = getDefaultValue;
    }

    upsert(obj, transform = (prev, obj, key) => obj) {
        let key = this.getKey(obj);
        if (!this.has(key) && this.getDefaultValue !== undefined) {
            return this.set(key, transform(this.getDefaultValue(obj), obj, key));
        }
        return this.set(key, transform(super.get(key), obj, key))
    }
}

const deepEquals = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const assert = (testResult, errMsg) => {
    if (testResult !== true) {
        throw new Error(errMsg);
    }
}

function mapScrapedResult({
    raceDate,
    raceNumber,
    name,
    sailNo,
    className,
    position,
    finishTimeTotalSeconds,
    DNFCode,
    ...rest
}) {
    return {
        ...rest,
        date: raceDate,
        raceNumber,
        name,
        helm: {
            name,
        },
        boat: {
            sailNumber: sailNo,
            className
        },
        finishPosition: position,
        finishTime: finishTimeTotalSeconds,
        finishCode: DNFCode,
    };
}

function getRowCellValues(dom, nth) {
    const cells = [];
    dom(`body > table > tbody > tr:nth-child(${nth}) > td`).each((index, element) => {
        cells.push(dom(element).text());
    });
    return cells;
}

function getAllRowsValues(dom, fromNthRow = 1) {
    let rowCount = 0
    let rowValues = [];
    dom(`body > table > tbody > tr`).each(() => rowCount += 1);
    for (let i = fromNthRow; i <= rowCount; i++) {
        rowValues[i - fromNthRow] = getRowCellValues(dom, i);
    }
    return rowValues;
}

function processCJLN(cjln) {
    return {
        lady: Boolean(cjln.toLowerCase().includes("l")),
        novice: Boolean(cjln.toLowerCase().includes("n")),
        cadet: Boolean(cjln.toLowerCase().includes("c")),
        junior: Boolean(cjln.toLowerCase().includes("j")),
    }
}

function processRig(rig) {
    return {
        crew: parseInt(rig.split("/")[0]),
        rig: rig.split("/")[1],
        spinnaker: rig.split("/")[2],
    }
}

function getRaceDateFromString(str) {
    if (str.includes("15/919")) {
        return ["15", "09", "19"];
    }
    return str.match(/(\d\d?)\/(\d\d?)\/\d?\d?(\d\d)/).slice(1);
}

function mapRowToResult(row) {
    let { lady, novice, junior, cadet } = processCJLN(row[5]);
    const helm = {
        name: row[0],
        lady,
        novice,
        junior,
        cadet,
    };

    let { spinnaker, crew, rig } = processRig(row[2]);

    const boatClass = {
        className: row[1],
        spinnaker,
        crew,
        rig,
        PN: row[3]
    }

    const boat = {
        class: boatClass,
        sailNo: parseInt(row[4]),
    };

    const boatCrew = row[6] ? row[6] : undefined;
    const finishTime = row[7].match(/(\d\d):(\d\d)/) || undefined;

    const positionInt = parseInt(row[10]);
    const position = (!Number.isNaN(positionInt) && positionInt) || undefined;
    const DNF = Boolean(Number.isNaN(positionInt));
    const DNFCode = (DNF && row[10]) || undefined;

    // if (!finishTime && !DNF) {
    //     throw new Error("Failed to process row");
    // }
    const finishTimeMinutes = finishTime && parseInt(finishTime[1]);
    const finishTimeSeconds = finishTime && parseInt(finishTime[2]);
    const finishTimeTotalSeconds = finishTime && finishTimeMinutes * 60 + finishTimeSeconds;
    const laps = row[8] ? parseInt(row[8]) : undefined;


    return {
        name: helm.name,
        lady: helm.lady,
        novice: helm.novice,
        junior: helm.junior,
        cadet: helm.cadet,
        className: boatClass.className,
        spinnaker,
        rig,
        pyCrew: crew,
        PN: parseInt(boatClass.PN),
        sailNo: parseInt(boat.sailNo),
        laps,
        finishTimeTotalSeconds,
        DNF,
        boatCrew,
        position,
        DNFCode,
        couldBePursuit: Boolean(!finishTime),
    }
}

function isValid({ name, className, PN, sailNo, position, laps, finishTimeTotalSeconds, DNF, couldBePursuit }) {
    const hasResultId = Boolean(name && className && !isNaN(PN) && !isNaN(sailNo));
    const hasResultValue = () => {
        if (couldBePursuit) {
            return DNF || position;
        }
        return DNF || (finishTimeTotalSeconds && laps);
    }
    return hasResultId && hasResultValue();
}


async function scrapePage(page) {
    const result = await fetch(page).then((response) => response.text());
    const dom = cheerio.load(result);

    const [
        seriesName,
        unused1,
        unused2,
        raceDateString,
        unused3,
        raceNumberString
    ] = getRowCellValues(dom, 3)

    const actualColumnHeaders = getRowCellValues(dom, 5);
    assert(deepEquals(actualColumnHeaders, expectedColumnHeaders), `Column mappings invalid for page ${page}`);
    const OODs = [];
    const helms = [];
    const results = [];
    let totalRows = 0;
    let totalIgnoredRows = 0;
    let personalResults = false;
    getAllRowsValues(dom, 5).forEach((row) => {

        totalRows++;
        if (personalResults || row.find((value) => value.toLowerCase().includes("personal"))) {
            personalResults = true;
            totalIgnoredRows++;
            return;
        }

        if (row[10] === "OOD") {
            OODs.push(row[0]);
        }

        if (row.length > 10) {
            let result = mapRowToResult(row);

            if (isValid(result)) {
                results.push(result);
            }
        }
    });

    let pursuit = results.every(({ couldBePursuit }) => couldBePursuit);

    // console.log(raceDateString);
    const [raceDay, raceMonth, raceYear] = getRaceDateFromString(raceDateString);
    console.log(raceDay, raceMonth, raceYear);
    const raceDate = parseISOString(`20${raceYear}-${`0${raceMonth}`.slice(-2)}-${`0${raceDay}`.slice(-2)}T00:00:00.000Z`);
    const raceNumber = parseInt(raceNumberString);

    let mappedResults = results.map((result) => ({ ...result, seriesName, raceDate, raceNumber, pursuit }))
    if (!mappedResults.length && (totalRows - OODs.length - 3 > 0)) {
        return [];
        throw new Error("No results");
    }
    let mappedOODs = OODs.map((ood) => ({ name: ood, seriesName, raceDate, raceNumber }))
    return [mappedResults, mappedOODs, pursuit];

}

const getSeriesURL = (year, series) => {
    return `http://www.nhebsc.org.uk/results/${year}%20${series.replace(" ", "%20")}_files`
}

const generateTabstripURL = (year, series) => {
    return `${getSeriesURL(year, series)}/tabstrip.htm`;
}

const generateURL = (year, series, num) => {
    return `${getSeriesURL(year, series)}/sheet${`00${num}`.slice(-3)}.htm`;
}

async function getURLSFromTabStrip(year, series) {
    const page = generateTabstripURL(year, series);
    const result = await fetch(page).then((response) => response.text());
    const dom = cheerio.load(result);
    // console.log(getAllRowsValues(dom, 1)[0].map((value, key) => [value, generateURL(year, series, key)])
    //     .filter(([value]) => !value.toLowerCase().includes("summary")))
    //     ;
    console.log(year, series);
    return getAllRowsValues(dom, 1)[0]
        .map((value, key) => [value, generateURL(year, series, key + 1)])
        .filter(([value]) => !value.toLowerCase().includes("summary"))
        .map(([_, url]) => url);
}


async function scrape() {
    const allRegularSeries = [
        // "Icicle",
        // "Spring",
        // "Early Summer",
        // "Late Summer",
        // "Autumn",
        // "Frostbite",
        "Wednesday Evening",
        "Pursuit",
    ];

    const years = [
        // Mappings invalid // 2013,
        // Mappings invalid // 2014,
        // 2015,
        // 2016,
        // 2017,
        // 2018,
        // 2019,
        2021,
    ];

    // const allRegularSeries = [
    //     "Late Summer",
    // ];

    // const years = [
    //     2019,
    // ];


    const allResults = [];
    const allFleetResults = [];
    const allPursuits = [];
    const allOODs = [];

    // const [boats, classes] = getBoats(results);
    // const normaliseResults = getNormalisedResults(results, helms, boats, classes);

    for (let year of years) {
        for (let series of allRegularSeries) {
            for (let url of (await getURLSFromTabStrip(year, series))) {
                const [results, OODs, pursuit] = await scrapePage(url);
                if (!results) {
                    continue;
                }
                if (pursuit) {
                    allPursuits.push(...results);
                    allResults.push(...results);
                }
                else {
                    allFleetResults.push(...results);
                    allResults.push(...results);
                }
                allOODs.push(...OODs);
            }
        }
    }

    //     fs.writeFileSync("fleet.json", JSON.stringify(allFleetResults));
    //     fs.writeFileSync("pursuits.json", JSON.stringify(allPursuits));
    //     fs.writeFileSync("oods.json", JSON.stringify(allOODs));
    // }

    // async function processResults() {
    //     let allFleetResults = JSON.parse(fs.readFileSync("fleet.json")).map(({ raceDate, ...rest }) => ({ raceDate: parseISOString(raceDate), ...rest }));;
    //     let allPursuits = JSON.parse(fs.readFileSync("pursuits.json")).map(({ raceDate, ...rest }) => ({ raceDate: parseISOString(raceDate), ...rest }));;
    //     let allOODs = JSON.parse(fs.readFileSync("oods.json")).map(({ raceDate, ...rest }) => ({ raceDate: parseISOString(raceDate), ...rest }));


    let allHelmResults = [...allFleetResults, ...allPursuits]
        .sort(({ raceDate: a }, { raceDate: b }) => a - b);

    // await appendHelmsSheet(getHelms(allHelmResults), outputSheetId, auth.clientEmail, auth.privateKey);

    return [allFleetResults.map(mapScrapedResult), allPursuits.map(mapScrapedResult), getHelms(allHelmResults), allOODs];
}

const getHelmId = ({ name }) => name;
const getHelmTypeId = ({ lady, novice, junior, cadet }) => JSON.stringify({ lady, novice, junior, cadet })

function getHelms(results) {
    let helmsTypes = new AutoMap(getHelmId, () => new AutoMap(getHelmTypeId));
    let helms = new AutoMap(getHelmId);

    for (let result of results.sort(({ raceDate: a }, { raceDate: b }) => a - b)) {
        // Group results by helm, then type
        // console.log(result);
        helmsTypes.upsert(result, (types) => types.upsert(result))
        helms.upsert(result, (prev, obj) => prev || obj);
    }

    for (let [helm, helmTypes] of [...helmsTypes]) {
        if (helmTypes.size > 1) {
            // console.log(helm);
            let lastLady, lastNovice, lastJunior, lastCadet;
            let ladyChangedDate, noviceChangedDate, juniorChangedDate, cadetChangedDate;
            for (let [helmType, { lady, novice, cadet, junior, raceDate }] of [...helmTypes]) {
                ladyChangedDate = lastLady !== undefined && lastLady !== lady ? raceDate : false;
                noviceChangedDate = lastNovice !== undefined && lastNovice !== novice ? raceDate : false;
                juniorChangedDate = lastJunior !== undefined && lastJunior !== junior ? raceDate : false;
                cadetChangedDate = lastCadet !== undefined && lastCadet !== cadet ? raceDate : false;

                lastLady = lady;
                lastNovice = novice;
                lastCadet = cadet;
                lastJunior = junior;
                // console.log(`${helmType} ${raceDate}`);
            }
            if (ladyChangedDate) {
                // console.log(`lady: ${ladyChangedDate}`);
            }
            if (cadetChangedDate) {
                // console.log(`cadet: ${cadetChangedDate}`);
            }
            if (juniorChangedDate) {
                // console.log(`junior: ${juniorChangedDate}`);
            }
            if (noviceChangedDate) {
                // console.log(`novice: ${noviceChangedDate}`);
            }
        }
    }

    //name, yearOfBirth, gender, joinedDate
    return [...helms].map(([, { raceDate, novice, lady, name, junior, cadet }]) => ({
        name,
        yearOfBirth: undefined,
        gender: lady ? "female" : "male",
        noviceInFirstRace: false,
        firstRaceDate: raceDate,
    }));
}

function mapClassName(boatClass) {
    const mappedBoatClasses = {
        "TOPAZ OMEGA (SPIN)": "OMEGA (SPIN)",
        "TOPAZ OMEGA": "OMEGA (SPIN)",
        "RS200": "RS 200",
    };
    return mappedBoatClasses[boatClass] || boatClass;
}

function mapHelmName(helmName) {
    const mapNames = {
        "Krzysztof Bonicki": "Krzys Bonicki",
        "Andrew Russel": "Andrew Russell",
        "James Wicken": "James Wickens",
        "Mike Smith": "Michael Smith",
        "Indi Martin": "Indiana Martin",
        "Matt Lacey": "Matthew Lacey",
    }
    const reversed = helmName.split(" ").reverse().join(" ");
    return mapNames[reversed] || reversed;
}

async function replacePursuitResults(results, outputDoc, sourceResultsURL, seriesResultsURL) {
    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);

    // const pursuitResultsStore = await StoreWrapper.create("2021 All Pursuit", outputDoc, this, Result, undefined, undefined, true);
    // const fleetResultsStore = await StoreWrapper.create("2021 Fleet", outputDoc, this, Result, undefined, undefined, true);
    const storeFs = await StoreFunctions.create(devAuth, sourceResultsSheetId, seriesResultsSheetId);
    for (let result of results) {
        const {
            lady,
            novice,
            DNF,
            date,
            raceNumber,
            helm,
            boat,
            pursuit,
            finishPosition,
            finishTime,
            finishCode,
            laps
        } = result;

        const processedHelmName = mapHelmName(helm.name);

        const processedBoatClassName = mapClassName(boat.className.toUpperCase());

        const boatClassesByYear = mapGroupBy(
            [...storeFs.stores.ryaClasses.all(), ...storeFs.stores.clubClasses.all()],
            [BoatClass.getClassYear, (boat) => boat.getClassName()],
            (boatClasses) => boatClasses[0]
        );

        let storedHelm;
        let storedBoat;
        try {
            storedHelm = storeFs.stores.getHelmFromHelmId(processedHelmName);
            storedBoat = boatClassesByYear.get(date.getUTCFullYear()).get(processedBoatClassName);
            if (!storedBoat) {
                throw new Error("Boat: " + storedBoat);
            }
        }
        catch (err) {
            console.log(result);
            console.log(processedBoatClassName);
            console.log(storedBoat);
            console.log(helm.name);
            console.log(processedHelmName);
            console.log(err);
            throw err;
        }

        const registered = storeFs.createRegisteredHelm(new Race(date, parseInt(raceNumber)), storedHelm, storedBoat, boat.sailNumber)
        const outputResult = Result.fromMutableRaceResult(registered, laps, finishPosition, finishTime, finishCode ? new FinishCode("DNF") : new FinishCode());

        if (pursuit) {
            storeFs.stores.pursuitResults.add(outputResult);
        }
        else {
            // pursuitResults.add(outputResult);
        }
    }

    storeFs.stores.pursuitResults.sync();
}

async function scrapeAll(outputSheetURL) {
    // dev URLS
    const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw/edit#gid=1747234560";
    const seriesResultsURL = "https://docs.google.com/spreadsheets/d/1yngxguLyDsFHR-DLA72riRgYzF_nCrlaz01DVeEolMQ/edit#gid=1432028078";

    await bootstrapLocalStorage();
    const outputDoc = () => getGoogleSheetDoc(getSheetIdFromURL(outputSheetURL), devAuth.clientEmail, devAuth.privateKey);
    const [fleetResults, pursuitResults, helms, oods] = (await scrape());

    // console.log(fleetResults);
    // console.log(pursuitResults);
    // console.log(helms);
    // console.log(oods);

    await replacePursuitResults(pursuitResults, outputDoc, sourceResultsURL, seriesResultsURL);
}

scrapeAll(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));
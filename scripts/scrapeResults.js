import cheerio from "cheerio";
import fetch from "node-fetch";
import auth from "./auth.js";
import { parseISOString } from "../src/common.js"
import { SheetsAPI } from "../src/SheetsAPI.js";

const outputSheetId = "1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw";
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
    return str.match(/(\d\d?)\/(\d\d?)\/(\d\d)/).slice(1);
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

    const [raceDay, raceMonth, raceYear] = getRaceDateFromString(raceDateString);
    console.log(raceDay, raceMonth, raceYear);
    const raceDate = parseISOString(`20${raceYear}-${`0${raceMonth}`.slice(-2)}-${`0${raceDay}`.slice(-2)}T00:00:00.000Z`);
    const raceNumber = parseInt(raceNumberString);

    let mappedResults = results.map((result) => ({ ...result, seriesName, raceDate, raceNumber, pursuit }))
    if (!mappedResults.length && (totalRows - OODs.length - 3 > 0)) {
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


async function main() {
    const allRegularSeries = [
        "Icicle",
        "Spring",
        "Early Summer",
        "Late Summer",
        "Autumn",
        "Frostbite",
        "Wednesday Evening",
        "Pursuit",
    ];

    const years = [
        // Mappings invalid // 2013,
        // Mappings invalid // 2014,
        2015,
        2016,
        2017,
        2018,
        2019,
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

    let processedResults = allPursuits.map(mapScrapedResult);
    console.log(JSON.stringify(processedResults.slice(0, 15), null, 4));
    await appendResultsSheet(processedResults, outputSheetId, auth.clientEmail, auth.privateKey);
}

async function appendHelmsSheet(helms, sheetId, clientEmail, privateKey) {
    let sheetsAPI = await SheetsAPI.initSheetsAPI(sheetId, clientEmail, privateKey);
    return await sheetsAPI.appendHelms(helms);
}

async function appendResultsSheet(raceResults, sheetId, clientEmail, privateKey) {
    let sheetsAPI = await SheetsAPI.initSheetsAPI(sheetId, clientEmail, privateKey);
    return await sheetsAPI.appendRaceResults(raceResults);
}

const getHelmId = ({ name }) => name;
const getHelmTypeId = ({ lady, novice, junior, cadet }) => JSON.stringify({ lady, novice, junior, cadet })

function getHelms(results) {
    let helmsTypes = new AutoMap(getHelmId, () => new AutoMap(getHelmTypeId));
    let helms = new AutoMap(getHelmId);

    for (let result of results.sort(({ raceDate: a }, { raceDate: b }) => a - b)) {
        // Group results by helm, then type
        console.log(result);
        helmsTypes.upsert(result, (types) => types.upsert(result))
        helms.upsert(result, (prev, obj) => prev || obj);
    }

    for (let [helm, helmTypes] of [...helmsTypes]) {
        if (helmTypes.size > 1) {
            console.log(helm);
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
                console.log(`${helmType} ${raceDate}`);
            }
            if (ladyChangedDate) {
                console.log(`lady: ${ladyChangedDate}`);
            }
            if (cadetChangedDate) {
                console.log(`cadet: ${cadetChangedDate}`);
            }
            if (juniorChangedDate) {
                console.log(`junior: ${juniorChangedDate}`);
            }
            if (noviceChangedDate) {
                console.log(`novice: ${noviceChangedDate}`);
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

main()
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));
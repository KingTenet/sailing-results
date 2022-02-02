import auth from "./auth.js";
import { AutoMap, flattenMap, limitSheetsRequest, getGoogleSheetDoc, parseISOString } from "./common.js"
import { SheetsAPI } from "./SheetsAPI.js";

// This helps filter out invalid rows..
const MIN_PY = 500;
const MAX_PY = 2000;
const MONTH_UPDATED = "04"; // The month that we start using the latest year's RYA PYs, eg. 04 for April
const ALLOWED_TYPES = "DINGHY"; // Note: All boats from limited data also included as these don't have a "type"

const RYASheetId2011 = "1RHJUkh98UXp7ZRqCU_y91tPvOfsK8iI88iHS3nODIeM";
const RYASheetId2012 = "1QsnmWMLdugHFME_9W22qWGjFl7tUDFwacqRx1SgcFdQ";
const RYASheetId2013 = "1nTMfvtnHh_8oVEEjizKOH_7aUm0Sn8nKgtoyRNpW4hU";
const RYASheetId2014 = "1W4RxQ5eJZIc39aWf8ugei90LA_Y96ons_qEtrvezGos";
const RYASheetId2015 = "10exR9zG1cKA8i638GVFvES7B-5oPjInhH6PeI-8lLFg";
const RYASheetId2016 = "1SRfxqkSQg67pAnXITx-XxFPUBiYH-OswwP8hRSgvW8o";
const RYASheetId2017 = "1aPuEiJCZ97nVcgkcQzXdGacLy1JCr3e711BrkQMPA3U";
const RYASheetId2018 = "12k3w_Or4uMRG7jv_Z9BMtaYk4sJfAKqWAKTToV6tSgA";
const RYASheetId2019 = "17NLvahG3zs6QAKh-uiaCPVpzDqmFsAE84fPLka1gxkM";

const RYASheetId2016Limited = "1KLec7GjHr1b6Ze56IGkMzKSjS4t7MjR8qeKr3tSbBv4";
const RYASheetId2017Limited = "1ud3LwRH2b9e3Tu0elq7Vr0xElTqayR1vDRThMsV5uuM";
const RYASheetId2018Limited = "1URBkrHx8oOg3Sm7zJJj7ibcbuNQmwc3Lum96PcywLAQ";
const RYASheetId2019Limited = "1RHnf5-uSkJAfBPss_LuNxigjMZcbVCiBmH0gdHi7dGU";

const allYearsFull = [
    [2011, RYASheetId2011],
    [2012, RYASheetId2012],
    [2013, RYASheetId2013],
    [2014, RYASheetId2014],
    [2015, RYASheetId2015],
    [2016, RYASheetId2016],
    [2017, RYASheetId2017],
    [2018, RYASheetId2018],
    [2019, RYASheetId2019],
];

const allYearsLimited = [
    [2016, RYASheetId2016Limited],
    [2017, RYASheetId2017Limited],
    [2018, RYASheetId2018Limited],
    [2019, RYASheetId2019Limited],
];

const outputSheetId = "1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw";
const outputLimitedSheetId = outputSheetId;
// const outputSheetId = "1Eette41Wd3sNjpSLXstDfvJ9c4cIMteucx9f2j_TiiU";
// const outputLimitedSheetId = "1YexALf_PUNnck2WCTqBoNYspHpqapSYGSjD6paaffvE";

const mapFullRowToClass = (year) => ({ "Class Name": className, "No. of Crew": crew, "Rig": rig, "Spinnaker": spinnaker, "Number": PY, "Type": type, ...rest }) => ({
    className: className.trim(),
    crew,
    rig,
    spinnaker,
    PY,
    change: rest[Object.keys(rest).find((key) => key.toLowerCase().includes("change"))],
    type,
    unique: [className.trim(), crew, rig, spinnaker].join(":::"),
    year,
    dateUpdated: parseISOString(`${parseInt(year)}-01-01T00:00:00.000Z`),
});

const mapLimitedRowToClass = (year) => ({ "Class Name": className, "Last Published Year": lastPublished, "Last Published Number": PY }) => ({
    className: className.trim(),
    PY,
    lastPublished,
    year,
    dateUpdated: parseISOString(`${parseInt((lastPublished ? lastPublished : `${year}`).trim())}-01-01T00:00:00.000Z`),
});

async function getClassesForSheet(sheetId, mapRow) {
    const doc = await getGoogleSheetDoc(sheetId, auth.clientEmail, auth.privateKey);
    const sheet = doc.sheetsByIndex[0];
    return (await limitSheetsRequest(() => sheet.getRows()))
        .map(mapRow)
        .filter(({ className, PY, type }) => className.length && parseInt(PY) > MIN_PY && parseInt(PY) < MAX_PY && (!type || ALLOWED_TYPES.includes(type)));
}

function getLimitedClassId({ className }) {
    return className;
}

function getFullClassId({ className, crew, rig, spinnaker }) {
    return JSON.stringify([className, crew, rig, spinnaker])
}

async function appendClassesSheet(classes, sheetId, clientEmail, privateKey, sheetName) {
    let sheetsAPI = await SheetsAPI.initSheetsAPI(sheetId, clientEmail, privateKey);
    return await sheetsAPI.appendClasses(classes, sheetName);
}

async function updateSheet() {
    const allRows = [];
    const limitedClasses = new AutoMap(getLimitedClassId, () => []);
    const fullClasses = new AutoMap(getFullClassId, () => []);

    for (let [year, sheetId] of allYearsFull) {
        for (let boatClass of (await getClassesForSheet(sheetId, mapFullRowToClass(year)))) {
            allRows.push(boatClass);
            fullClasses.upsert(boatClass, (previousYears) =>
                previousYears.at(-1)?.PY !== boatClass.PY
                    ? previousYears.concat(boatClass)
                    : previousYears)
        }
    }

    for (let [year, sheetId] of allYearsLimited) {
        for (let boatClass of (await getClassesForSheet(sheetId, mapLimitedRowToClass(year)))) {
            allRows.push(boatClass);
            limitedClasses.upsert(boatClass, (previousYears) =>
                previousYears.at(-1)?.PY !== boatClass.PY
                    ? previousYears.concat(boatClass)
                    : previousYears)
        }
    }

    const yearsOfInterest = [
        2014,
        2015,
        2016,
        2017,
        2018,
        2019,
        2020,
        2021,
        2022
    ];

    const fullYearsOfInterest = new AutoMap(getFullClassId, () => [])
    for (let [classId] of [...fullClasses]) {
        for (let year of yearsOfInterest) {
            let matchedYearForClass = allRows
                .find((thisClass) => classId === getFullClassId(thisClass) && thisClass.dateUpdated.getUTCFullYear() === year);

            if (matchedYearForClass) {
                fullYearsOfInterest.upsert(matchedYearForClass, (prev, obj) => [...prev, { validYear: year, ...obj }]);
            }
        }
    }

    const limitedYearsOfInterest = new AutoMap(getLimitedClassId, () => [])
    for (let [classId] of [...limitedClasses]) {
        for (let year of yearsOfInterest) {
            let matchedYearsForClass = allRows
                .filter((thisClass) => classId === getLimitedClassId(thisClass) && thisClass.dateUpdated.getUTCFullYear() <= year);

            if (matchedYearsForClass.length) {
                limitedYearsOfInterest.upsert(matchedYearsForClass.reduce((prev, current) => prev.dateUpdated.getUTCFullYear() > current.dateUpdated.getUTCFullYear() ? prev : current), (prev, obj) => [...prev, { validYear: year, ...obj }]);
            }
        }
    }

    await appendClassesSheet(flattenMap(fullYearsOfInterest), outputSheetId, auth.clientEmail, auth.privateKey, "RYA Full List");
    await appendClassesSheet(flattenMap(limitedYearsOfInterest), outputLimitedSheetId, auth.clientEmail, auth.privateKey, "RYA Limited List");
}

updateSheet()
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

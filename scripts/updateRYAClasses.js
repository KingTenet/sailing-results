import auth from "./auth.js";
import { flattenMap, limitSheetsRequest, getGoogleSheetDoc, parseISOString } from "../src/common.js"
import { SheetsAPI } from "../src/SheetsAPI.js";

// This helps filter out invalid rows..
const MIN_PY = 500;
const MAX_PY = 2000;
const ALLOWED_TYPES = "DINGHY";

const RYASheetId2011 = "1RHJUkh98UXp7ZRqCU_y91tPvOfsK8iI88iHS3nODIeM";
const RYASheetId2012 = "1QsnmWMLdugHFME_9W22qWGjFl7tUDFwacqRx1SgcFdQ";
const RYASheetId2013 = "1nTMfvtnHh_8oVEEjizKOH_7aUm0Sn8nKgtoyRNpW4hU";
const RYASheetId2014 = "1W4RxQ5eJZIc39aWf8ugei90LA_Y96ons_qEtrvezGos";
const RYASheetId2015 = "10exR9zG1cKA8i638GVFvES7B-5oPjInhH6PeI-8lLFg";
const RYASheetId2016 = "1SRfxqkSQg67pAnXITx-XxFPUBiYH-OswwP8hRSgvW8o";
const RYASheetId2017 = "1aPuEiJCZ97nVcgkcQzXdGacLy1JCr3e711BrkQMPA3U";
const RYASheetId2018 = "12k3w_Or4uMRG7jv_Z9BMtaYk4sJfAKqWAKTToV6tSgA";
const RYASheetId2019 = "17NLvahG3zs6QAKh-uiaCPVpzDqmFsAE84fPLka1gxkM";
const RYASheetId2020 = "1pqvEoMkOT4ezrUuoiI1MbI5y-ofN6-qKQO3i7gL5szI";

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
    [2020, RYASheetId2020],
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

async function getClassesForSheet(sheetId, mapRow) {
    const doc = await getGoogleSheetDoc(sheetId, auth.clientEmail, auth.privateKey);
    const sheet = doc.sheetsByIndex[0];
    return (await limitSheetsRequest(() => sheet.getRows()))
        .map(mapRow)
        .filter(({ className, PY, type }) => className.length && parseInt(PY) > MIN_PY && parseInt(PY) < MAX_PY && (!type || ALLOWED_TYPES.includes(type)));
}

function getFullClassId({ className, crew, rig, spinnaker }) {
    return JSON.stringify([className, crew, rig, spinnaker])
}

async function appendClassesSheet(classes, sheetId, clientEmail, privateKey, sheetName) {
    let sheetsAPI = await SheetsAPI.initSheetsAPI(sheetId, clientEmail, privateKey);
    return await sheetsAPI.appendClasses(classes, sheetName);
}

async function updateSheet(outputSheetURL) {
    const allRows = [];
    const fullClasses = new AutoMap(getFullClassId);
    const outputSheetId = getSheetIdFromURL(outputSheetURL);

    for (let [year, sheetId] of allYearsFull) {
        for (let boatClass of (await getClassesForSheet(sheetId, mapFullRowToClass(year)))) {
            allRows.push(boatClass);
            // Group by class
            fullClasses.upsert(boatClass)
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

    await appendClassesSheet(flattenMap(fullYearsOfInterest), outputSheetId, auth.clientEmail, auth.privateKey, "RYA Full List");
}

updateSheet(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

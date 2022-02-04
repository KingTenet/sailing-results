import { getGoogleSheetDoc, getURLDate, parseISOString, getISOStringFromDate } from "./common.js"

function getDateFromSheetsDate() {

}


function intOrUndefined(intString) {
    const intValue = parseInt(intString);
    return isNaN(intValue) ? undefined : intValue;
}



function mapRaceResultToRow(date, raceNumber, { helm, boat, finishTime, finishCode, finishPosition, laps, PN }) {
    return {
        "Date": getURLDate(date),
        "Race Number": raceNumber,
        "Helm": helm.name,
        "Sail Number": boat.sailNumber,
        "Class": boat.className.toUpperCase(),
        // "PN": PN,
        "Laps": laps,
        "Pursuit Finish Position": pursuitFinishPosition,
        "Finish Time": finishTime,
        "Finish Code": finishCode,
        "Last Updated": getISOStringFromDate(),
    };
}

function mapRowToRaceResult({
    "Date": dateString,
    "Race Number": raceNumber,
    "Helm": helmId,
    "Sail Number": boatSailNumber,
    "Class": boatClassName,
    // "PN": PN,
    "Laps": laps,
    "Pursuit Finish Position": pursuitFinishPosition,
    "Finish Time": finishTime,
    "Finish Code": finishCode,
    "Last Updated": lastUpdated,
}) {
    return {
        date: getDateFromSheetsDate(dateString),
        raceNumber: intOrUndefined(raceNumber),
        helmId: helmId,
        boat: getBoat(boatClassName, boatSailNumber),
        // PN: intOrUndefined(PN),
        laps: intOrUndefined(laps),
        pursuitFinishPosition: intOrUndefined(pursuitFinishPosition),
        finishTime: intOrUndefined(finishTime),
        finishCode,
        lastUpdated: lastUpdated ? parseISOString(lastUpdated) : undefined,
    };
}

function getBoat(sailNumber, className) {
    return { sailNumber, className };
}

function mapHelmToRow({ name, yearOfBirth, gender, noviceInFirstRace, firstRaceDate }) {
    return {
        "Name": name,
        "Year Of Birth": yearOfBirth,
        "Gender": gender,
        "Was Novice In First Race": noviceInFirstRace,
        "Date Of First Race": getURLDate(firstRaceDate),
    }
}

function mapMemberToRow({ fullName, firstNames, lastName, yearOfBirth, primaryMembershipName }) {
    return {
        "Full Name": fullName,
        "First Name(s)": firstNames,
        "Last Name": lastName,
        "Year Of Birth": yearOfBirth,
    }
}

/*
const exampleHelm = {
    name: "Felix Morley",
    yearOfBirth: 1985,
    gender: "Male",
    firstRaceDate: ""
};
*/

function mapRowToHelm({ Name: name, "Year Of Birth": yearOfBirth, "Gender": gender, "Was Novice In First Race": noviceInFirstRace }) {
    return {
        name,
        yearOfBirth,
        gender,
        // firstRaceDate: transformSheetsDateToDate(firstRaceDate),
        noviceInFirstRace,
    };
}

function mapBoatToRow({ sailNumber, className, clubBoat }) {
    return {
        "Sail Number": sailNumber,
        "Class": className,
        "Club Boat": clubBoat,
    };
}

function mapClassToRow({ className, PY, crew, rig, spinnaker, validYear }) {
    return {
        "Class": className,
        "PY": PY,
        "Crew": crew,
        "Rig": rig,
        "Spinnaker": spinnaker,
        "Valid Year": validYear,
    };
}

function mapRowToSeriesRaces({ Season: season, Series: series, "Race Date": date, "Race Number": raceNumber, "Last Imported": lastImported }) {
    return {
        season,
        series,
        date,
        raceNumber,
        lastImported: lastImported ? parseISOString(lastImported) : undefined,
    }
}

export const getHelmId = ({ name }) => name;

export const getSeriesId = ({ season, series }) => `${season}::${series}`;

export const getRaceId = ({ date, raceNumber }) => `${date}::${raceNumber}`;

function jsDateToSheetsDate(date) {
    var sheetsEpoch = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0));
    return (date.getTime() - sheetsEpoch.getTime()) / 86400000;
}

function sheetsDateToJSDate(sheetsDateNumber) {
    var sheetsEpoch = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0));
    return new Date(sheetsDateNumber * 86400000 + sheetsEpoch.getTime());
}

function transformSheetsDateToDate(s) {
    const b = s.split(/\D+/);
    return new Date(Date.UTC(b[2], --b[1], b[0]));
}

export class SheetsAPI {
    constructor(sheetId, clientEmail, privateKey) {
        this.promiseDoc = getGoogleSheetDoc(sheetId, clientEmail, privateKey);
        this.promiseDoc.then((doc) => this.doc = doc);
    }

    async promiseReady() {
        await this.promiseDoc;
        return true;
    }

    async appendRaceResults(results, date, raceNumber, sheetName = "Race Results") {
        const sheet = this.doc.sheetsByTitle[sheetName];
        if (date && raceNumber) {
            return await sheet.addRows(results.map((...args) => mapRaceResultToRow(date, raceNumber, { ...args })));
        }
        return await sheet.addRows(results.map(({ date, raceNumber, ...args }) => mapRaceResultToRow(date, raceNumber, { ...args })));
    }

    async appendHelms(helms, sheetName = "Helms") {
        const sheet = this.doc.sheetsByTitle[sheetName];
        return await sheet.addRows(helms.map(mapHelmToRow));
    }

    async appendBoats(boats, sheetName = "Boats") {
        const sheet = this.doc.sheetsByTitle[sheetName];
        return await sheet.addRows(boats.map(mapBoatToRow));
    }

    async replaceActiveMembership(members, sheetName = "Active Membership") {
        const sheet = this.doc.sheetsByTitle[sheetName];
        await sheet.clear();
        await sheet.setHeaderRow([
            "Full Name",
            "First Name(s)",
            "Last Name",
            "Year Of Birth",
        ]);
        return await sheet.addRows(members.map(mapMemberToRow));
    }

    async appendClasses(classes, sheetName = "Classes") {
        const sheet = this.doc.sheetsByTitle[sheetName];
        return await sheet.addRows(classes.map(mapClassToRow));
    }

    async getAllHelms(sheetName = "Helms") {
        const sheet = this.doc.sheetsByTitle[sheetName];
        return (await sheet.getRows()).map(mapRowToHelm);
    }

    async getSeriesRaces(sheetName = "Seasons/Series") {
        const sheet = this.doc.sheetsByTitle[sheetName];
        debugger;
        return (await sheet.getRows()).map(mapRowToSeriesRaces);
    }

    async getRacesForDate(requestedDate) {
        const uniqueRaces = new Map();

        for (let seriesRace of await this.getSeriesRaces()) {
            let seriesRaces = uniqueRaces.get(getRaceId(seriesRace)) || [];
            uniqueRaces.set(getRaceId(seriesRace), [...seriesRaces, seriesRace])
        }

        return [...uniqueRaces]
            .map(([, races]) => ({
                date: transformSheetsDateToDate(races[0].date),
                raceNumber: races[0].raceNumber,
                results: [],
            }))
            .filter(({ date }) => date.toISOString() === requestedDate.toISOString())
    }

    async getAllResults(addHelmToRaceResult, fleetSheetName = "Fleet Race Results", pursuitSheetName = "Pursuit Race Results") {
        const fleetResults = await this.getAllResultsFromSheet(addHelmToRaceResult, fleetSheetName);
        const pursuitResults = await this.getAllResultsFromSheet(addHelmToRaceResult, pursuitSheetName);
        return [...fleetResults, ...pursuitResults];
    }

    async getAllResultsFromSheet(addHelmToRaceResult, sheetName) {
        const sheet = this.doc.sheetsByTitle[sheetName];
        return (await sheet.getRows()).map((row) => addHelmToRaceResult(mapRowToRaceResult(row)));
    }

    static async initSheetsAPI(sheetId, clientEmail, privateKey) {
        const sheetsAPI = new SheetsAPI(sheetId, clientEmail, privateKey);
        await sheetsAPI.promiseReady();
        return sheetsAPI;
    }
}

// export default function() {
//     const [services] = useAppState(({services}) => services)
//     services.googleSheets.

//     const commitResults = async() => {
//         let helms = [
//            {name: "Fx morlsss"},
//            {name: "Geoff Parsons"},
//         ];

//         let boats = [
//             {sailNumber: 126122, className: "Laser", clubBoat: false},
//             {sailNumber: 1113, className: "SoloX", clubBoat: false},
//         ]

//         let classes = [
//             {className: "SoloX", PY: 1138, dateUpdated: Date.now()}
//         ]

//         let results = [
//             {
//                 helm: {name: "Fx morlsss"},
//                 boat: {sailNumber: 126122, className: "Laser"},
//                 finishTime: 3600,
//                 finishCode: undefined,
//                 finishPosition: undefined
//             },
//             {
//                 helm: {name: "Geoff Parsons"},
//                 boat: {sailNumber: 1113, className: "Solo"},
//                 finishTime: 3600,
//                 finishCode: undefined,
//                 finishPosition: undefined
//             },
//         ];

//         await appendRaceResults("2022-01-01", 1, helms, boats, classes, results);
//     }

//     return <>
//         <button onClick={(commitResults)} value="Click here">Hello worlds</button>
//         <div>{state}</div>
//     </>
// }
import { devReadWrite } from "./auth.js";
import { getSheetIdFromURL, getAllCellsFromSheet, getGoogleSheetDoc } from "../src/common.js"
// import { SheetsAPI } from "../src/SheetsAPI.js";
import ClubMember from "../src/store/types/ClubMember.js";
import StoreWrapper from "../src/store/StoreWrapper.js";
import bootstrapLocalStorage from "../src/bootstrapLocalStorage.js";
// import { Stores } from "../src/store/Stores.js";

const COLUMN_INDEXES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

const auth = devReadWrite;

// Dev URLs
// const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw/edit#gid=1747234560";
// const seriesResultsURL = "https://docs.google.com/spreadsheets/d/1yngxguLyDsFHR-DLA72riRgYzF_nCrlaz01DVeEolMQ/edit#gid=1432028078";

function cleanName(str) {
    let name = str.replace(/\([\s]?[0-9]+[\s]?\)/, "");
    if (/[^A-Za-z0-9'\- ]/.test(name)) {
        console.log(`The name ${name} has invalid characters.`)
    }
    let cleanName = name.replace(/[^A-Za-z0-9'\- ]/g, "").replace(/\s+/g, " ").trim();

    if (!cleanName) {
        console.log(`--------------------------`);
        console.log(`The full name ${name} did not parse correctly or has too few names, it will not be added.`);
        return;
    }

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const capitalizeAfterChars = (str, char) => str.split(char).reduce((str, part, i) => i ? [str, capitalize(part)].join(char) : part)
    const capitalizedName = capitalize(
        [" ", "-", "'", " Mc"]
            .reduce(
                (acc, chars) => capitalizeAfterChars(acc, chars),
                ` ${cleanName}`.toLowerCase())
    ).trim();

    if (capitalizedName !== cleanName) {
        console.log(`Capitalization was changed during processing from ${cleanName} to ${capitalizedName}`);
    }

    return cleanName;
}

function getMember(firstNamesStr, surnamesStr, yearOfBirthStr) {
    const firstNames = cleanName(firstNamesStr);
    const lastName = cleanName(surnamesStr);
    return {
        fullName: cleanName(`${firstNames} ${lastName}`),
        firstNames,
        lastName,
        yearOfBirth: yearOfBirthStr && (yearOfBirthStr.match(/\([\s]?([0-9]+)[\s]?\)/) || [])[1],
    };
}

function processMembershipRow(row) {
    const familyMembers = [];
    const primaryMember = getMember(row[1], row[0], row[2]); // Note surname then firstname unlike further members on row!
    familyMembers.push({
        ...primaryMember,
        primaryMembershipName: primaryMember.fullName,
    });
    let columnOffset = primaryMember.yearOfBirth ? 3 : 2;
    while (columnOffset < row.length) {
        if (!row[columnOffset] || !row[columnOffset + 1]) {
            return familyMembers;
        }
        const otherMember = getMember(row[columnOffset], row[columnOffset + 1], row[columnOffset + 2]);
        familyMembers.push({
            ...otherMember,
            primaryMembershipName: primaryMember.fullName,
        });
        columnOffset = columnOffset + (otherMember.yearOfBirth ? 3 : 2);
    }
    return familyMembers;
}

// async function replaceActiveMembersSheet(members, sheetId, clientEmail, privateKey) {
//     let sheetsAPI = await SheetsAPI.initSheetsAPI(sheetId, clientEmail, privateKey);
//     return await sheetsAPI.replaceActiveMembership(members);
// }

async function replaceActiveMembersSheet(members, outputDoc) {
    const outputMembersStore = await StoreWrapper.create(false, "Active Membership", outputDoc, undefined, ClubMember, undefined, undefined, true);
    for (let member of members) {
        const {
            fullName,
            firstNames,
            lastName,
            yearOfBirth,
        } = member;
        try {

            outputMembersStore.add(ClubMember.fromStore({
                "Full Name": fullName,
                "First Name(s)": firstNames,
                "Last Name": lastName,
                "Year Of Birth": yearOfBirth,
            }));
        }
        catch (err) {
            console.log(member);
            throw err;
        }
    }
    await outputMembersStore.sync();
}

async function importActiveMembers(activeMembershipListURL, outputSheetURL, firstRowStr = "2", firstColumnStr = "D") {
    await bootstrapLocalStorage();

    if (!activeMembershipListURL || !outputSheetURL) {
        console.log("Usage: node scripts/importActiveMembersList.js {sourceURL} {destinationURL} [firstRow=4] [firstColumn=A]");
        return;
    }

    const firstRow = parseInt(firstRowStr) - 1;
    if (Number.isNaN(firstRow)) {
        throw new Error("Invalid first row.\nScript usage: node scripts/importActiveMembersList.js {sourceURL} {outputURL} [firstRowInSheet] [firstColumnStr]");
    }
    const firstColumn = COLUMN_INDEXES.findIndex((letter) => letter === firstColumnStr);
    const outputDoc = getGoogleSheetDoc(getSheetIdFromURL(outputSheetURL), auth.clientEmail, auth.privateKey);
    const allActiveMembers = [];
    (await getAllCellsFromSheet(getSheetIdFromURL(activeMembershipListURL), auth, undefined, false))
        .filter((row, rowIndex) => rowIndex >= firstRow)
        .map((familyMembers) => familyMembers
            .filter((content, columnIndex) => content && columnIndex >= firstColumn))
        .filter((row) => row.length)
        .forEach((row) => {
            try {
                allActiveMembers.push(...processMembershipRow(row));
            }
            catch (err) {
                console.log(`Failed to process row ${row}`);
                throw err;
            }
        });

    // allActiveMembers.forEach((member) => console.log(member));
    await replaceActiveMembersSheet(allActiveMembers, outputDoc);
}


importActiveMembers(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

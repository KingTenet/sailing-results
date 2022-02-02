import auth from "./auth.js";
import { getSheetIdFromURL, getAllCellsFromSheet } from "../src/common.js"
import { SheetsAPI } from "../src/SheetsAPI.js";

function mapMember(member) {
    let warnings = [];
    let yearOfBirth = (member.match(/\([\s]?([0-9]+)[\s]?\)/) || [])[1];
    let name = member.replace(/\([\s]?[0-9]+[\s]?\)/, "");
    if (/[^A-Za-z0-9'\- ]/.test(name)) {
        warnings.push(`The name ${name} has invalid characters.`)
    }
    let cleanName = name.replace(/[^A-Za-z0-9'\- ]/g, "").replace(/\s+/g, " ").trim();

    if (!cleanName || cleanName.split(" ").length < 2) {
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
                cleanName.toLowerCase())
    );

    if (capitalizedName !== cleanName) {
        warnings.push(`Capitalization was changed during processing`);
    }

    const lastName = capitalizedName.split(" ").at(-1);
    const firstNames = capitalizedName.replace(lastName, "").trim();
    const fullMemberObject = {
        fullName: capitalizedName,
        firstNames,
        lastName,
        yearOfBirth,
    };

    if (warnings.length) {
        console.log(`--------------------------`);
        console.log(`The name:${member} was processed but with warnings:`);
        console.log(warnings.join("\n"));
        console.log(JSON.stringify(fullMemberObject, null, 4));
    }

    return fullMemberObject;
}

async function replaceActiveMembersSheet(members, sheetId, clientEmail, privateKey) {
    let sheetsAPI = await SheetsAPI.initSheetsAPI(sheetId, clientEmail, privateKey);
    return await sheetsAPI.replaceActiveMembership(members);
}

async function importActiveMembers(activeMembershipListURL, outputSheetURL) {
    const allActiveMembers = [];
    (await getAllCellsFromSheet(getSheetIdFromURL(activeMembershipListURL), auth))
        .forEach((familyMembers) => familyMembers
            .filter(Boolean)
            .forEach((member, i, family) => {
                allActiveMembers.push({
                    ...mapMember(member),
                    primaryMembershipName: mapMember(family[0]).fullName,
                })
            }));

    await replaceActiveMembersSheet(allActiveMembers, getSheetIdFromURL(outputSheetURL), auth.clientEmail, auth.privateKey);
}

importActiveMembers(...process.argv.slice(2))
    .then(() => console.log("Finished"))
    .catch((err) => console.log(err));

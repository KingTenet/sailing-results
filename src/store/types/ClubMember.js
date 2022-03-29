import StoreObject from "./StoreObject.js";
import { assertType } from "../../common.js";

export default class ClubMember extends StoreObject {
    constructor(fullName, firstNames, lastName, yearOfBirth, metaData) {
        super(metaData)
        this.fullName = assertType(fullName, "string");
        this.name = assertType(fullName, "string");
        this.firstNames = assertType(firstNames, "string");
        this.lastName = assertType(lastName, "string");
        this.yearOfBirth = assertType(yearOfBirth, "number");
    }

    static getId(clubMember) {
        assertType(clubMember, ClubMember);
        return clubMember.fullName;
    }

    static sheetHeaders() {
        return [
            "Full Name",
            "First Name(s)",
            "Last Name",
            "Year Of Birth",
            ...StoreObject.sheetHeaders()
        ];
    }

    static fromStore(storeHelm) {
        let {
            "Full Name": fullName,
            "First Name(s)": firstNames,
            "Last Name": lastName,
            "Year Of Birth": yearOfBirth,
        } = storeHelm;
        return new ClubMember(fullName, firstNames, lastName, parseInt(yearOfBirth || 1970), StoreObject.fromStore(storeHelm));
    }

    getName() {
        return this.fullName;
    }

    getYearOfBirth() {
        return this.yearOfBirth;
    }

    toStore() {
        return {
            "Full Name": this.fullName,
            "First Name(s)": this.firstNames,
            "Last Name": this.lastName,
            "Year Of Birth": this.yearOfBirth,
            ...super.toStore(this),
        };
    }
}

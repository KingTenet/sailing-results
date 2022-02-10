import { assert } from "../../common.js";

export default class FinishCode {
    constructor(code) {
        assert(!code || ["DNF", "DNS", "OCS"].includes(code), `${code} is an invalid finish code`);
        this.code = code || undefined;
    }

    getCode() {
        return this.code;
    }

    validFinish() {
        return !this.code;
    }
}
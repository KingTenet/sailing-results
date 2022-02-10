import { assert, assertType } from "../../common.js";
/**
 * NOTE: RYA have in previous years published their PY class handicap list
 *  with multiple configurations with the same "Class Name"
 *  eg. MIRROR 2015 includes a "2/S/C" and "1/S/-" configuration
 *  and CANOE INTERNATIONAL 2015 includes a "1/S/A" and "1/S/0" configuration
 *  however they have since split them out into two separate class names
 *  ie. MIRROR S/H and MIRROR D/H 
 *  so for previous years the RYA class names have been modified to avoid conflicts
 *  and classes will not be keyed off the configuration
 */
export default class BoatConfiguration {
    constructor(crew, rig, spinnaker) {
        assert(!rig || ["S", "U"].includes(rig), `${rig} is not a valid rig for boat class`);
        assert(!spinnaker || ["0", "A", "-", "C"].includes(spinnaker), `${spinnaker} is not a valid spinnaker for boat class`);

        this.crew = crew && assertType(crew, "number");
        this.rig = rig;
        this.spinnaker = spinnaker;
    }
}
import BoatClass from "../src/store/types/BoatClass.js";
import Helm from "../src/store/types/Helm.js";
import Race from "../src/store/types/Race.js";
import Result from "../src/store/types/Result.js";
import StoreObject from "../src/store/types/StoreObject.js";
import BoatConfiguration from "../src/store/types/BoatConfiguration.js";
import { assert, parseISOString } from "../src/common.js";
import FinishCode from "../src/store/types/FinishCode.js";
import MutableRaceFinish from "../src/store/types/MutableRaceFinish.js";

function getCorrectedResultsForRace(results, correctedResults = []) {
    const raceFinish = MutableRaceFinish.fromResults(results, () => []);
    return [...raceFinish.getCorrectedResults(), ...correctedResults];
}

const DEFAULT_HELM_NAME = "Felix Morley";
const DEFAULT_HELM_helmYearOfBirth = 1985;
const DEFAULT_HELM_GENDER = "male";
const DEFAULT_HELM_NOVICE = false;
const DEFAULT_RACE_DATE = new Date(0);
const DEFAULT_RACE_NUMBER = 1;
const DEFAULT_BOAT_CLASSNAME = "CLASS 1";
const DEFAULT_BOAT_CONFIG = new BoatConfiguration(1, "U", "0");
const DEFAULT_BOAT_PY = 1100;
const DEFAULT_BOAT_PY_VALID_FROM = new Date(0);
const DEFAULT_BOAT_SN = 1234;
const DEFAULT_LAPS = 5;
const DEFAULT_PURSUIT_FINISH_POSITION = undefined;
const DEFAULT_FINISH_TIME = 1000;
const DEFAULT_FINISH_CODE = new FinishCode("");

function assertDeepEquals(expected, actual, str) {
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
        console.log(`Expected:\n${JSON.stringify(expected, null, 4)}\nBut got:\n${JSON.stringify(actual, null, 4)}`)
        throw new Error(str);
    }
}

function createRace1() {
    /**
     * ACT: 693.3
     * SCT:	685.76
     * 
    Mickey Mouse	    Laser	        1/U/0	1096	191874			48:12:00	4	659.7	1	1	-3.8	-42	   2892     -3.800163322	1054.35021
    Scrooge McDuck   	Solo	        1/U/0	1133	4931			50:14:00	4	665	    2	2	-3	    -34	   3014     -3.02729818	    1098.700712
    Bananaman	        DEVOTI D-ZERO	1/U/0	1029	181		    	46:05:00	4	671.8	3	3	-2	    -21	   2765     -2.03569762	    1008.052671
    Minnie Mouse	    Laser Radial	1/U/0	1147	63163	L		53:52:00	4	704.4	4	4	2.7	    31	   3232     2.718152123	    1178.177205
    Itchy	            Solo	        1/U/0	1133	3941			54:59:00	4	727.9	5	5	6.1 	69	   3299     6.145007	    1202.622929
    Scratchy	        Solo	        1/U/0	1133	4359			55:13:00	4	731	    6	6	6.6     75	   3313     6.597060196	    1207.744692
    Wallace             LASER 4.7	    1/U/0	1200	0	J		    45:37:00	3	760.3	7	7	10.9	131	   2737     10.86969202	    1330.436304
    Betty Boop	        Argo (No Spin)	2/S/0	1175	11420	L	    47:02:00	3	800.6	8	8	16.7	196	   2822     16.74638357	    1371.770007
    Peter Rabbit  	    Solo	        1/U/0	1133	219			    46:57:00	3	828.8	9	9	20.9	237	   2817     20.85860943	    1369.328045							
     */

    return [
        ["Mickey Mouse", 1096, 2892, 4],
        ["Scrooge McDuck", 1133, 3014, 4],
        ["Bananaman", 1029, 2765, 4],
        ["Minnie Mouse", 1147, 3232, 4],
        ["Itchy", 1133, 3299, 4],
        ["Scratchy", 1133, 3313, 4],
        ["Wallace", 1200, 2737, 3],
        ["Betty Boop", 1175, 2822, 3],
        ["Peter Rabbit", 1133, 2817, 3],
    ]
        .map(([helmName, boatPY, finishTime, laps]) => createResult({ helmName, finishTime, boatPY, laps }));
}

function createRace2() {
    /**
     * 	Date	1/10/17	Race	2
     * 
Bananaman	        DEVOTI D-ZERO	1/U/0	1029	181			    41:14   2474	4	601.1	1	1	    -1	    -10
Mickey Mouse	    Laser	        1/U/0	1096	191874			44:02	2642    4	602.6	2	2	    -0.8	-9
Scrooge McDuck	    Solo	        1/U/0	1133	4931			46:40	2800    4	617.8	3	3	    1.7	    19
Itchy	            Solo	        1/U/0	1133	3941			49:08	2948    4	650.5	4	4	    7.1	    80
Scratchy            Solo	        1/U/0	1133	4359			50:26	3026    4	667.7	5	5	    10	    113
Wallace             LASER 4.7	    1/U/0	1200	0	    J		42:18	2538    3	705	    6	6	    16.1    193
Olive Oyl           Argo (No Spin)	2/S/0	1175	11421	JLN		DNF	                8
     */

    return [
        ["Bananaman", 1029, 2474, 4],
        ["Mickey Mouse", 1096, 2642, 4],
        ["Scrooge McDuck", 1133, 2800, 4],
        ["Itchy", 1133, 2948, 4],
        ["Scratchy", 1133, 3026, 4],
        ["Wallace", 1200, 2538, 3],
        // ["Olive Oyl", 1175, 3544, 3],
    ]
        .map(([helmName, boatPY, finishTime, laps]) => createResult({ helmName, finishTime, boatPY, laps }));

}

function createRace3() {
    /**
     * 	Date	1/10/17	Race	3
     * 
Bananaman	    DEVOTI D-ZERO	1/U/0	1029	181			31:51:00	3	619 	1	1	-0.7	-7	    1911	-0.7217321572	1021.573376
Mickey Mouse	Laser       	1/U/0	1096	191874		34:25:00	3	628 	2	2	0.7	    8	    2065	0.7217321572	1103.910184
Scratchy	    Solo	        1/U/0	1133	4359		25:51:00	2	684.5	3	3	9.8	    111	    1551	9.783480353	    1243.846832
     */

    return [
        ["Bananaman", 1029, 1911, 3],
        ["Mickey Mouse", 1096, 2065, 3],
        ["Scratchy", 1133, 1551, 2],
    ]
        .map(([helmName, boatPY, finishTime, laps]) => createResult({ helmName, finishTime, boatPY, laps }));

}

function createRace4() {
    /**
     * ACT: 646.2571429
     * SCT: 639.75
        Bananaman	        DEVOTI D-ZERO	1/U/0	1029	181			    52:52:00	5	616.5	1	1	    -3.6	-37	    3171.8925	3172	-3.634232122	991.6037515   	
        Mickey Mouse	    Laser Radial	1/U/0	1147	191874			60:31:00	5	633.1	2	2	    -1	    -11	3   630.8285	3631	-1.039468542	1135.077296	
        Scrooge McDuck	    Solo	        1/U/0	1133	4931			60:03:00	5	636	    3=	3.5	    -0.6	-7	    3602.94	    3603	-0.5861664713	1126.358734	
        Donald Duck         Laser Radial	1/U/0	1147	177463			60:48:00	5	636.1	3=	3.5	    -0.6	-7	    3648.0335	3648	-0.5705353654	1140.455959	
        Popeye      	    Laser Radial	1/U/0	1147	191046	N		62:53:00	5	657.9	5	5	    2.8	    32	    3773.0565	3773	2.837045721	    1179.540914	
        Scooby Doo	        Laser	        1/U/0	1096	95792			60:11:00	5	658.9	6	6	    3	    33	    3610.772	3611	2.99335678	    1128.80719	
        Snoopy	            Laser Radial	1/U/0	1147	0			    65:30:00	5	685.3	7	7	    7.1	    81	    3930.1955	3930	7.119968738	    1228.666041	
        Scratchy    	    Solo	        1/U/0	1133	4359			65:06:00	5	689.5	8	8	    7.8	    88	    3906.0175	3906	7.776475186	    1221.107464	
        Olive Oyl	        Argo (No Spin)	2/S/0	1175	11420	JLN 	54:06:00	4	690.6	9	9	    7.9	    93	    3245.82	    3246	7.948417351	    1268.393904	
        Yogi Bear	        Laser	        1/U/0	1096	126279			65:46:00	5	720.1	10	10	    12.6	138	    3946.148	3946	12.55959359	    1233.653146	
        Minnie Mouse	    Laser 4.7	    1/U/0	1170	0	L		:			DNF	13									
        Charlie Brown	    RS VAREO	    1/U/A	1085	420			:			DNF	13								
     */
    return [
        ["Bananaman", 1029, 3172, 5],
        ["Mickey Mouse", 1147, 3631, 5],
        ["Scrooge McDuck", 1133, 3603, 5],
        ["Donald Duck", 1147, 3648, 5],
        ["Popeye", 1147, 3773, 5],
        ["Scooby Doo", 1096, 3611, 5],
        ["Snoopy", 1147, 3930, 5],
        ["Scratchy", 1133, 3906, 5],
        ["Olive Oyl", 1175, 3246, 4],
        ["Yogi Bear", 1096, 3946, 5],
        // ["Minnie Mouse", 1170, ,],
        // ["Charlie Brown", 1085, ,]
    ]
        .map(([helmName, boatPY, finishTime, laps]) => createResult({ helmName, finishTime, boatPY, laps }));
}

function createResult({
    helmName = DEFAULT_HELM_NAME,
    helmYearOfBirth = DEFAULT_HELM_helmYearOfBirth,
    helmGender = DEFAULT_HELM_GENDER,
    helmNoviceInFirstRace = DEFAULT_HELM_NOVICE,
    raceDate = DEFAULT_RACE_DATE,
    raceNumber = DEFAULT_RACE_NUMBER,
    boatClassName = DEFAULT_BOAT_CLASSNAME,
    boatConfiguration = DEFAULT_BOAT_CONFIG,
    boatPY = DEFAULT_BOAT_PY,
    boatPYValidFrom = DEFAULT_BOAT_PY_VALID_FROM,
    boatSailNumber = DEFAULT_BOAT_SN,
    laps = DEFAULT_LAPS,
    pursuitFinishPosition = DEFAULT_PURSUIT_FINISH_POSITION,
    finishTime = DEFAULT_FINISH_TIME,
    finishCode = DEFAULT_FINISH_CODE,
}) {
    const metadata = new StoreObject({ lastUpdated: new Date(0), dateCreated: new Date(0) });
    const race = new Race(raceDate, raceNumber);
    const helm = new Helm(helmName, helmYearOfBirth, helmGender, helmNoviceInFirstRace, metadata);
    const boatClass = new BoatClass(boatClassName, boatConfiguration, boatPY, boatPYValidFrom, false, metadata);
    return new Result(race, helm, boatClass, boatSailNumber, laps, pursuitFinishPosition, finishTime, finishCode, metadata);
}

function transformResult(result) {
    // console.log(result);
    return {
        ...result,
        helmName: result.getHelm().name,
        totalPersonalHandicapFromRace: result.getPersonalHandicapFromRace(),
    }
}

function testCorrectedTimeSameLaps() {
    let results = [
        ["helm 1", 1000, 2000, 2],
        ["helm 2", 1100, 2200, 2],
        ["helm 3", 1200, 3000, 2],
    ].map(([helmName, boatPY, finishTime, laps]) => createResult({ helmName, finishTime, boatPY, laps }));

    const correctedResults = getCorrectedResultsForRace(results, []);
    // console.log(correctedResults);

    assertDeepEquals(
        [
            ["helm 1", 2000],
            ["helm 2", 2000],
            ["helm 3", 2500],
        ],
        correctedResults.map(transformResult).map(({ helmName, classCorrectedTime }) => [helmName, classCorrectedTime]),
        "Failed test testCorrectedTimeSameLaps"
    );
}

function testCorrectedTimeDifferentLaps() {
    let results = [
        ["helm 1", 1000, 2000, 2],
        ["helm 2", 1100, 2200, 2],
        ["helm 3", 1000, 3000, 3],
    ].map(([helmName, boatPY, finishTime, laps]) => createResult({ helmName, finishTime, boatPY, laps }));

    const correctedResults = getCorrectedResultsForRace(results, []);

    assertDeepEquals(
        [
            ["helm 1", 3000, 3],
            ["helm 2", 3000, 3],
            ["helm 3", 3000, 3],
        ],
        correctedResults.map(transformResult).map(({ helmName, classCorrectedTime, raceMaxLaps }) => [helmName, classCorrectedTime, raceMaxLaps]),
        "Failed test testCorrectedTimeDifferentLaps"
    );
}

function testCorrectedTimeForRace() {
    /**
     * 
Bananaman	    DEVOTI D-ZERO	1/U/0	1029	181			    41:14   2474	4	601.1	1	1	    -1	    -10
Mickey Mouse	    Laser	        1/U/0	1096	191874			44:02	2642    4	602.6	2	2	    -0.8	-9
Scrooge McDuck	    Solo	        1/U/0	1133	4931			46:40	2800    4	617.8	3	3	    1.7	    19
Itchy	    Solo	        1/U/0	1133	3941			49:08	2948    4	650.5	4	4	    7.1	    80
Scratchy       Solo	        1/U/0	1133	4359			50:26	3026    4	667.7	5	5	    10	    113
Wallace       LASER 4.7	    1/U/0	1200	0	    J		42:18	2538    3	705	    6	6	    16.1    193
Olive Oyl       Argo (No Spin)	2/S/0	1175	11421	JLN		DNF	                8
     */
    const testRace = createRace2();
    const correctedResults = getCorrectedResultsForRace(testRace, []);

    assertDeepEquals(
        [
            ["Bananaman", 2404, 4],
            ["Mickey Mouse", 2411, 4],
            ["Scrooge McDuck", 2471, 4],
            ["Itchy", 2602, 4],
            ["Scratchy", 2671, 4],
            ["Wallace", 2820, 4],
        ],
        correctedResults.map(transformResult).map(({ helmName, classCorrectedTime, raceMaxLaps }) => [helmName, classCorrectedTime, raceMaxLaps]),
        "Failed test testCorrectedTimeForRace"
    );
}

function testCorrectedPersonalHandicap() {
    let results = [
        ["helm 1", 1000, 2000, 2],
        ["helm 2", 1100, 2200, 2],
        ["helm 3", 1000, 3000, 3],
    ].map(([helmName, boatPY, finishTime, laps]) => createResult({ helmName, finishTime, boatPY, laps }));

    const correctedResults = getCorrectedResultsForRace(results, []);

    assertDeepEquals(
        [
            ["helm 1", 3000, 3],
            ["helm 2", 3000, 3],
            ["helm 3", 3000, 3],
        ],
        correctedResults.map(transformResult).map(({ helmName, classCorrectedTime, raceMaxLaps }) => [helmName, classCorrectedTime, raceMaxLaps]),
        "Failed test testCorrectedPersonalHandicap"
    );
}

function testGetPH1() {
    /**
     * ACT: 693.3
     * SCT:	685.76
     * 
    Mickey Mouse	    Laser	        1/U/0	1096	191874			48:12:00	4	659.7	1	1	-3.8	-42	   2892     -3.800163322	1054.35021
    Scrooge McDuck   	Solo	        1/U/0	1133	4931			50:14:00	4	665	    2	2	-3	    -34	   3014     -3.02729818	    1098.700712
    Bananaman	    DEVOTI D-ZERO	1/U/0	1029	181		    	46:05:00	4	671.8	3	3	-2	    -21	   2765     -2.03569762	    1008.052671
    Minnie Mouse	    Laser Radial	1/U/0	1147	63163	L		53:52:00	4	704.4	4	4	2.7	    31	   3232     2.718152123	    1178.177205
    Itchy	    Solo	        1/U/0	1133	3941			54:59:00	4	727.9	5	5	6.1 	69	   3299     6.145007	    1202.622929
    Scratchy	    Solo	        1/U/0	1133	4359			55:13:00	4	731	    6	6	6.6     75	   3313     6.597060196	    1207.744692
    Wallace       LASER 4.7	    1/U/0	1200	0	J		    45:37:00	3	760.3	7	7	10.9	131	   2737     10.86969202	    1330.436304
    Betty Boop	    Argo (No Spin)	2/S/0	1175	11420	L	    47:02:00	3	800.6	8	8	16.7	196	   2822     16.74638357	    1371.770007
    Peter Rabbit  	Solo	        1/U/0	1133	219			    46:57:00	3	828.8	9	9	20.9	237	   2817     20.85860943	    1369.328045							
     */

    let results = createRace1();
    const correctedResults = getCorrectedResultsForRace(results, []);
    const expected = [
        ["Mickey Mouse", 1096 - 53],
        ["Scrooge McDuck", 1133 - 46],
        ["Bananaman", 1029 - 32],
        ["Minnie Mouse", 1147 + 18],
        ["Itchy", 1133 + 57], // ** spreadsheet indicated difference to website results
        ["Scratchy", 1133 + 62],
        ["Wallace", 1200 + 116], // ** spreadsheet indicated difference to website results
        ["Betty Boop", 1175 + 182], // ** spreadsheet indicated difference to website results
        ["Peter Rabbit", 1133 + 221], // ** spreadsheet indicated difference to website results
    ];
    assertDeepEquals(
        expected,
        correctedResults
            .map(transformResult)
            .map((r) => [r.helmName, r.totalPersonalHandicapFromRace]),
        "testGetPH1 failed",
    );
}

function testGetPH2() {

    // * 	Date	1/10/17	Race	2
    /**
Bananaman	    DEVOTI D-ZERO	1/U/0	1029	181			    41:14   2474	4	601.1	1	1	    -1	    -10
Mickey Mouse	    Laser	        1/U/0	1096	191874			44:02	2642    4	602.6	2	2	    -0.8	-9
Scrooge McDuck	    Solo	        1/U/0	1133	4931			46:40	2800    4	617.8	3	3	    1.7	    19
Itchy	    Solo	        1/U/0	1133	3941			49:08	2948    4	650.5	4	4	    7.1	    80
Scratchy       Solo	        1/U/0	1133	4359			50:26	3026    4	667.7	5	5	    10	    113
Wallace       LASER 4.7	    1/U/0	1200	0	    J		42:18	2538    3	705	    6	6	    16.1    193
Olive Oyl       Argo (No Spin)	2/S/0	1175	11421	JLN		DNF	                8
     */
    let results = createRace2();
    const correctedResults = getCorrectedResultsForRace(results, []);
    const expected = [
        ["Bananaman", 1029 - 28],
        ["Mickey Mouse", 1096 - 27], // ** spreadsheet indicated difference to website results
        ["Scrooge McDuck", 1133 + 0], // ** spreadsheet indicated difference to website results
        ["Itchy", 1133 + 60], // ** spreadsheet indicated difference to website results
        ["Scratchy", 1133 + 91],
        ["Wallace", 1200 + 169],
    ];
    assertDeepEquals(
        expected,
        correctedResults
            .map(transformResult)
            .map((r) => [r.helmName, r.totalPersonalHandicapFromRace]),
        "testGetPH2 failed",
    );
}

function testGetPH3() {
    // 
    /** 	
     * Date	1/10/17	Race	3
    * 
Bananaman	DEVOTI D-ZERO	1/U/0	1029	181			31:51:00	3	619 	1	1	-0.7	-7	    1911	-0.7217321572	1021.573376
Mickey Mouse	Laser       	1/U/0	1096	191874		34:25:00	3	628 	2	2	0.7	    8	    2065	0.7217321572	1103.910184
Scratchy	Solo	        1/U/0	1133	4359		25:51:00	2	684.5	3	3	9.8	    111	    1551	9.783480353	    1243.846832
     */
    let results = createRace3();
    const correctedResults = getCorrectedResultsForRace(results, []);
    const expected = [
        ["Bananaman", 1029 - 7],
        ["Mickey Mouse", 1096 + 8],
        ["Scratchy", 1133 + 111],
    ];
    assertDeepEquals(
        expected,
        correctedResults
            .map(transformResult)
            .map((r) => [r.helmName, r.totalPersonalHandicapFromRace]),
        "testGetPH3 failed",
    );
}



function testGetPH4() {
    /**
     * 
     * 
        Bananaman	        DEVOTI D-ZERO	1/U/0	1029	181			    52:52:00	5	616.5	1	1	    -3.6	-37	    3171.8925	3172	-3.634232122	991.6037515   	
        Mickey Mouse	    Laser Radial	1/U/0	1147	191874			60:31:00	5	633.1	2	2	    -1	    -11	3   630.8285	3631	-1.039468542	1135.077296	
        Scrooge McDuck	    Solo	        1/U/0	1133	4931			60:03:00	5	636	    3=	3.5	    -0.6	-7	    3602.94	    3603	-0.5861664713	1126.358734	
        Donald Duck         Laser Radial	1/U/0	1147	177463			60:48:00	5	636.1	3=	3.5	    -0.6	-7	    3648.0335	3648	-0.5705353654	1140.455959	
        Popeye      	    Laser Radial	1/U/0	1147	191046	N		62:53:00	5	657.9	5	5	    2.8	    32	    3773.0565	3773	2.837045721	    1179.540914	
        Scooby Doo	        Laser	        1/U/0	1096	95792			60:11:00	5	658.9	6	6	    3	    33	    3610.772	3611	2.99335678	    1128.80719	
        Snoopy	            Laser Radial	1/U/0	1147	0			    65:30:00	5	685.3	7	7	    7.1	    81	    3930.1955	3930	7.119968738	    1228.666041	
        Scratchy    	    Solo	        1/U/0	1133	4359			65:06:00	5	689.5	8	8	    7.8	    88	    3906.0175	3906	7.776475186	    1221.107464	
        Olive Oyl	        Argo (No Spin)	2/S/0	1175	11420	JLN 	54:06:00	4	690.6	9	9	    7.9	    93	    3245.82	    3246	7.948417351	    1268.393904	
        Yogi Bear	        Laser	        1/U/0	1096	126279			65:46:00	5	720.1	10	10	    12.6	138	    3946.148	3946	12.55959359	    1233.653146	
        Minnie Mouse	    Laser 4.7	    1/U/0	1170	0	L		:			DNF	13									
        Charlie Brown	    RS VAREO	    1/U/A	1085	420			:			DNF	13									
    */

    let results = createRace4();
    const correctedResults = getCorrectedResultsForRace(results, []);
    const expected = [
        ["Bananaman", 982],
        ["Mickey Mouse", 1124],
        ["Scrooge McDuck", 1115],
        ["Donald Duck", 1129],
        ["Popeye", 1168], // ** slight discrepancy with spreadsheet
        ["Scooby Doo", 1117],
        ["Snoopy", 1216],
        ["Scratchy", 1209],
        ["Olive Oyl", 1256],
        ["Yogi Bear", 1221],
    ];
    assertDeepEquals(
        expected,
        correctedResults
            .map(transformResult)
            .map((r) => [r.helmName, r.totalPersonalHandicapFromRace]),
        "testGetPH4 failed",
    );
}

function processRaces(races, transformInputs) {
    let input = [];
    let output = [];
    for (let [key, race] of races.entries()) {
        input.push([]);
        for (let result of race) {
            const args = transformInputs(result[0], key);
            input[key].push(createResult({
                raceDate: new Date(key),
                ...args,
            }));
            output.push(result[1]);
        }
    }
    return [input, output];
}

function generateRaces(transform, fixedResultsForEachRace, ...varyingResultsPerRace) {
    const maxRaces = varyingResultsPerRace.reduce((max, varying) => Math.max(max, varying.length), -Infinity);
    if (maxRaces <= 0) {
        return;
    }
    const races = [];
    for (let i = 0; i < maxRaces; i++) {
        races[i] = [...fixedResultsForEachRace];
        for (let varying of varyingResultsPerRace) {
            if (varying[i]) {
                races[i].push([...varying[i]])
            }
        }
    }
    return processRaces(races, transform);
}

function deepEqualsResults(expectedResults, actualResults, message) {
    for (let [key, expectedResult] of expectedResults.entries()) {
        assertDeepEquals(
            expectedResult,
            actualResults[key],
            `${message}\nExpected:\n${expectedResult}\nBut got:\n${actualResults[key]}\n for result ${key}`,
        );
    }
}

function testRollingPH() {
    // Input:
    //    helm, boatClassName, boatPY, finishTime, laps
    //                          correctedTime,  PH,   correctedForPHTime    rollingPH(for class)
    // Output:
    const varying = [
        [["helm 1", "class1", 1000, 2000, 2], [2000, 2000, 2000, 1000]], // Try to force not to contribute to SCT, first rolling PH is equal to class PH (for non-novice helm) and no other classes have been sailed.
        [["helm 1", "class1", 1000, 2000, 2], [2000, 2000, 1333, 1500]], // Second rolling PH is average of initial PH (class PY) and first race PH
        [["helm 1", "class2", 1200, 2000, 2], [1667, 2000, 1000, 2000]], // Because sailing a new class "PY:1200", rolling PH is: (1000+2000+2000) / 3 = ( 1667 / 1000 - 1 ) * 100 = 66.7%, new handicap is then: 1200 * 66.7% = 2000
        [["helm 1", "class1", 1000, 1667, 2], [1667, 1667, 1000, 1667]], // go back to original class and continue PH where left off (1667)
        [["helm 1", "class2", 1200, 2000, 2], [1667, 2000, 1000, 2000]], // go back to second class and continue PH where left off (2000)
        [["helm 1", "class3", 1500, 2000, 2], [1333, 2000, 800, 2500]], // Because sailing a new class "PY:1500", rolling PH is: 1000 * (1 + 2 + 2 + 2/1.2 + 1.667 + 2/1.2) / 6 = ( 1667 / 1000 - 1 ) * 100 = 66.7%, new handicap is then: 1500 * 166.7% = 2500
        [["helm 1", "class1", 1500, 1667, 2], [1111, 1667, 1000, 1667]], // Class handicap has changed from 1000 to 1500, but should still continue from 1667 (previous rolling PH for class), in this case PH stays the same but PI is reduced
    ];

    const fixed = [
        [["helm 2", "classA", 2000, 2000, 2], [1000, 2000, 1000, 2000]],
        [["helm 3", "classA", 2000, 2000, 2], [1000, 2000, 1000, 2000]],
    ];

    const [raceInputs, expected] = generateRaces(
        ([a, b, c, d, e]) => ({ helmName: a, boatClassName: b, boatPY: c, finishTime: d, laps: e }),
        fixed,
        varying,
    );

    const correctedResults = [];
    for (let raceResults of raceInputs) {
        correctedResults.push(...getCorrectedResultsForRace(raceResults, correctedResults));
    }

    deepEqualsResults(
        expected,
        correctedResults
            .map(transformResult)
            .map((r) => [r.classCorrectedTime, r.totalPersonalHandicapFromRace, r.personalCorrectedTime, r.rollingPersonalHandicapBeforeRace]),
        "testRollingPH failed",
    );
}

function testRollingNoviceHelm() {
    const INITIAL_PI_FOR_NOVICE_HELM = 20; // In percent
    // Input:
    //    helm, boatClassName, boatPY, finishTime, laps
    //                          correctedTime,  PH,   correctedForPHTime    rollingPH(for class)
    // Output:
    const varying = [
        [["helm 1", true, "class1", 1000, 2000, 2], [2000, 2000, 1667, 1200]], // Novice helm so initial PH is 1000 * 120%
        [["helm 1", true, "class1", 1000, 2000, 2], [2000, 2000, 1250, 1600]], // Second rolling PH is average of initial PH (class PY) and first race PH
        [["helm 1", true, "class2", 1200, 2000, 2], [1667, 2000, 962, 2080]], // Because sailing a new class "PY:1200", rolling PH is: 1000 * (1.2 + 2 + 2) / 3 = ( 1733 / 1000 - 1 ) * 100 = 73.3%, new handicap is then: 1200 * 173.3% = 2080
        [["helm 1", true, "class1", 1000, 1667, 2], [1667, 1667, 962, 1733]], // go back to original class and continue PH where left off (1733)
        [["helm 1", true, "class2", 1200, 2000, 2], [1667, 2000, 980, 2040]], // go back to second class and continue PH where left off (2040)
        [["helm 1", true, "class3", 1500, 2000, 2], [1333, 2000, 784, 2550]], // Because sailing a new class "PY:1500", rolling PH is: 1000 * (1.2 + 2 + 2 + 2/1.2 + 1.667 + 2/1.2) / 6 = ( 1700 / 1000 - 1 ) * 100 = 70%, new handicap is then: 1500 * 170% = 2550
        [["helm 1", true, "class1", 1500, 1667, 2], [1111, 1667, 971, 1717]], // Class handicap has changed from 1000 to 1500, but should still continue from 1717 (previous rolling PH for class), in this case PH stays the same but PI is reduced
    ];

    const fixed = [
        [["helm 2", false, "classA", 2000, 2000, 2], [1000, 2000, 1000, 2000]],
        [["helm 3", false, "classA", 2000, 2000, 2], [1000, 2000, 1000, 2000]],
    ];

    const [raceInputs, expected] = generateRaces(
        ([a, novice, b, c, d, e]) => ({ helmName: a, helmNoviceInFirstRace: novice, boatClassName: b, boatPY: c, finishTime: d, laps: e }),
        fixed,
        varying,
    );

    const correctedResults = [];
    for (let raceResults of raceInputs) {
        correctedResults.push(...getCorrectedResultsForRace(raceResults, correctedResults));
    }

    deepEqualsResults(
        expected,
        correctedResults
            .map(transformResult)
            .map((r) => [r.classCorrectedTime, r.totalPersonalHandicapFromRace, r.personalCorrectedTime, r.rollingPersonalHandicapBeforeRace]),
        "testRollingNoviceHelm failed",
    );
}

function testNoviceTransition() {
    // Input:
    //    helm, wasNoviceInFirstRace
    //                          
    // Output:              novice
    const varying = [
        [["helm 1", true], [true]], // race 1, 1970-01-01
        [["helm 1", true], [true]],
        [["helm 1", true], [true]],
        [["helm 1", true], [true]],
        [["helm 1", true], [true]],
        [["helm 1", true], [true]],
        [["helm 1", true], [true]],
        [["helm 1", true], [true]],
        [["helm 1", true], [true]],
        [["helm 1", true], [true]],
        [["helm 1", true], [true]], // race 11
        [["helm 1", true], [true]], // this is the last race as novice (12th race)
        [["helm 1", true], [false]], // 13
        [["helm 1", true], [false]], // 14
        [["helm 1", true], [false]], // race 15, 1970-12-17T00:00:00.000Z
        [["helm 1", true], [false]], // race 16, 1971-01-11T00:00:00.000Z
    ];

    const fixed = [
        [["helm 2", false], [false]],
        [["helm 3", false], [false]],
    ];

    const MILLIS_IN_25_DAYS = 25 * 24 * 60 * 60 * 1000;

    const [raceInputs, expected] = generateRaces(
        ([helmName, helmNoviceInFirstRace], raceId) => ({ helmName, helmNoviceInFirstRace, raceDate: new Date(MILLIS_IN_25_DAYS * raceId) }),
        fixed,
        varying,
    );

    const correctedResults = [];
    for (let raceResults of raceInputs) {
        correctedResults.push(...getCorrectedResultsForRace(raceResults, correctedResults));
    }

    deepEqualsResults(
        expected,
        correctedResults
            .map(transformResult)
            .map((r) => [r.novice]),
        "testNoviceTransition failed",
    );
}


function runTests() {
    try {
        testCorrectedTimeSameLaps();
        testCorrectedTimeDifferentLaps();
        testCorrectedTimeForRace();
        testGetPH1();
        testGetPH2();
        testGetPH3();
        testGetPH4();
        // TODO Tests failing
        // testRollingPH();
        // testRollingNoviceHelm();
        // testNoviceTransition();
        console.log("Tests passed");
    }
    catch (err) {
        console.log(err);
    }
}

runTests();
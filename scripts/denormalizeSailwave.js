import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import * as XLSX from 'xlsx';
import {
    groupBy
} from "../src/common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TODO - for sailwave compatible output, NEW_POINTS_FORMULA_START_DATE needs to be set

/**
 * Denormalizer: Converts Sailwave "fragments" into structured Domain Objects
 */
function getDenormalizedData(fileName) {
    const filePath = path.join(__dirname, fileName);
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split(/\r?\n/);

    const denormalized = {
        series: {},
        competitors: {},
        races: {},
        resultsMap: {} 
    };

    lines.forEach(line => {
        const p = line.split(',').map(x => x.replace(/"/g, '').trim());
        const type = p[0];
        if (!type) return;

        // 1. Series (Global Config)
        if (type.startsWith('ser')) {
            denormalized.series[type] = p[1];
        }

        // 2. Competitors (Keyed by ID at index 2)
        if (type.startsWith('comp')) {
            const cId = p[2];
            if (!denormalized.competitors[cId]) denormalized.competitors[cId] = { id: cId };
            denormalized.competitors[cId][type] = p[1];
        }

        // 3. Races (Keyed by ID at index 3 based on your example rows)
        if (type.startsWith('race')) {
            const rId = p[3]; 
            if (!rId) return;

            if (!denormalized.races[rId]) denormalized.races[rId] = { id: rId };
            
            if (type === 'racedate') {
                let isoDate = '1970-01-01';
                // Input format: DD-MM-YY (e.g., 23-03-25)
                if (p[1] && p[1].includes('-')) {
                    const [d, m, y] = p[1].split('-');
                    // Assume 20xx for two-digit years
                    const fullYear = y.length === 2 ? `20${y}` : y;
                    const dateObj = new Date(Date.UTC(parseInt(fullYear), parseInt(m) - 1, parseInt(d)));
                    if (!isNaN(dateObj)) isoDate = dateObj.toISOString().split('T')[0];
                }
                denormalized.races[rId].date = isoDate;
            }
            denormalized.races[rId][type] = p[1];
        }

        // 4. Results (Including 'rlps' for laps)
        if (['rcor', 'rele', 'rpos', 'rpts', 'rlps', 'rcod'].includes(type)) {
            const cId = p[2]; // Competitor ID
            const rId = p[3]; // Race ID
            const key = `r${rId}c${cId}`;
            
            if (!denormalized.resultsMap[key]) {
                denormalized.resultsMap[key] = { raceId: rId, compId: cId };
            }
            
            if (type === 'rcor' || type === 'rele') {
                denormalized.resultsMap[key][type] = parseSailwaveTime(p[1]);
            } else {
                denormalized.resultsMap[key][type] = p[1]; // Time
            }
        }
    });

    return {
        series: denormalized.series,
        competitors: denormalized.competitors,
        races: denormalized.races,
        results: Object.values(denormalized.resultsMap)
    };
}

/**
 * Normalizes Sailwave time strings into a structured object.
 * Handles: "50.40" (MM.SS) and "0:49:38" (H:MM:SS)
 */
function parseSailwaveTime(timeStr) {
    if (!timeStr || timeStr === "0" || timeStr === "") {
        return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
    }

    let h = 0, m = 0, s = 0;

    if (timeStr.includes(':')) {
        // Handle H:MM:SS or MM:SS
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) {
            [h, m, s] = parts;
        } else if (parts.length === 2) {
            [m, s] = parts;
        }
    } else if (timeStr.includes('.')) {
        // Handle decimal format MM.SS
        const [mins, secs] = timeStr.split('.').map(Number);
        m = mins;
        s = secs;
    } else {
        throw new Error(`Unrecognized time format: ${timeStr}`);
        // Fallback for raw minute entries or unexpected integers
        m = parseInt(timeStr, 10) || 0;
    }

    const totalSeconds = (h * 3600) + (m * 60) + s;
    return { hours: h, minutes: m, seconds: s, totalSeconds };
}

function getResult(res) {
    /**
     * SAILWAVE PRIORITY LOGIC:
     * rrestyp "1" or "2" means a timed finish is active.
     * rrestyp "3" means a scoring code (DNF/DNC) is active.
     */
    const isTimedFinish = (res.rrestyp === "1" || res.rrestyp === "2");
    
    // Debugger statement removed for production/bulk run
    let finishSeconds;
    let finishCode = "";

    if (isTimedFinish || !res.rcod || res.rcod === "" || (res.rele?.totalSeconds && res.rcod === "DNC")) {
        // Priority to Corrected, fallback to Elapsed
        finishSeconds = res.rele?.totalSeconds;
        // In timed mode, we leave finishCode empty even if rcod exists in the file
    } else {
        // In scoring code mode, we use rcod or the non-numeric rpos
        finishCode = res.rcod;
    }

    if (!finishSeconds && (finishCode === "" || finishCode ==="DNC")) {
        return;
    }

    const computedFinishCode = finishCode !== "" ? finishCode === "Duty" ? "Duty" : "DNF" : '';

    // --- SPLIT LOGIC ---
    // If computedFinishCode is "Duty", we skip adding it to rows here.
    // It will be handled by transformToOODsCSV (or we filter it out here).
    if (computedFinishCode === "Duty") {
        return; 
    }
    return { finishSeconds, computedFinishCode, laps: finishSeconds && (res.rlps || 1), res };
}

function getBestResult(results) {
    const allResults = results.map((r) => getResult(r));
    return allResults.sort((b, a) => {
        if (!a && b) return -1;
        if (a && !b) return 1;
        if (!a.finishSeconds && !b.finishSeconds) {
            return 0;
        }
        if (a.finishSeconds && !b.finishSeconds) {
            return 1;
        }
        if (b.finishSeconds && !a.finishSeconds) {
            return -1;
        }
        if (a.res.rcod && !b.res.rcod) {
            return -1;
        }
        if (!a.res.rcod && b.res.rcod) {
            return 1;
        }
        return 0;
    })[0] || allResults[0];
}

function getRaceCompetitorKey(res, data) {
    return [
        data.competitors[res.compId].comphelmname,
        res.raceId,
    ].join('|');
}

function transformToDatabaseCSV(datasets) {
    const header = ["Date","Race Number","Helm","Sail Number","Class","Laps","Pursuit Finish Position","Finish Time","Finish Code","Crew","Last Updated","Created Date"];
    const rows = [];
    datasets.forEach(data => {
        // Sailwave allows more than one result if some are marked DNC, get the best one
        console.log(`Processing series: ${data.series['serevent'] || 'Unknown Series'} with ${data.results.length} results`);
        groupBy(data.results, res => getRaceCompetitorKey(res, data))
            .map(([, helmRaceResults]) => getBestResult(helmRaceResults))
            .filter(Boolean)
            .forEach(({ finishSeconds, computedFinishCode, laps, res }) => {
                const comp = data.competitors[res.compId];
                const race = data.races[res.raceId];

                if (!race || !race.date) {
                    throw new Error(`Data Integrity Error: Race ID ${res.raceId} has no date defined.`);
                }
                if (!comp) {
                    throw new Error(`Data Integrity Error: Competitor ID ${res.compId} not found.`);
                }

                rows.push([
                    race.date,                         // YYYY-MM-DD
                    res.raceId,                        // Race Number
                    comp.comphelmname || 'Unknown',    // Helm
                    comp.compsailno || 'N/A',          // Sail Number
                    comp.compclass || 'N/A',           // Class
                    laps || '',                        // Laps
                    "",                                // Pursuit Finish Position (not calculated)
                    finishSeconds || '',               // Finish Time
                    computedFinishCode,                // Finish Code (DNF, DNC, etc.)
                    comp.compcrewname,                 // Crew
                    "",                                // Last Updated (not tracked)
                    "",                                // Created Date (not tracked)   
                ]);
            });
        console.log(`Processed ${rows.length} fleet results so far.`);
    });

    return [header, ...rows];
}

function transformToOODsCSV(datasets) {
    const header = ["Date", "Race Number", "Helm", "Crew"];
    const rows = [];
    
    datasets.forEach(data => {
        data.results.forEach(res => {
            const comp = data.competitors[res.compId];
            const race = data.races[res.raceId];

            const isTimedFinish = (res.rrestyp === "1" || res.rrestyp === "2");
            let finishCode = "";

            if (!isTimedFinish) {
                finishCode = res.rcod;
            }

            if (!race || !race.date || !comp) return;

            // Check if it is a "Duty"
            if (finishCode === "Duty") {
                rows.push([
                    race.date,
                    res.raceId,
                    comp.comphelmname || 'Unknown',
                    comp.compcrewname || ''
                ]);
            }
        });
    });
    
    // Sort by Date
    rows.sort((a, b) => a[0].localeCompare(b[0]));

    return [header, ...rows];
}

function transformToHelmsCSV(datasets) {
    const header = ["Name", "Gender"];
    const uniquePeople = new Set();
    const rows = [];
    
    datasets.forEach(data => {
        Object.values(data.competitors).forEach(comp => {
            const helmName = comp.comphelmname;
            if (helmName && !uniquePeople.has(helmName)) {
                uniquePeople.add(helmName);
                // Gender is not available in the source data based on inspection.
                // Placeholder for future mapping if source data includes 'comphelmsex' or similar.
                const gender = comp.comphelmsex || ""; 
                rows.push([helmName, gender]);
            }

            const crewName = comp.compcrewname;
            if (crewName && !uniquePeople.has(crewName)) {
                uniquePeople.add(crewName);
                const gender = comp.compcrewsex || ""; 
                rows.push([crewName, gender]);
            }
        });
    });
    
    // Sort alphabetically by name
    rows.sort((a, b) => a[0].localeCompare(b[0]));

    return [header, ...rows];
}

function transformToClassesCSV(datasets) {
    const header = ["Class", "PY"];
    const uniqueClasses = new Map();

    datasets.forEach(data => {
        Object.values(data.competitors).forEach(comp => {
            const className = comp.compclass;
            const rating = comp.comprating;

            if (className && !uniqueClasses.has(className)) {
                uniqueClasses.set(className, rating || "");
            }
        });
    });

    const rows = Array.from(uniqueClasses.entries()).map(([className, py]) => [className, py]);
    
    // Sort alphabetically by class
    rows.sort((a, b) => a[0].localeCompare(b[0]));

    return [header, ...rows];
}

function transformToSeriesRacesCSV(datasets) {
    const header = ["Season", "Series", "Race Date", "Race Number"];
    const rows = [];

    datasets.forEach(data => {
        const seriesName = data.series['serevent'] || 'Unknown Series';

        Object.values(data.races).forEach(race => {
            if (!race.date || race.date === '1970-01-01') return;

            const date = race.date;
            const year = date.split('-')[0];
            
            rows.push([
                year,
                seriesName,
                date,
                race.id
            ]);
        });
    });
    
    // Sort by Date then Race Number
    rows.sort((a, b) => {
        if (a[2] !== b[2]) return a[2].localeCompare(b[2]);
        return parseInt(a[3]) - parseInt(b[3]);
    });

    return [header, ...rows];
}

function writeCSV(filePath, rows) {
    const csvContent = rows.map(r => r.join(',')).join('\n');
    fs.writeFileSync(filePath, csvContent, 'utf8');
}

function writeExcel(filePath, sheetsData) {
    const wb = XLSX.utils.book_new();
    
    // Add each sheet to the workbook
    Object.entries(sheetsData).forEach(([sheetName, data]) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, filePath);
}
/**
 * Default Export
 */
export default function(...sourceFilePaths) {
    if (sourceFilePaths.length === 0) {
        console.error("No source files provided.");
        process.exit(1);
    }

    try {
        const datasets = sourceFilePaths.map(filePath => {
            console.log(`Processing: ${filePath}`);
            return getDenormalizedData(filePath);
        });

        // Use the first dataset for sample output/debug just to check structure
        // Or we could log summary "Loaded X datasets"
        console.log(`\nLoaded ${datasets.length} series files.`);

        console.log("\n--- GENERATING RECORDS ---");
        
        // Generate Records (Arrays)
        const fleetResults = transformToDatabaseCSV(datasets);
        const helmsResults = transformToHelmsCSV(datasets);
        const oodsResults = transformToOODsCSV(datasets);
        const classResults = transformToClassesCSV(datasets);
        const seriesRacesResults = transformToSeriesRacesCSV(datasets);

        console.log("\n--- WRITING CSVs ---");
        
        writeCSV("FleetResults.csv", fleetResults);
        console.log("FleetResults.csv created");

        writeCSV("Helms.csv", helmsResults);
        console.log("Helms.csv created");

        writeCSV("OODs.csv", oodsResults);
        console.log("OODs.csv created");

        writeCSV("BoatClasses.csv", classResults);
        console.log("BoatClasses.csv created");

        writeCSV("SeriesRaces.csv", seriesRacesResults);
        console.log("SeriesRaces.csv created");

        console.log("\n--- WRITING EXCEL ---");
        const excelData = {
            "Fleet Results": fleetResults,
            "Helms": helmsResults,
            "OODs": oodsResults,
            "Boat Classes": classResults,
            "Series Races": seriesRacesResults
        };
        
        writeExcel("ShorehamResults.xlsx", excelData);
        console.log("ShorehamResults.xlsx created - Ready for Google Sheets import!");

    } catch (e) {
        console.error(`\x1b[31mError: ${e.message}\x1b[0m`);
        
        // Log stack trace for better debugging if needed
        if (e.stack) console.error(e.stack);
        
        process.exit(1);
    }
}
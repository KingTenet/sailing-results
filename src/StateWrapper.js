import { Outlet, useSearchParams, useParams } from "react-router-dom";
import { useAppState } from "./useAppState";
import { tokenParser } from "./token.js";
// import { SheetsAPI } from "./SheetsAPI";
import React, { useEffect, useState } from "react";
import { parseISOString, getSheetIdFromURL, assertType, groupBy } from "./common";
import SearchIndex from "./SearchIndex";
import Stores from "./store/Stores";
import BoatClass from "./store/types/BoatClass";
import Helm from "./store/types/Helm";
import Race from "./store/types/Race";
import Result from "./store/types/Result";
import RaceFinish from "./store/types/RaceFinish";
import MutableRaceFinish from "./store/types/MutableRaceFinish";
import ReactiveRaceFinish from "./store/types/ReactiveRaceFinish";
import { Button, Box } from "@chakra-ui/react";
import MutableRaceResult from "./store/types/MutableRaceResult";
import HelmResult from "./store/types/HelmResult";

async function initialiseStateFromToken(store, token) {
    if (!token) {
        return { readOnlyMode: true };
    }

    let {
        raceDate: raceDateString,
        numberOfRaces,
        privateKey,
        clientEmail,
        sheetId,
    } = tokenParser(token);

    const editableRaceDate = parseISOString(raceDateString);

    // const sheetsAPI = new SheetsAPI(sheetId, clientEmail, privateKey);
    // await sheetsAPI.promiseReady();

    // if (store) {
    //     return {
    //         store: store,
    //         services,
    //         readOnlyMode: false,
    //     };
    // }

    // const helms = await sheetsAPI.getAllHelms();
    // const races = await sheetsAPI.getRacesForDate(raceDate);


    const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw/edit#gid=1747234560";
    const seriesResultsURL = "https://docs.google.com/spreadsheets/d/1yngxguLyDsFHR-DLA72riRgYzF_nCrlaz01DVeEolMQ/edit#gid=1432028078";

    const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
    const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);
    const stores = await Stores.create({ privateKey, clientEmail }, sourceResultsSheetId, seriesResultsSheetId);

    const helms = stores.helms.all();
    const results = stores.results;
    const registered = stores.registered;

    // console.log(stores.seriesRaces);


    // const classNames = ;
    // const boats = [...new Set(stores.ryaClasses.all().map((boat) => boat.getClassName()))].map((className) => ({ className })); // Unique boat class names
    const boatsByYear = groupBy(stores.ryaClasses.all(), BoatClass.getClassYear);
    const boatIndexesByYear = new Map(boatsByYear.map(([classYear, boats]) => [classYear, new SearchIndex(boats, "className")]));

    console.log(stores.results.all().filter((result) => result.hasStaleRemote()))

    const services = {
        // sheetsAPI,
        stores,
        helmsIndex: new SearchIndex(helms, "name"), //, (score, obj) => score - obj.daysSinceRaced > DAYS_IN_YEAR ? -0.1 : 0),
        getBoatIndexForRace: (race) => boatIndexesByYear.get(BoatClass.getClassYearForRaceDate(race.getDate())),
    };

    function syncResults() {
        results.sync();
    }

    function finishRace() {
        stores.processResults();
    }

    function signOnHelm(race, helm, boatClass, boatSailNumber) {
        const signon = MutableRaceResult.fromUser(
            race,
            stores.helms.get(Helm.getId(helm)),
            stores.ryaClasses.get(BoatClass.getId(boatClass)),
            boatSailNumber,
        );
        registered.add(signon);
        // race.addResult(result);
        // stores.processResults();
        return signon;
    }

    function finishHelm(race, helm, boatClass, boatSailNumber, laps, finishTime, finishCode) {
        const signon = MutableRaceResult.fromUser(
            race,
            stores.helms.get(Helm.getId(helm)),
            stores.ryaClasses.get(BoatClass.getId(boatClass)),
            boatSailNumber,
        );
        const signedOnHelm = registered.get(HelmResult.getId(signon));
        const result = Result.fromMutableRaceResult(
            signedOnHelm,
            laps,
            undefined,
            finishTime,
            finishCode,
        );
        if (!results.has(HelmResult.getId(result))) {
            results.add(result);
            registered.delete(result);
        }
        else {
            throw new Error("Helm already exists");
        }

        // race.addResult(result);
        // stores.processResults();
        return result;
    }

    return {
        // store: {
        //     raceDate: raceDate,
        //     helms: helms,
        //     activeRaces: races.map((raceFinish) => ({
        //         mutable: !raceFinish.hasImmutableResults(),
        //         raceNumber: raceFinish.getNumber(),
        //         results: raceFinish.results,
        //     })),
        //     otherActiveRaces: races.map(ReactiveRaceFinish.fromRaceFinish)
        // },
        services,
        editableRaceDate: editableRaceDate,
        readOnlyMode: false,
        signOnHelm,
        finishHelm,
        finishRace,
    };
}


export default function StateWrapper() {
    const [state, updateAppState] = useAppState(false);
    const [token, setToken] = useState();
    let [searchParams, setSearchParams] = useSearchParams();
    let params = useParams();

    // TODO - should perhaps allow activeRaces initialisation via path instead of token?
    const raceNumber = params["raceNumber"];
    const raceDate = params["raceDate"];

    useEffect(() => {
        if (!token) {
            const urlToken = searchParams.get("token");

            if (urlToken && urlToken !== localStorage.getItem("token")) {
                console.log("Received new token");
                setSearchParams()
                localStorage.setItem("token", urlToken);
                localStorage.removeItem("state");
            }

            let localStorageToken = localStorage.getItem("token");
            setToken(localStorageToken);
        }
    }, []);

    useEffect(() => {
        if (token === undefined) {
            return;
        }

        initialiseStateFromToken(localStorage.getItem("state"), token)
            .then((state) => {
                console.log(state)
                console.log("Updating state");
                updateAppState(state)
            })
            .catch((err) => console.log(err))
    }, [token])

    return (
        <>
            <Box>
                <Debug />
            </Box>
            {!state &&
                <p>Loading state...</p>
            }
            {state && state.readOnlyMode &&
                <p>Read only mode...</p>
            }
            {/* {state && state.readOnlyMode===false && 
                <Outlet/>
            } */}
            {/* This is a bit gross as it relies on the Outlet implementations to not render until they have state but they're currently forcing a redirect*/}
            <Outlet />
        </>
    )
}

function Debug() {
    const [state, updateAppState] = useAppState(false);

    return (
        <Button onClick={() => console.log(state)}>Log state</Button>
    )
}
import { Outlet, useSearchParams, useParams } from "react-router-dom";
import { useAppState } from "./useAppState";
import { tokenParser } from "./token.js";
import { SheetsAPI } from "./SheetsAPI";
import React, { useEffect, useState } from "react";
import { parseISOString } from "./common";
import { Index } from "./search";



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

    const raceDate = parseISOString(raceDateString);

    const sheetsAPI = new SheetsAPI(sheetId, clientEmail, privateKey);
    await sheetsAPI.promiseReady();


    // if (store) {
    //     return {
    //         store: store,
    //         services,
    //         readOnlyMode: false,
    //     };
    // }

    const helms = await sheetsAPI.getAllHelms();
    const races = await sheetsAPI.getRacesForDate(raceDate);
    const services = {
        sheetsAPI,
        helmsIndex: new Index(helms, "name"), //, (score, obj) => score - obj.daysSinceRaced > DAYS_IN_YEAR ? -0.1 : 0),
    };

    return {
        store: {
            raceDate: raceDate,
            // helms: helms,
            activeRaces: races,
        },
        services,
        readOnlyMode: false,
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
            <Debug />
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
        <button onClick={() => console.log(state)}>Log state</button>
    )
}
import { Outlet, useSearchParams } from "react-router-dom";
import { useAppState, useServices, ServicesContext, CachedContext, useCachedState } from "./useAppState";
import { tokenParser } from "./token.js";
import React, { useEffect, useState } from "react";
import { getSheetIdFromURL } from "./common";
import { Box, Text } from "@chakra-ui/react";
import { RedButton } from "./components/Buttons";
import Spinner from "./components/Spinner";
import { StoreFunctions } from "./store/Stores";
import StoresSync from "./StoresSync";

const REACT_STATE_EXPIRY_PERIOD = 86400000 * 2; // React state expires after 2 days
const liveSourceResultsURL = "https://docs.google.com/spreadsheets/d/1Q5fuKvddf8cM6OK7mN6ZfnMzTmXGvU8z3npRlR56SoQ";
const liveSourceResultsSheetId = getSheetIdFromURL(liveSourceResultsURL);

const liveBackupResultsURL = "https://docs.google.com/spreadsheets/d/1rkP8dagZxVZKTLOOPHr1c02wQc0VmKw485w7rMv-02I";
const liveBackupResultsSheetId = getSheetIdFromURL(liveBackupResultsURL);

const readOnlyAuth = {
    privateKey: "<<PRIVATE_KEY>>",
    clientEmail: "<<CLIENT_EMAIL>>",
};

function getTokenExpiry(token) {
    return tokenParser(token).expiry;
}

async function initialiseServicesFromToken(token, refreshCache) {
    const parsedToken = tokenParser(token);
    let {
        raceDate: raceDateString,
        superUser,
        privateKey,
        clientEmail,
        resultsSheetId,
    } = parsedToken;

    console.log(`https://docs.google.com/spreadsheets/d/${resultsSheetId}`);

    return await StoreFunctions.create(refreshCache, { privateKey, clientEmail }, resultsSheetId, raceDateString, superUser, resultsSheetId === liveSourceResultsSheetId, true);
}

async function initialiseReadOnlyServices(refreshCache) {
    return await StoreFunctions.create(refreshCache, readOnlyAuth, liveSourceResultsSheetId);
}

async function initialiseServices(token) {
    console.log("Initialising services");
    const started = Date.now();

    const refreshCache = localStorage.getItem("forceRefreshCaches");
    localStorage.removeItem("forceRefreshCaches");

    const storeFunctions = token
        ? await initialiseServicesFromToken(token, refreshCache)
        : await initialiseReadOnlyServices(refreshCache);

    console.log(`Finished initialising services in ${Math.round(Date.now() - started)}ms`);
    return {
        ...storeFunctions,
    };
}

const STATE_DESERIALISER = ({ registered, results, oods, newHelms }, services) => {
    const deserialisedHelms = newHelms.map((newHelm) => services.deserialiseHelm(newHelm));

    return {
        registered: registered.map((registeredResult) => services.deserialiseRegistered(registeredResult, deserialisedHelms)),
        results: results.map((result) => services.deserialiseResult(result, deserialisedHelms)),
        oods: oods.map((ood) => services.deserialiseOOD(ood, deserialisedHelms)),
        newHelms: deserialisedHelms,
    };
};

const DEFAULT_STATE = {
    results: [],
    registered: [],
    oods: [],
    newHelms: [],
    expiry: Date.now() + REACT_STATE_EXPIRY_PERIOD,
};

const DEFAULT_SERVICE_STATE = {
    ready: false,
};

export default function TokenWrapper() {
    const servicesManager = useState(DEFAULT_SERVICE_STATE);
    const [token, updateToken] = useCachedState(undefined, undefined, "token");
    const [urlToken, updateUrlToken] = useState();
    const [readOnly, updateReadOnly] = useState(false);
    let [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (!urlToken) {
            const newUrlToken = searchParams.get("token");
            if (newUrlToken) {
                updateUrlToken(newUrlToken);
                setSearchParams();
            }
            else if (!token) {
                updateReadOnly(true);
            }
            else {
                updateUrlToken(token.body);
            }
        }
        else {
            if (token && token.body === urlToken) {
                console.log("Not updating token as it's unchanged.");
                return;
            }

            const tokenExpiry = getTokenExpiry(urlToken);
            console.log("Replacing token");
            updateToken({
                expiry: tokenExpiry,
                body: urlToken,
            });
        }
    }, [urlToken]);

    if (!readOnly && (!urlToken || !token || token.body !== urlToken)) {
        return (
            <>
                <p>Awaiting token...</p>
            </>
        );
    }

    return (
        <>
            <Box className="page-container" minHeight="100vh" >
                <ServicesContext.Provider value={servicesManager}>
                    <ServicesWrapper token={token && token.body} />
                </ServicesContext.Provider>
            </Box>
        </>
    )
}

function ServicesWrapper({ token }) {
    const services = useServices(async () => initialiseServices(token))

    if (services.error) {
        console.log(services.error);
        return (
            <>
                <Text>{`${services.error}`}</Text>
                <Text>{JSON.stringify(services.error.stack)}</Text>
            </>
        );
    }

    if (!services.ready) {
        return <Spinner />;
    }

    return (
        <StateWrapper />
    );
}

function StateWrapper() {
    const services = useServices();
    const cachedStateManager = useCachedState(DEFAULT_STATE, (value) => {
        try {
            return STATE_DESERIALISER(value, services)
        }
        catch (err) {
            console.log(err);
            return DEFAULT_STATE;
        }
    });
    return (
        <>
            <CachedContext.Provider value={cachedStateManager}>
                {!services.readOnly &&
                    <StoresSync />
                }
                <StateOutlet />
            </CachedContext.Provider>
        </>
    );
}

function StateOutlet() {
    const [state, updateAppState] = useAppState(DEFAULT_STATE);
    const services = useServices();

    useEffect(() => {
        services.updateStoresStatus();
    }, [state]);

    return (
        <>
            {!state &&
                <p>Loading state...</p>
            }
            {!services.ready &&
                <p>Initialising services...</p>
            }
            {state && services.ready &&
                <Outlet />
            }
        </>
    )
}

function StoreSync({ store }) {
    const [syncronizing, updateSyncronizing] = useState(false);
    const [failed, updateFailed] = useState(false);
    const services = useServices();

    const syncStore = (store) => {
        updateSyncronizing(true);
        services.syncroniseStore(store)
            .then(() => updateSyncronizing(false))
            .catch(() => updateFailed(true));
    }

    return <>
        {!failed &&
            <RedButton onClick={(() => syncStore(store))} isLoading={syncronizing} loadingText={`Syncronizing Store: ${store}`}>{`Synchronise store: ${store}`}</RedButton>
        }
        {failed &&
            <RedButton onClick={(() => syncStore(store))} disabled={true}>{`Synchronise store: ${store} failed`}</RedButton>
        }
    </>
}

var maxHeight = 0;

const updateHeight = () => {
    if (window.innerHeight > maxHeight) {
        maxHeight = window.innerHeight;
        document.documentElement.style.setProperty('--screen-height', `${window.innerHeight}px`);
    }
}

updateHeight();
window.addEventListener('resize', () => updateHeight());

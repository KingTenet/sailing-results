import { Outlet, useSearchParams } from "react-router-dom";
import { useAppState, useServices, ServicesContext, CachedContext, useCachedState } from "./useAppState";
import { tokenParser } from "./token.js";
import React, { useEffect, useState } from "react";
import { getSheetIdFromURL } from "./common";
import { Button, Box } from "@chakra-ui/react";
import { StoreFunctions } from "./store/Stores";
import { tokenGenerator } from "./token.js";

const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1k6VjCuH8rzsKthbxnFtTd_wGff3CFutEapufPCf9MJw/edit#gid=1747234560";
const seriesResultsURL = "https://docs.google.com/spreadsheets/d/1yngxguLyDsFHR-DLA72riRgYzF_nCrlaz01DVeEolMQ/edit#gid=1432028078";
const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);
const readOnlyAuth = {
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCxvupp/CrJ2geF\nSL5xLl6L5w0/oXrQFSjIDSGpQjA5HK5eEWl9b8sdLjVMUDKMXOa0jmUzywpj6DaM\nqL4nvKcj8JQ58nuqh2HOJsau7kWtmKqo6S1gUVZDWcshvX5lRbBQeVcxxAth1t+d\npgu4BOr609Pxc7QgBuD6vC8t5LK+uXCsvmCzuvgfTgt5A+IClGv06VfkD9iCj7oR\ntsNgHWFUC6Z/yl8CEuUPzfuT723bjUMOt1kIakXAERUF7otWNHRvEUzNwi+SVkdI\nrrPonFi+xQoFxDxZqpx+JDuDXT1RBO7GYHtq//eN9i1PlNbc2GtNPA0up4XhibNi\n1u/Gptu7AgMBAAECggEAGn2pQz2FhQr9NvSmCYlPJwu7EkI3Yx7cMqCeZTMLq99l\n73gp4DuSqpkx8Vs8hWXtLnjQhX0b4dMAmksl+BcqU/VtqgtFOh+uSILH9tdlRB+u\nQ7lo/WNx91zBJRiwZ1iRFBVZlP2ycpULQ9w0/+qfuN1sR56meGV+D3CPmYftyfXq\nQgpnGiBspNlaTIPNgUo7f1H8gwaVUz7b9xcJ6WgILqcqZgQJf8Pp1yC2i+nHgnR6\nqqv8RqY4Iom+UcOM0ZrrlYrcLgzemw7j22ziXru35KGIxlzZ9yVHafpR+UEIpUnv\nUPjHYQPGFPRBrYI7ZZ0W9idyu7fDupKAZsa1SzHbSQKBgQDy1BViyOzqZbWhr8ps\nAqChlbCEUG34+P1WbI6sZcrPvmm9ebOjrLFVo/aiP/JnCV2nAzwFXHzblQpQpkPe\n9rSeB4Js3M24Gq9ZMOkGdNwTCMICNAQNqhIPpZSYC2OPbYjSPtMWlBOAwBIRmgK2\nplLNdQxClGSXnYO+dvlYUS0d0wKBgQC7YxgC0U1v6UUx0cQbo/2SeqaHuflgiAHu\nR+qrBdsramC9QzKXiWVYP9xI6u7FUVPyFhRWp+rgyPDphnkb9+1BtOdF7JpXd7e7\ng3yBoIOsRa4uIIUIRrMZRN17TQSZG/bBY40fY9+ohHhA0+/M8yoKARAD+HU9so4k\nK2hG1AxReQKBgE8dGfqdS9LyYELVazXVhVAf3Oq+6ZV8Sc2mgLVaVMFqYDkDNavV\nz9D/IpOqEefP/Vs0ipGUmHlSDZJJGUPDTQVPnQaqybt5tjdw3/rih/ELoWnmWIu7\nJTdD0y3WSBGqtjEJlux8Qf5olXp2mvu3JLMbt2rZvgxHnWyohoRnrjNRAoGBALB/\nwOD+heLQJGWtf/rM9w2eSvbym8ppsO/ge0/FP0/gbeg2wBNtzbBWzkU8S9Q9K0WN\nuHB6z0gU3J4JFE/csXO/UktRdXrHf562VXK/XubH5yz5YnSOKym07KyzuY4BgeVb\nwFP9vW+7/oyJU4iGzWUI5S3oO332jd3RqPF1z3h5AoGBAN4X9GfqaPMX2abyi8G5\nJmLbe99mFvJ//6hChY1VcYlj3+wbQiD63R16FI6hZ/H0c8EI23SEWFT1ZD8JeD2p\npIbrLQ84SQa9jYQyWWo7T44LY/tRx3Aryt9440ajCDx2KpN8BEDbUxCwK32kIIpk\nSYymff5fx8tUYIqVxVoE9+W8\n-----END PRIVATE KEY-----\n",
    clientEmail: "test-622@abiding-bongo-302712.iam.gserviceaccount.com"
};

async function initialiseServicesFromToken(token, refreshCache) {
    let {
        raceDate: raceDateString,
        superUser,
        privateKey,
        clientEmail,
    } = tokenParser(token);

    return await StoreFunctions.create({ privateKey, clientEmail }, sourceResultsSheetId, seriesResultsSheetId, raceDateString, superUser, refreshCache);
}

async function initialiseReadOnlyServices() {
    return await StoreFunctions.create(readOnlyAuth, sourceResultsSheetId, seriesResultsSheetId);
}

async function initialiseServices(token, urlToken) {
    const refreshCache = Boolean(urlToken);

    const storeFunctions = token
        ? await initialiseServicesFromToken(token, refreshCache)
        : await initialiseReadOnlyServices();

    return {
        ...storeFunctions,
    };
}

const STATE_DESERIALISER = ({ registered, results, oods }, services) => {
    return {
        registered: registered.map((registeredResult) => services.deserialiseRegistered(registeredResult)),
        results: results.map((result) => services.deserialiseResult(result)),
        oods: oods.map((ood) => services.deserialiseOOD(ood)),
    };
};

const DEFAULT_STATE = {
    results: [],
    registered: [],
    oods: [],
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
                console.log("Updating token");
                updateToken(tokenGenerator({
                    //raceDate: "2019-11-03",
                    superUser: true,
                    ...readOnlyAuth,
                }));
                // updateReadOnly(true);
            }
        }
        else {
            if (token === urlToken) {
                console.log("Not updating token as it's unchanged.");
                return;
            }

            console.log("Updating token");
            updateToken(urlToken);
        }
    }, [urlToken]);

    if (!token && !readOnly) {
        return (
            <>
                <p>Awaiting token...</p>
            </>
        );
    }

    return (
        <>
            <ServicesContext.Provider value={servicesManager}>
                <ServicesWrapper token={token} urlToken={urlToken} />
            </ServicesContext.Provider>
        </>
    )
}

function ServicesWrapper({ token, urlToken }) {
    const services = useServices(async () => initialiseServices(token, urlToken))

    if (!services.ready) {
        return (
            <>
                <p>Initialising services...</p>
            </>
        );
    }

    // console.log(services);

    return (
        <StateWrapper />
    );
}

function StateWrapper() {
    const services = useServices();
    const cachedStateManager = useCachedState(DEFAULT_STATE, (value) => STATE_DESERIALISER(value, services));
    return (
        <>
            <CachedContext.Provider value={cachedStateManager}>
                <StateOutlet />
            </CachedContext.Provider>
        </>
    );
}

function StateOutlet() {
    const [state, updateAppState] = useAppState(DEFAULT_STATE);
    const services = useServices();

    console.log(state);
    return (
        <>
            {/* <Box>
                <Debug />
            </Box> */}
            {!state &&
                <p>Loading state...</p>
            }
            {state && state.readOnlyMode &&
                <p>Read only mode...</p>
            }
            {!services.ready &&
                <p>Initialising services...</p>
            }
            {state && services.ready &&
                <Outlet />
            }
            {/* This is a bit gross as it relies on the Outlet implementations to not render until they have state but they're currently forcing a redirect*/}
            {/* <Outlet /> */}
        </>
    )
}

function Debug() {
    const [state, updateAppState] = useAppState();

    return (
        <>
            <Button onClick={() => console.log(state)}>Log state</Button>
            <Button onClick={() => updateAppState((prevState) => ({
                ...prevState,
                count:
                    state.count
                        ? state.count + 1
                        : 1
            }))}
            >Update state</Button>
        </>
    )
}
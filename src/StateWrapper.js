import { Outlet, useParams, useSearchParams } from "react-router-dom";
import { useAppState, useServices, ServicesContext, CachedContext, useCachedState } from "./useAppState";
import { tokenParser } from "./token.js";
import React, { useEffect, useState } from "react";
import { getSheetIdFromURL } from "./common";
import { Button, Box, Text, Spinner, Flex } from "@chakra-ui/react";
import { GreenButton, RedButton } from "./components/Buttons";
import { StoreFunctions } from "./store/Stores";
import { tokenGenerator } from "./token.js";
import { CheckIcon, SmallCloseIcon } from '@chakra-ui/icons'

const sourceResultsURL = "https://docs.google.com/spreadsheets/d/1Q5fuKvddf8cM6OK7mN6ZfnMzTmXGvU8z3npRlR56SoQ";
const seriesResultsURL = "https://docs.google.com/spreadsheets/d/1Q5fuKvddf8cM6OK7mN6ZfnMzTmXGvU8z3npRlR56SoQ";
const sourceResultsSheetId = getSheetIdFromURL(sourceResultsURL);
const seriesResultsSheetId = getSheetIdFromURL(seriesResultsURL);
const readOnlyAuth = {
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDdBV/YE3Csc2aR\nL3a7uJQmxsID0YBCEGeXo6ZEK6jGbNTl+PtGDgtPYEV9yLqmIhnZwi8J9l7rUYFb\nmxJ7jcwWob7C9OZfvML7uxVUaZ7hMRr2z2H4hOi3/KGRD85dRAbbcjokCpTdnpp4\nc3WoaI3kjct8SRyuYoAKQU/Wdp9Gkq3QRNfb+HmoCrVQ6NlrO1du1oRxouT05Kq/\nfos73+M0ayY0fhb/srIFZ6I7DZ+rVZIfjBEsqcvJlSBRu08dNY5lkn3kgEvNSs61\nBJWuiQz4EBi6kt3j0cjE4rex4HPvOfc7t7ZIGaBAx3JdDy657bWXat/AnRYiEmeV\nx59ALPS7AgMBAAECggEAAhwyucIYJ/7wD0AxqE6PISTYcsEVmH8S/7hUKYyn9cEE\n2IjW6U8DN6F9K47DjW6zUK6eB8Cegy09IjrdFpxLdjnagH6Zeaq4ZKV46VxN/bg1\nmctwE+qjVPWOzoik/6OOVAEHe6zOlnEU6EQXiJSUkKAnJBghZt7RrYdjGj9gSB2w\n1/SiNm+Z7mOvufLXI59NQkZUYPJ/pR1EaP7krC7yQ3OYUQNeyR9jyKH1exrqY8xT\nhZyUZ08eSkntbSdBsYQQ39owMiyxFsPyUP7Dkq8HZPNZBwJpPnuExpKTRpQeqmaT\nqlmH0u/2TdJ5cGVMhaa2ZY1ASlXftuOyY6JgKiRKOQKBgQD1tDc3xatFBONwTPGT\ndYJ8SW9z9IpH0J7cWR96mQOcuE9CpnCCbsvEy3kT/5RObYh0nP2Q7ezOyN5Xc4ej\noYoHxCXW8Fr+QQEGD6nZfCQSef3uPzJDeGa0w1LP6nZ3U6ebpGDhMKrAK34THYDa\nFg22bYL94c98r1u1hC0OJ79fMwKBgQDmSF9ihhLLKhTFGnt41NnsIpWP3SwCpPvS\nyvpY5nFjaXgU5ODck/CUbvBuntChWIL4d5dKkf1Yur5Y+b549x/uQjt+liu9ywk6\niK5/3q7rXNTYOJb0zTfpYItDKMAswVvqNQYpD4BeoxqffuqgMCfSinwOY/PVcXtM\nBB3R5Xe0WQKBgQDkGhyxMFeiSbmERkp3pT4weFR6B+pgZXM2CZ9Jx8gstIcQz0fg\nL1AJMQUE5d8fOFzYNe7Jn7ia+KxB78VaydtE/npKovU22c5DfEMo3zD13j858X2O\nWbav1i2JTJgSi50sx1wRc4bxxO7UfC1lSdgNJnnXjM19aabwSvcxDwGBNQKBgQDc\na2Wxnneas5rR1zlcPRCib7AM1jzsAxNvfw4Fzf22lBt2lGWPfKOI0G+e0rEL3vbt\n8TqFDBwdtBHChLqGerS7j/X2grM3pYId3vp4NqPjcSXiGLiVdWERJ3HlRLo9nI7o\nLPzKjKXo7+HpzMezsKRNaHS6KX4ZTdgguMf6QtRDcQKBgAV/S0wydKkTwagpJdzs\nBcM5Aq0HvAaoxxeUuz4b3a8doHKckq3XQL+73T4KQ8NtZkS0tUfOmFTra5aayVfS\ni2eL70fmKmjjIrSrOg/Nqu5D0Jd8a9UaI18UqiKJZ/KXMUw9MDAj81eI4TdVS0ax\n0+x82ccIPGQ5cqIeTH139BwK\n-----END PRIVATE KEY-----\n",
    clientEmail: "read-only@nhebsc-results.iam.gserviceaccount.com",
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

async function initialiseServices(token) {
    console.log("Initialising services");
    const started = Date.now();

    // TODO - this is causing issues at present - possibly beacuse it's nuking the token??
    // const refreshCache = Boolean(urlToken);
    const refreshCache = false;

    const storeFunctions = token
        ? await initialiseServicesFromToken(token, refreshCache)
        : await initialiseReadOnlyServices();

    console.log(`Finished initialising services in ${Math.round(Date.now() - started)}ms`);
    return {
        ...storeFunctions,
    };
}

const STATE_DESERIALISER = ({ registered, results, oods, newHelms, isPursuitRace }, services) => {
    const deserialisedHelms = newHelms.map((newHelm) => services.deserialiseHelm(newHelm));

    return {
        registered: registered.map((registeredResult) => services.deserialiseRegistered(registeredResult, deserialisedHelms)),
        results: results.map((result) => services.deserialiseResult(result, deserialisedHelms)),
        oods: oods.map((ood) => services.deserialiseOOD(ood, deserialisedHelms)),
        newHelms: deserialisedHelms,
        isPursuitRace,
    };
};

const DEFAULT_STATE = {
    results: [],
    registered: [],
    oods: [],
    newHelms: [],
    isPursuitRace: false,
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
                updateUrlToken(token);
            }
        }
        else {
            if (token === urlToken) {
                console.log("Not updating token as it's unchanged.");
                return;
            }

            console.log("Replacing token");
            updateToken(urlToken);
        }
    }, [urlToken]);

    if (!readOnly && (!urlToken || token !== urlToken)) {
        return (
            <>
                <p>Awaiting token...</p>
            </>
        );
    }

    return (
        <>
            <Box bg="blue.50" minHeight="100vh" >
                <ServicesContext.Provider value={servicesManager}>
                    <ServicesWrapper token={token} />
                </ServicesContext.Provider>
            </Box>
        </>
    )
}

function ServicesWrapper({ token }) {
    const services = useServices(async () => initialiseServices(token))

    if (services.error) {
        return (
            <>
                <Text>{`${services.error}`}</Text>
                <Text>{JSON.stringify(services.error.stack)}</Text>
            </>
        );
    }

    if (!services.ready) {
        return (
            <>
                <Flex width="100vw" height="100vh" align={"center"} justify={"center"} direction="column">
                    <Spinner color='blue.500' size="xl" />
                    <Text marginLeft={"10px"} marginTop={"20px"}>Loading...</Text>
                </Flex>
            </>
        );
    }

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
            <Debug />
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

function StoresSync({ verbose }) {
    const services = useServices();
    const [storesStatus, updateStoresStatus] = useState();
    const TIMEOUT = 5000;
    const VERBOSE = verbose;
    const [syncing, updateSyncing] = useState(false);
    const [failed, updateFailed] = useState(false);

    const handleUpdateStoreStatus = () => {
        const newStoreStatus = services.getStoresStatus();
        if (JSON.stringify(storesStatus) !== JSON.stringify(newStoreStatus)) {
            updateStoresStatus(newStoreStatus);
        }
    }

    useEffect(() => {
        const timerId = setInterval(() => handleUpdateStoreStatus(), TIMEOUT);
        return function cleanup() {
            clearInterval(timerId);
        };
    }, []);

    useEffect(() => {
        if (!syncing && storesStatus) {
            if (Object.entries(storesStatus).some(([store, synced]) => !synced)) {
                console.log("Stores are not synced");
                updateSyncing(true);

                const promiseSyncStores = Object.entries(storesStatus)
                    .filter(([, synced]) => !synced)
                    .map(([store]) => services.syncroniseStore(store));

                Promise.all(promiseSyncStores)
                    .then(() => {
                        updateSyncing(false);
                        updateFailed(false);
                    })
                    .catch(() => {
                        updateSyncing(false);
                        updateFailed(true);
                    });
            }
        }
    }, [storesStatus]);

    if (!storesStatus) {
        return <></>;
    }

    if (VERBOSE) {
        return <>
            {Object.entries(storesStatus).map(([store, synced], index) => (
                <Box key={`StoreSync${index}`}>
                    {synced &&
                        <Box>
                            <GreenButton disabled={true}>{`Store: ${store} is in sync`}</GreenButton>
                        </Box>
                    }
                    {!synced &&
                        <Box>
                            <StoreSync store={store} />
                        </Box>
                    }
                </Box>
            ))}
        </>;
    }

    return <Box position="absolute" height="10px" width="100%" bgColor={syncing ? "blue.500" :
        failed ? "red.500" :
            "green.100"
    } />

    // if (syncing) {
    //     return <Box height="10px" width="10px">
    //         <Spinner color='blue.500' size="xs" />
    //     </Box>;
    // }

    // if (failed) {
    //     return <Box height="10px" width="10px">
    //         <SmallCloseIcon color="red.500" />
    //     </Box>;
    // }

    // return <Box>
    //     <Box height="10px" width="10px">
    //         <CheckIcon color="green.500" />
    //     </Box>
    // </Box>;
}

function Debug() {
    const [state, updateAppState] = useAppState();
    let [searchParams, setSearchParams] = useSearchParams();
    const [debug, updateDebug] = useState();
    const [showState, updateShowState] = useState(false);

    useEffect(() => {
        if (!debug) {
            const debug = searchParams.get("debug");
            if (debug) {
                updateDebug(true);
                setSearchParams();
            }
        }
    }, []);

    if (!debug) {
        return <></>;
    }

    return (
        <>
            <Button onClick={() => console.log(state)}>Log state</Button>
            <Button onClick={() => localStorage.clear()}>Clear cache</Button>
            <Button onClick={() => updateShowState(!showState)}>Show state</Button>
            <Button onClick={() => updateAppState((prevState) => ({
                ...prevState,
                count:
                    state.count
                        ? state.count + 1
                        : 1
            }))}
            >Update state</Button>
            <StoresSync verbose={true} />
            <Box>
                <Text>{`${JSON.stringify(state, null, 4)}`}</Text>
            </Box>
        </>
    )
}
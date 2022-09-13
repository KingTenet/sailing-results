import { Outlet, useSearchParams } from "react-router-dom";
import { useAppState, useServices, ServicesContext, CachedContext, useCachedState } from "./useAppState";
import { tokenParser } from "./token.js";
import React, { useEffect, useState } from "react";
import { getSheetIdFromURL } from "./common";
import { Button, Box, Text, Flex, Spacer } from "@chakra-ui/react";
import { GreenButton, RedButton } from "./components/Buttons";
import Spinner from "./components/Spinner";
import { StoreFunctions } from "./store/Stores";
import getVersion from "./version";
import { useStoreStatus, useAdminToggle } from "./common/hooks";


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


export default function StoresSync({ verbose }) {
    const services = useServices();
    const storesStatus = useStoreStatus();
    const [isAdmin, adminHandler] = useAdminToggle();
    const VERBOSE = verbose;
    const [syncing, updateSyncing] = useState(false);
    const [failed, updateFailed] = useState(false);

    useEffect(() => {
        if (!syncing && storesStatus) {
            if (Object.entries(storesStatus).some(([store, synced]) => !synced)) {
                console.log("Stores are not synced");
                updateSyncing(true);
            }
        }
    }, [storesStatus]);

    useEffect(() => {
        if (syncing) {
            const storesToSync = Object.entries(storesStatus)
                .filter(([, synced]) => !synced);

            console.log(`Attempting to sync all stores`);

            services.syncroniseStores()
                .then(() => {
                    console.log("All stores have synced successfully");
                    updateSyncing(false);
                    updateFailed(false);
                })
                .catch((err) => {
                    console.log("Stores failed to sync successfully");
                    console.log(err);
                    updateSyncing(false);
                    updateFailed(true);
                });
        }
    }, [syncing]);

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

    return <>
        <Flex className="status-bar" bgColor={syncing ? "blue.500" :
            failed ? "red.500" :
                "green.100"
        } />
        {!Boolean(services.readOnly) &&
            <Box className="status-bar-version" onClick={() => { console.log("Received click") || adminHandler() }}>
                <Text>{`${services.isLive ? "LIVE" : "PRACTICE"}: ${getVersion()} ${isAdmin ? ": ADMIN MODE" : ""}`}</Text>
            </Box>
        }
        {/* {
            <Viewport />
        } */}
    </>
}
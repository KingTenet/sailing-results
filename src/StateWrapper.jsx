import { Outlet, useSearchParams } from "react-router-dom";
import {
  useAppState,
  useServices,
  ServicesContext,
  CachedContext,
  useCachedState,
} from "./useAppState.js";
import { tokenParser } from "./token.js";
import React, { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { RedButton } from "./components/Buttons";
import Spinner from "./components/Spinner";
import { StoreFunctions } from "./store/Stores";
import StoresSync from "./StoresSync";
import readOnlyAuth from "./auth";
import { SHEET_ID } from "./sheetIds.js";

const REACT_STATE_EXPIRY_PERIOD = 86400000 * 2; // React state expires after 2 days

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

  console.log("Read/Write");
  console.log(`https://docs.google.com/spreadsheets/d/${resultsSheetId}`);
  return await StoreFunctions.create(
    refreshCache,
    { privateKey, clientEmail },
    resultsSheetId,
    raceDateString,
    superUser,
    resultsSheetId === SHEET_ID,
    true
  );
}

async function initialiseReadOnlyServices(refreshCache) {
  console.log(`https://docs.google.com/spreadsheets/d/${SHEET_ID}`);
  return await StoreFunctions.create(refreshCache, readOnlyAuth, SHEET_ID);
}

async function initialiseDemoServices(refreshCache) {
  console.log(`https://docs.google.com/spreadsheets/d/${SHEET_ID}`);
  return await StoreFunctions.create(
    refreshCache,
    readOnlyAuth,
    SHEET_ID,
    "",
    true,
    true,
    true
  );
}

async function initialiseServices() {
  console.log("Initialising services");
  console.log(`Running with
        import.meta.env.MODE: ${import.meta.env.MODE}
        process.env.NODE_ENV: ${process.env.NODE_ENV}
    `);
  const started = Date.now();

  //   const refreshCache = localStorage.getItem("forceRefreshCaches");
  //   localStorage.removeItem("forceRefreshCaches");

  const storeFunctions = await initialiseDemoServices(false);

  console.log(
    `Finished initialising services in ${Math.round(Date.now() - started)}ms`
  );
  return {
    ...storeFunctions,
  };
}

const STATE_DESERIALISER = (
  { registered, results, oods, newHelms },
  services
) => {
  const deserialisedHelms = newHelms.map((newHelm) =>
    services.deserialiseHelm(newHelm)
  );

  return {
    registered: registered.map((registeredResult) =>
      services.deserialiseRegistered(registeredResult, deserialisedHelms)
    ),
    results: results.map((result) =>
      services.deserialiseResult(result, deserialisedHelms)
    ),
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

  return (
    <>
      <Box className="page-container">
        <ServicesContext.Provider value={servicesManager}>
          <ServicesWrapper token={undefined} />
        </ServicesContext.Provider>
      </Box>
    </>
  );
}

function ServicesWrapper({ token }) {
  const services = useServices(async () => initialiseServices(token));

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

  return <StateWrapper />;
}

function StateWrapper() {
  const services = useServices();
  const cachedStateManager = useCachedState(DEFAULT_STATE, (value) => {
    try {
      return STATE_DESERIALISER(value, services);
    } catch (err) {
      console.log(err);
      return DEFAULT_STATE;
    }
  });
  return (
    <>
      <CachedContext.Provider value={cachedStateManager}>
        {!services.readOnly && <StoresSync />}
        <StateOutlet />
      </CachedContext.Provider>
    </>
  );
}

function StateOutlet() {
  const [state] = useAppState(DEFAULT_STATE);
  const services = useServices();

  useEffect(() => {
    services.updateStoresStatus();
  }, [state]);

  if (!state || !services.ready) {
    return <Spinner />;
  }

  return <Outlet />;
}

function StoreSync({ store }) {
  const [syncronizing, updateSyncronizing] = useState(false);
  const [failed, updateFailed] = useState(false);
  const services = useServices();

  const syncStore = (store) => {
    updateSyncronizing(true);
    services
      .syncroniseStore(store)
      .then(() => updateSyncronizing(false))
      .catch(() => updateFailed(true));
  };

  return (
    <>
      {!failed && (
        <RedButton
          onClick={() => syncStore(store)}
          isLoading={syncronizing}
          loadingText={`Syncronizing Store: ${store}`}
        >{`Synchronise store: ${store}`}</RedButton>
      )}
      {failed && (
        <RedButton
          onClick={() => syncStore(store)}
          disabled={true}
        >{`Synchronise store: ${store} failed`}</RedButton>
      )}
    </>
  );
}

var maxHeight = 0;
var currentWidth = 0;

const updateHeight = () => {
  if (window.innerHeight > maxHeight) {
    maxHeight = window.innerHeight;
    // document.documentElement.style.setProperty('--screen-height', `${maxHeight}px`);
  }
  if (window.innerWidth !== currentWidth) {
    currentWidth = window.innerWidth;
    // document.documentElement.style.setProperty('--screen-width', `${currentWidth}px`);
  }
};

updateHeight();
window.addEventListener("resize", () => updateHeight());

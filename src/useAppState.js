import React, { useEffect, useContext, useState } from "react";

export const LOCAL_STATE_STORAGE_KEY = "state";
export const ServicesContext = React.createContext("AppContext");
export const CachedContext = React.createContext("CachedContext");

export function useAppState(defaultValue) {
  const [cachedState, updateCachedStateT] = useContext(CachedContext);
  const updateCachedState = (fn) => {
    if (typeof fn === "function") {
      return updateCachedStateT((...prev) => {
        const newState = fn(...prev);
        console.log("Updating from state");
        console.log(JSON.stringify(prev, null, 4));
        console.log("Updating to state");
        console.log(JSON.stringify(newState, null, 4));
        return newState;
      });
    }

    return updateCachedStateT((...prev) => {
      console.log("Updating from state");
      console.log(JSON.stringify(prev, null, 4));
      console.log("Updating to state");
      console.log(fn);
      return fn;
    });
  };
  useEffect(() => {
    if (cachedState) {
      return;
    }

    if (defaultValue) {
      updateCachedState(defaultValue);
    }
  }, [cachedState]);

  if (!cachedState) {
    debugger;
  }

  return [cachedState, updateCachedState];
}

export function useServices(initialiseServices) {
  const [appServices, updateAppServices] = useContext(ServicesContext);
  // const [cachedState] = useAppState();

  useEffect(() => {
    if (!appServices.error && !appServices?.ready && initialiseServices) {
      initialiseServices()
        .then((services) =>
          updateAppServices({
            ...services,
            ready: true,
          })
        )
        .catch((err) =>
          updateAppServices({
            error: err,
            ready: false,
          })
        );
    }
  });

  return appServices;
}

export function useCachedState(
  defaultValue,
  deserialiser,
  key = LOCAL_STATE_STORAGE_KEY
) {
  const [value, setValue] = useState(() => {
    const serialisedValue = localStorage.getItem(key);
    if (serialisedValue === null) {
      return defaultValue;
    }

    const storedValue = JSON.parse(serialisedValue);
    if (Date.now() > storedValue.expiry) {
      localStorage.removeItem(key);
      return defaultValue;
    }
    return deserialiser ? deserialiser(storedValue) : storedValue;
  });

  useEffect(() => {
    if (value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}

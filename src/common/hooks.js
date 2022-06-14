import { useServices } from "../useAppState";
import { useState, useEffect } from "react";

export function useSortedResults(results, race) {
    const services = useServices();
    const [raceFinish] = useState(
        () => services.getRaceFinishForResults(race, results),
        [],
    );

    return [
        raceFinish,
        raceFinish && raceFinish.hasResults() && raceFinish.getCorrectedResults().sort((a, b) => b.sortByFinishTimeDesc(a)),
        raceFinish && raceFinish.hasResults() && raceFinish.getClassCorrectedPointsByResult(),
        raceFinish && raceFinish.hasResults() && raceFinish.getPersonalCorrectedPointsByResult(),
        raceFinish && raceFinish.hasResults() && raceFinish.getMaxLaps(),
        raceFinish && raceFinish.hasResults() && raceFinish.getSCT(),
        raceFinish && raceFinish.hasResults() && raceFinish.isPursuitRace(),
    ];
}

export function useDimensionsToggle(dimensions) {
    const [dimensionCounter, updateDimensionCounter] = useState(0);
    return [dimensions[dimensionCounter % dimensions.length], () => updateDimensionCounter(dimensionCounter + 1)];
}

export function useStoreStatus() {
    const services = useServices();
    const [storesStatus, updateStoresStatus] = useState(() => services.getStoresStatus());
    const TIMEOUT = 5000;

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

    return storesStatus;
}
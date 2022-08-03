import { useServices } from "../useAppState";
import { useState, useEffect, useRef } from "react";
import { useLongPress, LongPressDetectEvents } from "use-long-press";

const MIN_LONG_PRESS_DURATION_MS = 1200;
const MAX_SHORT_PRESS_DURATION_MS = 400;

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

export function useLongPressHandler(onClick, onLongPress, maxShortPressDuration = MAX_SHORT_PRESS_DURATION_MS, longPressDuration = MIN_LONG_PRESS_DURATION_MS) {
    const [shortClickExceeded, updateShortClickExceeded] = useState(false);
    const shortClickTimer = useRef();
    const shortClickTimerStarted = useRef();
    const clearShortClick = () => {
        updateShortClickExceeded(false);
        if (shortClickTimer?.current) {
            clearTimeout(shortClickTimer.current);
            shortClickTimer.current = undefined;
            shortClickTimerStarted.current = undefined;
        }
    };
    const shortClickTimeout = (fn, delay) => {
        clearShortClick();
        shortClickTimerStarted.current = Date.now();
        shortClickTimer.current = setTimeout(fn, delay);
    };

    const finish = () => {
        clearShortClick();
    }

    const bind = useLongPress(
        () => {
            updateShortClickExceeded(false);
            onLongPress();
        },
        {
            onStart: () => shortClickTimeout(() => updateShortClickExceeded(true), Math.round(maxShortPressDuration)),
            onFinish: () => finish(),
            onCancel: (event) => {
                if (["mouseup", "touchend"].includes(event.type) && shortClickTimerStarted?.current && (Date.now() - shortClickTimerStarted.current < maxShortPressDuration)) {
                    onClick(event);
                    event.preventDefault();
                }
                finish();
            },
            threshold: longPressDuration,
            captureEvent: true,
            cancelOnMovement: true,
            detect: LongPressDetectEvents.BOTH
        });

    return {
        ...bind(),
        shortClickExceeded,
    };
}
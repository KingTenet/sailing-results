import { useServices } from "../useAppState";
import { useState } from "react";

export function useSortedResults(results, race) {
    const services = useServices();
    const [raceFinish] = useState(
        () => services.getRaceFinishForResults(race, results),
        [],
    );

    return [
        raceFinish,
        raceFinish && raceFinish.getCorrectedResults().sort((a, b) => b.sortByFinishTimeDesc(a)),
        raceFinish && raceFinish.getClassCorrectedPointsByResult(),
        raceFinish && raceFinish.getPersonalCorrectedPointsByResult(),
        raceFinish && raceFinish.getMaxLaps(),
        raceFinish && raceFinish.getSCT(),
        raceFinish && raceFinish.isPursuitRace(),
    ];
}

export function useDimensionsToggle(dimensions) {
    const [dimensionCounter, updateDimensionCounter] = useState(0);
    return [dimensions[dimensionCounter % dimensions.length], () => updateDimensionCounter(dimensionCounter + 1)];
}
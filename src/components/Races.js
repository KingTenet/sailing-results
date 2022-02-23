import { Box, Flex, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import React, { useState } from "react";

import { useAppState } from "../useAppState";
import { getURLDate } from "../common"
import RaceStore from "../store/types/Race";

export default function Races() {
    console.log("Rendering Races");
    const [appState] = useAppState();
    const [raceState, updateRaceState] = useState();

    if (!appState) {
        return (
            <>
            </>
        )
    }
    const existingRaces = appState.services.stores.seriesRaces
        .map((seriesRace) => seriesRace.getRace());

    const editableRaceDate = appState.editableRaceDate;

    const editableRaces = existingRaces.filter((race) => race.getDate().getTime() === editableRaceDate.getTime());

    const resultsByRace = new Map(
        RaceStore.groupResultsByRaceAsc(appState.services.stores.results.all())
            .map(([race, results]) => [RaceStore.getId(race), results])
    );
    const raceIsImmutable = (race) => (resultsByRace.get(RaceStore.getId(race)) || []).some((result) => !result.hasStaleRemote());

    return (
        <>
            <Flex direction="row" width="100vh" justify={"space-between"}>
                <Text>{`All Races`}</Text>
            </Flex>
            <Box>
                {editableRaces && editableRaces.map((race) => (
                    <Box key={`${getURLDate(race.getDate())}/${race.getNumber()}`}>
                        <Link to={`${getURLDate(race.getDate())}/${race.getNumber()}`}>{`${raceIsImmutable(race) ? "View" : "Update"} Race ${getURLDate(race.getDate())}, ${race.getNumber()}`}</Link>
                    </Box>
                ))}
            </Box>
        </>
    )
}
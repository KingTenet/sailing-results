import { Box, Flex, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import React from "react";

import { useAppState } from "../useAppState";
import { getURLDate } from "../common"

export default function Races() {
    console.log("Rendering Races");
    const [appState] = useAppState();

    const raceDate = appState?.store?.raceDate;
    const races = appState?.store?.activeRaces;

    if (!races || !raceDate) {
        return (
            <>
            </>
        )
    }

    return (
        <>
            <Flex direction="row" width="100vh" justify={"space-between"}>
                <Text>{`Races for ${getURLDate(raceDate)}`}</Text>
            </Flex>
            <Box>
                {races && races.map((race) => (
                    <Link to={`${getURLDate(raceDate)}/${race.raceNumber}`}>{`Update Race ${race.raceNumber}`}</Link>
                ))}
            </Box>
        </>
    )
}
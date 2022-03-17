import { Box, Flex, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import React, { useState } from "react";

import { useServices } from "../useAppState";
import { getURLDate } from "../common"
import Race from "../store/types/Race";

export default function Races() {
    const services = useServices();
    const [races] = useState(() => services.mapRaces(Race.toReactRace));

    return (
        <>
            <Flex direction="row" width="100vh" justify={"space-between"}>
                <Text>{`All Races`}</Text>
            </Flex>
            <Box>
                {races.map((race) => (
                    <Box key={`${getURLDate(race.getDate())}/${race.getNumber()}`}>
                        <Link to={`${getURLDate(race.getDate())}/${race.getNumber()}`}>{`Race ${getURLDate(race.getDate())}, ${race.getNumber()}`}</Link>
                    </Box>
                ))}
            </Box>
        </>
    )
}

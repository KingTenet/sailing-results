import { Box, Flex, Heading, Spacer } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import React, { useState } from "react";

import { useServices } from "../useAppState";
import { getURLDate } from "../common"
import { BackButton } from "./Buttons";

export default function Races() {
    const services = useServices();
    const [[mutableRaces, immutableRaces]] = useState(() => services.getRaces());
    const editableRaces = mutableRaces.filter((race) => services.isRaceEditableByUser(race));
    console.log(editableRaces);

    return (
        <>
            <Flex direction="column" margin="5px">
                <Box marginTop="20px" />
                <Flex direction="row" marginBottom="20px">
                    <Heading size={"lg"} marginLeft="20px">{`All Races`}</Heading>
                    <Spacer width="50px" />
                    <Heading size={"lg"} marginRight="20px">{`Somin`}</Heading>
                </Flex>
                <Box>
                    {editableRaces.map((race) => (
                        <Box key={`${getURLDate(race.getDate())}/${race.getNumber()}`}>
                            <Link to={`${getURLDate(race.getDate())}/${race.getNumber()}`}>{`Race ${getURLDate(race.getDate())}, ${race.getNumber()}`}</Link>
                        </Box>
                    ))}
                </Box>
                <BackButton>Back</BackButton>
            </Flex>
        </>
    );
}

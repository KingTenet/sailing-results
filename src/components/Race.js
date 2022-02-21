import { Flex, Text } from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import React from "react";

import { useAppState } from "../useAppState";
import { getURLDate } from "../common"

export default function Race() {
    const [appState] = useAppState();
    const params = useParams();

    const raceDate = appState?.store?.raceDate;
    const races = appState?.store?.activeRaces;
    const raceNumber = params["raceNumber"]

    if (!races || !raceDate || !raceNumber) {
        return (
            <>
            </>
        )
    }

    return (
        <>
            <Flex direction="row" width="100vh" justify={"space-between"}>
                <Text>Home</Text>
                <Text>Race</Text>
            </Flex>
            <Text>{`Update ${getURLDate(raceDate)}, race ${raceNumber}`}</Text>
            <Flex direction="column">
                <Link to="register">Register helm</Link>
                <Link to="finish">Finish helm</Link>
            </Flex>
        </>
    )
}
import { List, ListItem, Text, Grid, GridItem, Icon } from "@chakra-ui/react";
import { Box, Flex, Heading, Spacer } from "@chakra-ui/react";
import React, { useState } from "react";

import { useServices, useAppState } from "../useAppState";
import { getURLDate, mapGroupBy, groupBy } from "../common"
import Race from "../store/types/Race";
import { useNavigate } from "react-router-dom";
import HelmResult from "../store/types/HelmResult";
import { useAllHelms, useSortedResults, useStoreStatus } from "../common/hooks";
import { RacesCard } from "./Cards";
import { DroppableHeader } from "./CardHeaders";
import {
    Alert,
    AlertIcon,
    AlertTitle,
} from '@chakra-ui/react'
import { EditIcon } from "@chakra-ui/icons";


function RaceDimension({ children, isTruncated = false, ...props }) {
    return (
        <GridItem
            height='20px'
            minWidth={isTruncated ? "0px" : "auto"}
            {...props}>
            <Text isTruncated={isTruncated}>{children}</Text>
        </GridItem>
    );
}

function RaceListItem() {
    const allHelms = useAllHelms();

    console.log([...allHelms][0]);

    function getRaceStats(result) {
        const positionOutOfFinishers = result;
        const PHForClassFromRace = result;
        const rollingPHForClass = result;
        const PIFromRace = result;
        const rollingPI = result;
        const race = result;
        const series = result;

        return 
    }


    return <>
        <div> </div>
    </>
}

function RacesView({ races, ...props }) {
    const navigateTo = useNavigate();
    const [appState] = useAppState();
    const resultsByRace = mapGroupBy(appState.results, [HelmResult.getRaceId]);
    const registeredByRace = mapGroupBy(appState.registered, [HelmResult.getRaceId]);

    return (
        <RacesList {...props}>
            {races.map((race) =>
                <ListItem key={Race.getId(race)}>
                    <RaceListItem
                        raceDate={race.getDate()}
                        raceNumber={race.getNumber()}
                        raceResults={resultsByRace.get(Race.getId(race))}
                        raceRegistered={registeredByRace.get(Race.getId(race))}
                        onClick={() => navigateTo(`${getURLDate(race.getDate())}/${race.getNumber()}`)}
                    />
                </ListItem>
            )}
        </RacesList >
    );
}

function RacesList({ children, ...props }) {
    return (
        <Box {...props}>
            <List spacing="5px">
                {children}
            </List>
        </Box>
    )
}

export default function Races({ editableOnly = false }) {
    const services = useServices();
    const [[, immutableRaces]] = useState(() => services.getRaces(services.isLive));

    return (
        <>
            <Flex direction="column" padding="5px">
                <Flex direction="row" marginTop="20px">
                    <Heading size={"lg"} marginLeft="10px">{`Races`}</Heading>
                </Flex>
                <Box marginTop="20px" />
                <RacesCard>
                    <DroppableHeader heading="Race results" />
                    <Box marginBottom="20px" padding="10px" paddingTop="20px">
                        <RacesView races={immutableRaces} />
                    </Box>
                </RacesCard>
            </Flex>
        </>
    );
}

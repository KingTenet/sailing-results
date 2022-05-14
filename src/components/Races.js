import { Button, List, ListItem, Text, Grid, GridItem } from "@chakra-ui/react";
import { Box, Flex, Heading, Spacer } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import React, { useState } from "react";

import { useServices, useAppState } from "../useAppState";
import { getURLDate, parseURLDate, mapGroupBy } from "../common"
import { BackButton } from "./Buttons";
import Race from "../store/types/Race";
import { useNavigate } from "react-router-dom";
import HelmResult from "../store/types/HelmResult";
import { useSortedResults } from "../common/hooks";

function RaceDimension({ children, ...props }) {
    return (
        <GridItem
            height='20px'
            {...props}>
            <Text isTruncated>{children}</Text>
        </GridItem>
    );
}

function RaceListItem({ raceDate, raceNumber, raceResults = [], raceRegistered = [], onClick }) {
    const formatRaceNumber = (raceNumber) => ["1st", "2nd", "3rd"][raceNumber - 1];
    return <>
        <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"} onClick={onClick}>
            <Flex>
                <Grid
                    templateColumns='repeat(4, 1fr)'
                    gap={5}
                    width={"100%"}>
                    <RaceDimension colSpan={1}>{`${getURLDate(raceDate).replace(/-/g, "/")}`}</RaceDimension>
                    <RaceDimension colSpan={1}>{`${formatRaceNumber(raceNumber)} race`}</RaceDimension>
                    <RaceDimension colSpan={1}>{`${raceResults.length} result${raceResults.length - 1 ? "s" : ""}`}</RaceDimension>
                    <RaceDimension colSpan={1}>{`${raceRegistered.length} registered`}</RaceDimension>
                </Grid>
            </Flex>
        </Box>
    </>
}

function ImmutableRaceListItem({ raceDate, raceNumber, raceResults = [], wonBy = [], onClick }) {
    const formatRaceNumber = (raceNumber) => ["1st", "2nd", "3rd"][raceNumber - 1];
    return <>
        <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"} onClick={onClick}>
            <Flex>
                <Grid
                    templateColumns={`repeat(${5 + wonBy.length}, 1fr)`}
                    gap={5}
                    width={"100%"}>
                    <RaceDimension colSpan={1}>{`${getURLDate(raceDate).replace(/-/g, "/")}`}</RaceDimension>
                    <RaceDimension colSpan={1}>{`${formatRaceNumber(raceNumber)} race`}</RaceDimension>
                    <RaceDimension colSpan={1}>{`${raceResults.length} result${raceResults.length - 1 ? "s" : ""}`}</RaceDimension>
                    <RaceDimension colSpan={1}>Won by</RaceDimension>
                    {wonBy.length && wonBy.map((helm, key) => (
                        <RaceDimension colSpan={1} key={`helm${key}`}>{helm}</RaceDimension>
                    ))}
                </Grid>
            </Flex>
        </Box>
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

function ImmutableRace({ race }) {
    const navigateTo = useNavigate();
    const [correctedResults, resultsByClass, resultsByPH, maxLaps, SCT, isPursuitRace] = useSortedResults(undefined, race) || [];

    const getWinners = (positionalResults) => {
        debugger;
        const firstPlacePositionalResult = positionalResults[0];
        if (!firstPlacePositionalResult) {
            return undefined;
        }
        const pointsForFirstPlace = firstPlacePositionalResult[1];
        if (pointsForFirstPlace === 1) {
            return [HelmResult.getHelmId(firstPlacePositionalResult[0])];
        }
        return positionalResults.filter(([, position]) => position === pointsForFirstPlace).map(([result]) => HelmResult.getHelmId(result));
    };

    const classWinners = getWinners(resultsByClass);
    const phWinners = !isPursuitRace ? getWinners(resultsByPH) : [];

    const wonBy = [...phWinners, ...classWinners];

    return <ListItem>
        <ImmutableRaceListItem
            raceDate={race.getDate()}
            raceNumber={race.getNumber()}
            raceResults={correctedResults}
            wonBy={wonBy}
            onClick={() => navigateTo(`${getURLDate(race.getDate())}/${race.getNumber()}`)}
        />
    </ListItem>
}


function ImmutableRacesView({ races, ...props }) {

    return (
        <RacesList {...props}>
            {races.map((race) =>
                <ImmutableRace race={race} key={Race.getId(race)} />
            )}
        </RacesList >
    );
}


export default function Races({ liveOnly = false }) {
    const services = useServices();
    const [[mutableRaces, immutableRaces]] = useState(() => services.getRaces());
    const latestImmutableRaceDate = immutableRaces.sort((raceA, raceB) => raceB.sortByRaceAsc(raceA)).at(0).getDate();
    const filterRace = new Race(latestImmutableRaceDate, 1);

    const editableRaces = mutableRaces
        .filter((race) => services.isRaceEditableByUser(race))
        .filter((race) => !race.isBefore(filterRace));
    console.log(mutableRaces);
    console.log(latestImmutableRaceDate);

    return (
        <>
            <Flex direction="column" margin="5px">
                <Box marginTop="20px" />

                <Flex direction="row" marginBottom="20px">
                    <Heading size={"lg"} marginLeft="20px">{`Active Races`}</Heading>
                </Flex>
                <Box marginBottom="20px">
                    {Boolean(editableRaces.length)
                        ? <RacesView races={editableRaces} />
                        : <Text style={{ marginLeft: "20px" }}>No races can be edited by the current user.</Text>
                    }
                </Box>
                {!liveOnly && immutableRaces.length &&
                    <>
                        <Flex direction="row" marginBottom="20px">
                            <Heading size={"lg"} marginLeft="20px">{`Race Results`}</Heading>
                        </Flex>
                        <Box marginBottom="20px">
                            <ImmutableRacesView races={immutableRaces} />
                        </Box>
                    </>
                }
                {/* <BackButton>Back</BackButton> */}
            </Flex>
        </>
    );
}

import { List, ListItem, Text, Grid, GridItem, Icon } from "@chakra-ui/react";
import { Box, Flex, Heading, Spacer } from "@chakra-ui/react";
import React, { useState } from "react";

import { useServices, useAppState } from "../useAppState";
import { getURLDate, mapGroupBy, groupBy } from "../common"
import Race from "../store/types/Race";
import { useNavigate } from "react-router-dom";
import HelmResult from "../store/types/HelmResult";
import { useSortedResults, useStoreStatus } from "../common/hooks";
import { RacesCard } from "./Cards";
import { DroppableHeader } from "./CardHeaders";
import {
    Alert,
    AlertIcon,
    AlertTitle,
} from '@chakra-ui/react'
import { EditIcon } from "@chakra-ui/icons";

const TrophyIcon = (props) => (
    <Icon viewBox="0.45 2.1 7.6 6.8" {...props}>
        <path
            fill='currentColor'
            d="M4.25 1.338.495 2.466c.093 2.793.793 6.2 3.755 7.196 2.994-.968 3.627-4.433 3.755-7.196L4.25 1.338z"
        />
    </Icon>
);

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

function RaceListItem({ raceDate, raceNumber, onClick }) {
    const formatRaceNumber = (raceNumber) => ["1st", "2nd", "3rd"][raceNumber - 1];
    return <>
        <Flex className="race-list-item" alignItems={"center"} onClick={onClick}>
            <Grid
                templateColumns='repeat(6, 1fr)'
                gap={5}
                width={"100%"}>

                <RaceDimension colSpan={1} paddingLeft="5px">{`${getURLDate(raceDate).replace(/-/g, "/")}`}</RaceDimension>
                <RaceDimension colSpan={1} paddingLeft="5px">{`${formatRaceNumber(raceNumber)} race`}</RaceDimension>
                <GridItem colSpan="4">
                    <Flex direction="row" justifyContent={"space-between"} paddingRight="5px">
                        <Spacer />
                        <Text>Edit Race</Text>
                        <EditIcon fontSize="xl" style={{ marginLeft: "5px", marginTop: "1px" }} />
                    </Flex>
                </GridItem>
            </Grid>
        </Flex>

    </>
}

function ImmutableRaceListItem({ raceDate, raceNumber, raceResults = [], wonBy = [], onClick }) {
    const formatRaceNumber = (raceNumber) => ["1st", "2nd", "3rd"][raceNumber - 1];
    const [classWinner, phWinner] = wonBy;

    return <>
        <Box className="race-list-item" onClick={onClick}>
            <Flex>
                <Grid
                    templateColumns={`repeat(${6}, 1fr)`}
                    gap={5}
                    width={"100%"}>
                    <RaceDimension colSpan={1} padding="5px 0px 5px 5px">{`${getURLDate(raceDate).replace(/-/g, "/")}`}</RaceDimension>
                    <RaceDimension colSpan={1} padding="5px 0px 5px 5px">{`${formatRaceNumber(raceNumber)} race`}</RaceDimension>
                    <GridItem colSpan="4">
                        <Flex direction="row" className="winners-container" justifyContent={"space-between"}>
                            <Flex direction="row">
                                <div className="label ch trophy-container">
                                    <TrophyIcon />
                                    <Text>CH</Text>
                                </div>
                                <Text className="name" isTruncated fontSize={"sm"}>
                                    {classWinner}
                                </Text>
                            </Flex>
                            {phWinner &&
                                <Flex direction="row">
                                    <div className="label ph trophy-container">
                                        <TrophyIcon />
                                        <Text>PH</Text>
                                    </div>
                                    <Text className="name" isTruncated fontSize={"sm"}>
                                        {phWinner}
                                    </Text>
                                </Flex>
                            }
                        </Flex>
                    </GridItem>
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
    const [raceFinish, correctedResults, resultsByClass, resultsByPH, maxLaps, SCT, isPursuitRace] = useSortedResults(undefined, race) || [];

    const getWinners = (positionalResults) => {
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

    const wonBy = [classWinners.join(", "), phWinners.join(", ")];

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

function StatusWrapper() {
    const storesStatus = useStoreStatus();
    const storesToSync = Object.entries(storesStatus || [])
        .filter(([, synced]) => !synced);

    return (
        <>
            {Boolean(storesToSync.length) &&
                <Box margin="10px">
                    <Alert status='warning'>
                        <AlertIcon />
                        <AlertTitle mr={2}>Completed races have not yet been uploaded.</AlertTitle>
                    </Alert>
                </Box>
            }
            {!Boolean(storesToSync.length) &&
                <Box margin="10px">
                    <Alert status='success'>
                        <AlertIcon />
                        <AlertTitle mr={2}>All edited races have been uploaded successfully.</AlertTitle>
                    </Alert>
                </Box>
            }
        </>
    )
}

export default function Races({ editableOnly = false }) {
    const services = useServices();
    const [appState] = useAppState();

    const [[mutableRaces, immutableRaces]] = useState(() => services.getRaces(services.isLive));
    const latestImmutableRaceDate = immutableRaces.sort((raceA, raceB) => raceB.sortByRaceAsc(raceA)).at(0).getDate();

    // Don't show editable races before the last race that was committed to the store
    const filterRace = new Race(latestImmutableRaceDate, 1);
    // const filterRace = new Race(new Date(0), 1);

    const editableRaces = mutableRaces
        .filter((race) => services.isRaceEditableByUser(race))
        .filter((race) => !race.isBefore(filterRace));

    // const now = new Date();
    const midnightUTC = new Date();
    midnightUTC.setUTCHours(0, 0, 0, 0);
    const firstRaceToday = new Race(midnightUTC, 1);
    const nextEditableRace = editableRaces
        .filter((race) => !race.isBefore(firstRaceToday))
        .sort((raceA, raceB) => raceA.sortByRaceAsc(raceB))
        .at(0);

    const previousRaces = mutableRaces
        .filter((race) => services.isRaceEditableByUser(race))
        .filter((race) => !race.isBefore(filterRace))
        .filter((race) => race.isBefore(firstRaceToday))
        .sort((raceA, raceB) => raceA.sortByRaceAsc(raceB));

    // Get the latest historical mutable race day
    const lastRaces = previousRaces.filter((race) => previousRaces.at(-1).getDate().getTime() === race.getDate().getTime());

    const editedRaces = immutableRaces
        .filter((race) => services.isRaceEditableByUser(race));

    const todaysFinishedRaces = immutableRaces
        .filter((race) => services.isRaceEditableByUser(race))
        .filter((race) => race.getDate().getTime() === firstRaceToday.getDate().getTime());

    const immutableNotEdited = immutableRaces.filter((race) => !editedRaces.includes(race));

    const activeRaces = groupBy([...appState.results, ...appState.oods, ...appState.registered], [HelmResult.getRaceId])
        .map(([id]) => Race.fromId(id))
        .filter((race) => services.isRaceMutable(race.getDate(), race.getNumber()));

    const showNextEditableRace = !Boolean(activeRaces.length) && Boolean(nextEditableRace);

    return (
        <>
            <Flex direction="column" padding="5px">
                <Flex direction="row" marginTop="20px">
                    <Heading size={"lg"} marginLeft="10px">{`Races`}</Heading>
                </Flex>
                <Box marginTop="20px" />
                {Boolean(lastRaces.length) && (!showNextEditableRace || appState.adminMode) &&
                    < RacesCard >
                        <DroppableHeader heading="Last race day" />
                        <Box marginBottom="20px" padding="10px" paddingTop="20px">
                            <RacesView races={lastRaces} />
                        </Box>
                    </RacesCard>
                }
                {Boolean(activeRaces.length) &&
                    <RacesCard>
                        <DroppableHeader heading="Active races" />
                        <Box marginBottom="20px" padding="10px" paddingTop="20px">
                            <RacesView races={activeRaces} />
                        </Box>
                        <Spacer />
                        <Box margin="10px">
                            <Alert status='warning'>
                                <AlertIcon />
                                <AlertTitle mr={2}>Active race results have not been committed.</AlertTitle>
                            </Alert>
                        </Box>
                    </RacesCard>
                }
                {showNextEditableRace &&
                    <RacesCard>
                        <DroppableHeader heading="Next race" />
                        <Box marginBottom="20px" padding="10px" paddingTop="20px">
                            <RacesView races={[nextEditableRace]} />
                        </Box>
                    </RacesCard>
                }
                {todaysFinishedRaces && Boolean(todaysFinishedRaces.length) &&
                    <RacesCard>
                        <DroppableHeader heading="Completed races" />
                        <Box marginBottom="20px" padding="10px" paddingTop="20px">
                            <ImmutableRacesView races={todaysFinishedRaces} />
                        </Box>
                    </RacesCard>
                }
                {!editableOnly && Boolean(immutableNotEdited.length) &&
                    <RacesCard>
                        <DroppableHeader heading="Race results" />
                        <Box marginBottom="20px" padding="10px" paddingTop="20px">
                            <ImmutableRacesView races={immutableNotEdited} />
                        </Box>
                    </RacesCard>
                }
                {!Boolean(activeRaces.length) &&
                    <StatusWrapper />
                }
            </Flex>
        </>
    );
}

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
import { RacesCard } from "./Cards";
import { DroppableHeader } from "./CardHeaders";
import SeriesArchive from "./SeriesArchive";

const DISPLAY_SERIES_ARCHIVE = true;

function SeriesDimension({ children, ...props }) {
    return (
        <GridItem
            height='20px'
            {...props}>
            <Text isTruncated>{children}</Text>
        </GridItem>
    );
}

function SeriesPointsListItem({ seasonName, seriesName, seriesPoints, wonBy = [] }) {
    return <>
        <Link to={`${seasonName}/${seriesName}`} >
            <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"} bg={"white"} >
                <Flex>
                    <Grid
                        templateColumns={`repeat(${2 + wonBy.length}, 1fr)`}
                        gap={5}
                        width={"100%"}>
                        <SeriesDimension colSpan={1}>{`${seasonName} ${seriesName}`}</SeriesDimension>
                        <SeriesDimension colSpan={1}></SeriesDimension>
                    </Grid>
                </Flex>
            </Box>
        </Link>
    </>
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

function SeriesPointsView({ seriesPoints }) {
    const navigateTo = useNavigate();
    // const [raceFinish, correctedResults, resultsByClass, resultsByPH, maxLaps, SCT, isPursuitRace] = useSortedResults(undefined, race) || [];

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

    // const classWinners = getWinners(resultsByClass);
    // const phWinners = !isPursuitRace ? getWinners(resultsByPH) : [];

    return <ListItem>
        <SeriesPointsListItem
            seasonName={seriesPoints.getSeasonName()}
            seriesName={seriesPoints.getSeriesName()}
            seriesPoints={seriesPoints}
        />
    </ListItem>
}


function AllSeriesView({ series, ...props }) {
    return (
        <RacesList {...props}>
            {series.map((seriesPoints, index) =>
                <SeriesPointsView seriesPoints={seriesPoints} key={index} />
            )}
        </RacesList >
    );
}


export default function Series() {
    const services = useServices();
    const [allSeries] = useState(() => services.getSeriesPoints()
        .sort((seriesA, seriesB) => seriesA.sortBySeriesAsc(seriesB))
        .filter((series) => series.finishedRaces)
        .reverse()
    );

    return (
        <>
            <Flex direction="column" padding="5px">
                <Flex direction="row" marginTop="20px">
                    <Heading size={"lg"} marginLeft="10px">{`Series Results`}</Heading>
                </Flex>
                <Box marginTop="20px" />
                <RacesCard>
                    {/* <DroppableHeader heading="Series points" /> */}
                    <Box marginBottom="20px" padding="10px" paddingTop="20px">
                        <AllSeriesView series={allSeries} />
                    </Box>
                </RacesCard>
                {DISPLAY_SERIES_ARCHIVE &&
                    <RacesCard>
                        <DroppableHeader heading="Results Archive" />
                        <Box marginBottom="20px" padding="10px" paddingTop="20px">
                            <RacesList>
                                <SeriesArchive />
                            </RacesList>
                        </Box>
                    </RacesCard>
                }
            </Flex>
        </>
    );
}

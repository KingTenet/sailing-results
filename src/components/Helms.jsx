import React, { useState } from "react";
import {
    Box,
    Flex,
    Grid,
    GridItem,
    Heading,
    List,
    ListItem,
    Text,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

import { useServices } from "../useAppState";
import { RacesCard } from "./Cards";
import HelmSummary from "./shadCN/HelmSummary";

function SeriesDimension({ children, ...props }) {
    return (
        <GridItem height="20px" {...props}>
            <Text isTruncated>{children}</Text>
        </GridItem>
    );
}

function SeriesPointsListItem({ seasonName, seriesName, wonBy = [] }) {
    return (
        <>
            <Link to={`${seasonName}/${seriesName}`}>
                <Box
                    padding={"10px"}
                    borderRadius={"12px"}
                    borderWidth={"1px"}
                    borderColor={"grey"}
                    bg={"white"}
                >
                    <Flex>
                        <Grid
                            templateColumns={`repeat(${2 + wonBy.length}, 1fr)`}
                            gap={5}
                            width={"100%"}
                        >
                            <SeriesDimension
                                colSpan={1}
                            >{`${seasonName} ${seriesName}`}</SeriesDimension>
                            <SeriesDimension colSpan={1}></SeriesDimension>
                        </Grid>
                    </Flex>
                </Box>
            </Link>
        </>
    );
}

function RacesList({ children, ...props }) {
    return (
        <Box {...props}>
            <List spacing="5px">{children}</List>
        </Box>
    );
}

function SeriesPointsView({ seriesPoints }) {
    return (
        <ListItem>
            <SeriesPointsListItem
                seasonName={seriesPoints.getSeasonName()}
                seriesName={seriesPoints.getSeriesName()}
                seriesPoints={seriesPoints}
            />
        </ListItem>
    );
}

function AllSeriesView({ series, ...props }) {
    return (
        <RacesList {...props}>
            {series.map((seriesPoints, index) => (
                <SeriesPointsView seriesPoints={seriesPoints} key={index} />
            ))}
        </RacesList>
    );
}

export default function Series() {
    const services = useServices();
    const [allSeries] = useState(() =>
        services
            .getSeriesPoints()
            .sort((seriesA, seriesB) => seriesA.sortBySeriesAsc(seriesB))
            .filter((series) => series.finishedRaces)
            .reverse(),
    );

    return (
        <>
            <HelmSummary />
            {/* <Flex direction="column" padding="5px">
        <Flex direction="row" marginTop="20px">
          <Heading size={"lg"} marginLeft="10px">{`Series Results`}</Heading>
        </Flex>
        <Box marginTop="20px" />
        <RacesCard>
          <Box marginBottom="20px" padding="10px" paddingTop="20px">
            <AllSeriesView series={allSeries} />
          </Box>
        </RacesCard>
      </Flex> */}
        </>
    );
}

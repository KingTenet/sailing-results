import { Box, Flex, Heading, TableContainer, Table, TableCaption, Thead, Tr, Th, Tbody, Td, Tfoot, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { useServices } from "../useAppState";
import { RacesCard } from "./Cards";
import { DroppableHeader } from "./CardHeaders";
import { groupBy, flatten, getURLDate } from "../common";
import Helm from "../store/types/Helm";
import Race from "../store/types/Race";

function formatRaceDate(raceDate) {
    const date = raceDate.getDate();
    const raceNumber = raceDate.getNumber();
    let year = date.getUTCFullYear();
    let month = date.getUTCMonth();
    let monthDate = date.getUTCDate();
    return `${monthDate}/${month + 1}`;
}

function formatRaceNumber(raceDate) {
    return `R${raceDate.getNumber()}`;
}

function formatPoints(points, showLabel) {
    if (!points) {
        return "";
    }
    const isOOD = points.isOOD();
    const isPNS = points.isPNS();
    const isDNF = points.isDNF();

    if (showLabel) {
        if (isOOD) {
            return "OOD";
        }
        if (isPNS) {
            return "";
        }
        if (Math.round(points.getTotal()) !== points.getTotal()) {
            return `${Math.floor(points.getTotal())}=`;
        }
        return points.getTotal();
    }

    if (isPNS) {
        return "";
    }

    return points.isCounted
        ? points.getTotal()
        : `[${points.getTotal()}]`;
}

const StyledTd = ({ children, ...props }) => {
    return <Td borderTopWidth="1px" borderColor="blackAlpha.300" borderTopColor="blackAlpha.300" borderRightWidth="1px" borderRightColor="blackAlpha.50" borderLeftColor="blackAlpha.50" padding="1px" whiteSpace={"nowrap"} {...props} >{children}</Td>;
}

const StyledTh = ({ children, ...props }) => {
    return <Th borderTopWidth="1px" borderColor="blackAlpha.300" borderTopColor="blackAlpha.300" borderRightWidth="1px" borderRightColor="blackAlpha.50" borderLeftColor="blackAlpha.50" padding="1px" whiteSpace={"nowrap"}  {...props} >{children}</Th>;
}

function HelmRow({ helmId, index, totalPoints, racePoints, sortedRaces }) {
    const usboats = [...new Set(flatten([...racePoints].map(([race, boatPoints]) => [...boatPoints].map(([boat]) => boat))))];
    debugger;
    const boats = usboats.sort((classA, classB) => classA === classB ? 0 : classA < classB ? 1 : -1).reverse();

    const allPointsFlattened = flatten([...racePoints].map(([, boatPoints]) => flatten([...boatPoints].map(([, points]) => points))));
    // const usboats = mapGroupBy(allPointsFlattened, [HelmResult.getHelmId, HelmResult.getRaceId, ResultPoints.getBoatClassName]);
    // const usboats = mapGroupBy(allPointsFlattened, [HelmResult.getHelmId, HelmResult.getRaceId, ResultPoints.getBoatClassName]);

    const totalPNS = allPointsFlattened.filter((points) => points.isPNS()).reduce((acc, points) => points.isCounted ? points.getTotal() + acc : acc, 0);

    // "teal.100"
    const props = {
        bg: (index % 2) ? "" : "whiteAlpha.600",
    };

    return <>
        {boats && boats.length &&
            boats.map((boatClass, boatIndex) => {
                console.log(boatClass);
                return (
                    <Tr key={boatIndex} borderTop={!boatIndex ? "1px" : "0px"} {...props}>
                        <StyledTd>{!Boolean(boatIndex) && helmId}</StyledTd>
                        <StyledTd borderRightColor="blackAlpha.800" paddingRight="5px">{boatClass}</StyledTd>
                        {sortedRaces.map((race, index) => {
                            const points = racePoints.has(Race.getId(race)) && racePoints.get(Race.getId(race)).has(boatClass)
                                ? racePoints.get(Race.getId(race)).get(boatClass).at(0)
                                : undefined;
                            return (
                                <StyledTd key={index} borderRightColor={index === sortedRaces.length - 1 ? "blackAlpha.800" : "blackAlpha.50"} isNumeric>{formatPoints(points, true)}</StyledTd>
                            );
                        })}
                        <StyledTd borderRightColor="blackAlpha.800" isNumeric>{!Boolean(boatIndex) && totalPNS}</StyledTd>
                        <StyledTd isNumeric>{!Boolean(boatIndex) && totalPoints}</StyledTd>
                    </Tr>
                )
            })
        }
        <Tr {...props}>
            <StyledTd></StyledTd>
            <StyledTd borderRightColor="blackAlpha.800"></StyledTd>
            {sortedRaces.map((race, index) => {
                const raceId = Race.getId(race);
                const points = [...(racePoints.get(Race.getId(race))) || []]
                    .map(([, points]) => points[0])
                    .at(0)
                // const totalForRace = racePoints ? racePoints.getTotal() : 0;
                return <StyledTd key={index} borderRightColor={index === sortedRaces.length - 1 ? "blackAlpha.800" : "blackAlpha.50"} isNumeric>{formatPoints(points)}</StyledTd>
            })}
            <StyledTd borderRightColor="blackAlpha.800"></StyledTd>
            <StyledTd></StyledTd>
        </Tr>
    </>
}

function Clickable({ onClick, clickable, children }) {
    return children({
        ...(clickable ? {
            onClick
        } : {})
    })
}

export default function SeriesPoints() {
    const services = useServices();
    const navigateTo = useNavigate();
    const params = useParams();
    const season = params["season"];
    const series = params["series"];
    const seriesPoints = services.getSeriesPoints().find((seriesPoints) => seriesPoints.getSeasonName() === season && seriesPoints.getSeriesName() === series);

    const [sortedRaces, totalPointsByHelm, allPoints, pointsByRace] = seriesPoints.getAllRacePointsByClassHandicap();
    // const [sortedRaces, totalPointsByHelm, allPoints] = seriesPoints.getAllRacePointsByPersonalHandicap();




    return (
        <>
            <Flex direction="column" style={{ display: "inline-block" }}>
                {/* <Flex direction="row" marginTop="20px">
                    <Heading size={"lg"} marginLeft="10px">{`Race Results`}</Heading>
                </Flex> */}
                {/* <Box marginTop="20px" /> */}
                <RacesCard display="inline-block" >
                    <DroppableHeader heading={`${series} ${season} series points`} />
                    {/* <TableContainer maxWidth={"2000px"} overflowX={"visible"}> */}
                    {/* <Table size="sm" variant='striped' colorScheme="teal"> */}
                    <Box padding="10px">
                        <Table size="sm" variant='simple' >
                            <Thead>
                                <Tr>
                                    <StyledTh borderBottomWidth="0px">Helm</StyledTh>
                                    <StyledTh borderBottomWidth="0px" borderRightColor="blackAlpha.800">Class</StyledTh>
                                    {sortedRaces.map((race, index) => (
                                        <StyledTh
                                            borderRightColor={index === sortedRaces.length - 1 ? "blackAlpha.800" : "blackAlpha.300"}
                                        >
                                            {(pointsByRace.has(Race.getId(race)) && pointsByRace.get(Race.getId(race)))
                                                ? <Link to={`${getURLDate(race.getDate())}/${race.getNumber()}`}>{formatRaceDate(race)}</Link>
                                                : formatRaceDate(race)
                                            }
                                        </StyledTh>
                                    ))}
                                    <StyledTh borderBottomWidth="0px" paddingLeft="3px" paddingRight="3px" borderRightColor={"blackAlpha.800"}>PNS</StyledTh>
                                    <StyledTh borderBottomWidth="0px" paddingLeft="3px" paddingRight="3px">Pts</StyledTh>
                                </Tr>
                                <Tr>
                                    <StyledTh borderTopWidth="0px"></StyledTh>
                                    <StyledTh borderRightColor="blackAlpha.800" borderTopWidth="0px"></StyledTh>
                                    {sortedRaces.map((race, index) => (
                                        <StyledTh
                                            key={index}
                                            borderRightColor={index === sortedRaces.length - 1 ? "blackAlpha.800" : "blackAlpha.300"}
                                            onClick={() => navigateTo(`${getURLDate(race.getDate())}/${race.getNumber()}`)}
                                        >
                                            {formatRaceNumber(race)}
                                        </StyledTh>
                                    ))
                                    }
                                    <StyledTh borderTopWidth="0px" borderRightColor={"blackAlpha.800"}></StyledTh>
                                    <StyledTh borderTopWidth="0px"></StyledTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {totalPointsByHelm.map(([helmId, totalPoints], index) => (
                                    <HelmRow key={index} index={index} helmId={helmId} totalPoints={totalPoints} racePoints={allPoints.get(helmId)} sortedRaces={sortedRaces} />
                                ))}
                                {/* {rowHeaders.map(([helm, className], rowIndex) => (
                                    <Tr>
                                        {className
                                            ? <Td marginLeft="50px">{className}</Td>
                                            : <Td>{helm}</Td>
                                        }
                                        {allCells[rowIndex].map((points) => (
                                            <Td isNumeric>{formatPoints(points)}</Td>
                                        ))}
                                    </Tr>
                                ))} */}
                            </Tbody>
                            <Tfoot>
                            </Tfoot>
                        </Table>
                    </Box>
                    {/* </TableContainer> */}
                </RacesCard>
                {/* <BackButton>Back</BackButton> */}
            </Flex>
        </>
    );
}

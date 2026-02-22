import {
    Box,
    Flex,
    Table,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
    Tfoot,
    Center,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import { useServices } from "../useAppState";
import { RacesCard } from "./Cards";
import { DroppableHeader } from "./CardHeaders";
import { flatten, getURLDate, round2sf } from "../common";
import Race from "../store/types/Race";
import { BackButton, GreenButton } from "./Buttons";

const STRONG_EMPHASIS = "blackAlpha.500";
const NORMAL_EMPHASIS = "blackAlpha.300";
const LIGHT_EMPHASIS = "blackAlpha.50";

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

    const format = () => {
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
        ? round2sf(points.getTotal())
        : `[${round2sf(points.getTotal())}]`;
    };

    return points.isCrew() ? `${format()}*` : format();
}

const StyledTd = ({ children, ...props }) => {
    return (
        <Td
            borderTopWidth="1px"
            borderColor={NORMAL_EMPHASIS}
            borderTopColor={NORMAL_EMPHASIS}
            borderRightWidth="1px"
            borderRightColor={LIGHT_EMPHASIS}
            borderLeftColor={LIGHT_EMPHASIS}
            padding="1px"
            whiteSpace={"nowrap"}
            {...props}
        >
            {children}
        </Td>
    );
};

const StyledTh = ({ children, ...props }) => {
    return (
        <Th
            borderTopWidth="1px"
            borderColor={NORMAL_EMPHASIS}
            borderTopColor={NORMAL_EMPHASIS}
            borderRightWidth="1px"
            borderRightColor={LIGHT_EMPHASIS}
            borderLeftColor={LIGHT_EMPHASIS}
            padding="1px"
            whiteSpace={"nowrap"}
            {...props}
        >
            {children}
        </Th>
    );
};

function HelmRow({ helmId, index:rowIndex, totalPoints, racePoints, sortedRaces }) {
    const boats = [
        ...new Set(
            flatten(
                [...racePoints].map(([, boatPoints]) =>
                    [...boatPoints].map(([boat]) => boat),
                ),
            ),
        ),
    ]
        .sort((classA, classB) =>
            classA === classB ? 0 : classA < classB ? 1 : -1,
        )
        .reverse();

    const allPointsFlattened = flatten(
        [...racePoints].map(([, boatPoints]) =>
            flatten([...boatPoints].map(([, points]) => points)),
        ),
    );

    const totalPNS = allPointsFlattened
        .filter((points) => points.isPNS())
        .reduce(
            (acc, points) => (points.isCounted ? points.getTotal() + acc : acc),
            0,
        );

    return (
        <>
            {boats &&
                boats.length &&
                boats.map((boatClass, boatIndex) => (
                    <Tr
                        key={boatIndex}
                        borderTop={!boatIndex ? "1px" : "0px"}
                        bg={rowIndex % 2 ? "" : "whiteAlpha.600"}
                    >
                        <StyledTd>{!Boolean(boatIndex) && helmId}</StyledTd>
                        <StyledTd
                            borderRightColor={STRONG_EMPHASIS}
                            paddingRight="5px"
                        >
                            {boatClass}
                        </StyledTd>
                        {sortedRaces.map((race, index) => {
                            const points =
                                racePoints.has(Race.getId(race)) && racePoints.get(Race.getId(race)).has(boatClass)
                                    ? racePoints
                                        .get(Race.getId(race))
                                        .get(boatClass)
                                        .at(0)
                                    : undefined;
                            return (
                                <StyledTd
                                    key={index}
                                    borderRightColor={
                                        index === sortedRaces.length - 1
                                            ? STRONG_EMPHASIS
                                            : LIGHT_EMPHASIS
                                    }
                                    isNumeric
                                >
                                    {formatPoints(points, true)}
                                </StyledTd>
                            );
                        })}
                        <StyledTd
                            borderRightColor={STRONG_EMPHASIS}
                            isNumeric
                        >
                            {!Boolean(boatIndex) && (totalPNS || "")}
                        </StyledTd>
                        <StyledTd isNumeric>
                            {!Boolean(boatIndex) && round2sf(totalPoints)}
                        </StyledTd>
                    </Tr>)
                )}
            <Tr bg={rowIndex % 2 ? "" : "whiteAlpha.600"}>
                <StyledTd></StyledTd>
                <StyledTd borderRightColor={STRONG_EMPHASIS}></StyledTd>
                {sortedRaces.map((race, index) => {
                    const raceId = Race.getId(race);
                    const points = [...(racePoints.get(Race.getId(race)) || [])]
                        .map(([, points]) => points[0])
                        .at(0);
                    // const totalForRace = racePoints ? racePoints.getTotal() : 0;
                    return (
                        <StyledTd
                            key={index}
                            borderRightColor={
                                index === sortedRaces.length - 1
                                    ? STRONG_EMPHASIS
                                    : LIGHT_EMPHASIS
                            }
                            isNumeric
                        >
                            {formatPoints(points)}
                        </StyledTd>
                    );
                })}
                <StyledTd borderRightColor={STRONG_EMPHASIS}></StyledTd>
                <StyledTd></StyledTd>
            </Tr>
        </>
    );
}

const resultsTypeLabels = {
    "personalHandicap": " by personal handicap",
    "classHandicap": " by class handicap",
    "classHandicapWithCrew": " by class handicap with crew"
};
const pursuitSeriesLabels = {
    "personalHandicap": "",
    "classHandicap": "",
    "classHandicapWithCrew": " with crew"
};

export default function SeriesPoints() {
    const services = useServices();
    const navigateTo = useNavigate();
    const params = useParams();
    const season = params["season"];
    const series = params["series"];

    const seriesPoints = services
        .getSeriesPoints()
        .find(
            (seriesPoints) =>
                seriesPoints.getSeasonName() === season &&
                seriesPoints.getSeriesName() === series
        );

    const hasPursuitRaces = seriesPoints && seriesPoints.hasPursuitRaces();
    const labelsToUse = hasPursuitRaces ? pursuitSeriesLabels : resultsTypeLabels;
    const isDoubleHandedSeries = seriesPoints.isDoubleHandedSeries();
    const personalHandicapRaces = !isDoubleHandedSeries && 
        seriesPoints.getPersonalHandicapRacesToCount(new Date()) - 1;

    const [resultsTypes] = useState(() => {
        if (isDoubleHandedSeries) {
            return ["classHandicapWithCrew"];
        }
        else if (!personalHandicapRaces) {
            return  ["classHandicap", "classHandicapWithCrew"];
        }
        return ["classHandicap", "classHandicapWithCrew", "personalHandicap"];
    });

    const [resultsTypeIndex, updateResultsTypeIndex] = useState(0);

    const resultsByPersonalHandicap = resultsTypes[resultsTypeIndex] === "personalHandicap";
    const resultsByClassHandicapWithCrew = resultsTypes[resultsTypeIndex] === "classHandicapWithCrew";
    const toggleResultsType = () => updateResultsTypeIndex((resultsTypeIndex + 1) % resultsTypes.length);


    const [sortedRaces, totalPointsByHelm, allPoints, numRaceStarters] =
        resultsByPersonalHandicap && personalHandicapRaces ? seriesPoints.getAllRacePointsByPersonalHandicap()
            : resultsByClassHandicapWithCrew ? seriesPoints.getAllRacePointsByClassHandicapWithCrew()
            : seriesPoints.getAllRacePointsByClassHandicap();

    return (
        <>
            {/* <Center> */}
            <Flex direction="column" style={{ display: "inline-block" }}>
                <RacesCard display="inline-block">
                    <DroppableHeader
                        heading={`${series} ${season} series points${labelsToUse[resultsTypes[resultsTypeIndex]]}`}
                    />
                    <Box padding="10px">
                        <Table size="sm" variant="simple">
                            <Thead>
                                <Tr>
                                    <StyledTh borderBottomWidth="0px">
                                        Helm / Crew
                                    </StyledTh>
                                    <StyledTh
                                        borderBottomWidth="0px"
                                        borderRightColor={STRONG_EMPHASIS}
                                    >
                                        Class
                                    </StyledTh>
                                    {sortedRaces.map((race, index) => (
                                        <StyledTh
                                            minWidth="45px"
                                            key={index}
                                            borderRightColor={
                                                index === sortedRaces.length - 1
                                                    ? STRONG_EMPHASIS
                                                    : NORMAL_EMPHASIS
                                            }
                                        >
                                            {numRaceStarters.has(
                                                Race.getId(race),
                                            ) &&
                                            numRaceStarters.get(
                                                Race.getId(race),
                                            ) ? (
                                                <Link
                                                    to={`${getURLDate(race.getDate())} /${race.getNumber()}`}
                                                >
                                                    {formatRaceDate(race)}
                                                </Link>
                                            ) : (
                                                formatRaceDate(race)
                                            )}
                                        </StyledTh>
                                    ))}
                                    <StyledTh
                                        borderBottomWidth="0px"
                                        paddingLeft="3px"
                                        paddingRight="3px"
                                        minWidth="45px"
                                        borderRightColor={STRONG_EMPHASIS}
                                    >
                                        PNS
                                    </StyledTh>
                                    <StyledTh
                                        borderBottomWidth="0px"
                                        paddingLeft="3px"
                                        paddingRight="3px"
                                        minWidth="45px"
                                    >
                                        Pts
                                    </StyledTh>
                                </Tr>
                                <Tr>
                                    <StyledTh borderTopWidth="0px"></StyledTh>
                                    <StyledTh
                                        borderRightColor={STRONG_EMPHASIS}
                                        borderTopWidth="0px"
                                    ></StyledTh>
                                    {sortedRaces.map((race, index) => (
                                        <StyledTh
                                            key={index}
                                            borderRightColor={
                                                index === sortedRaces.length - 1
                                                    ? STRONG_EMPHASIS
                                                    : NORMAL_EMPHASIS
                                            }
                                        >
                                            {numRaceStarters.has(
                                                Race.getId(race),
                                            ) &&
                                            numRaceStarters.get(
                                                Race.getId(race),
                                            ) ? (
                                                <Link
                                                    to={`${getURLDate(race.getDate())}/${race.getNumber()}`}
                                                >
                                                    {formatRaceNumber(race)}
                                                </Link>
                                            ) : (
                                                formatRaceNumber(race)
                                            )}
                                        </StyledTh>
                                    ))}
                                    <StyledTh
                                        borderTopWidth="0px"
                                        borderRightColor={STRONG_EMPHASIS}
                                    ></StyledTh>
                                    <StyledTh borderTopWidth="0px"></StyledTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {totalPointsByHelm.map(
                                    ([helmId, totalPoints], index) => (
                                        <HelmRow
                                            key={index}
                                            index={index}
                                            helmId={helmId}
                                            totalPoints={totalPoints}
                                            racePoints={allPoints.has(helmId) ? allPoints.get(helmId) : new Map()}
                                            sortedRaces={sortedRaces}
                                        />
                                    ),
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </RacesCard>

                <Flex direction="column" width="100%" marginTop="20px">
                    {resultsTypes.length && (
                        <GreenButton
                            maxWidth="100vw"
                            onClick={() =>
                                toggleResultsType()
                            }
                            autoFocus
                        >
                            {`Show points${labelsToUse[resultsTypes[(resultsTypeIndex + 1) % resultsTypes.length]]}`}
                        </GreenButton>
                    )}
                    <BackButton maxWidth="100vw">{"Back to series"}</BackButton>
                </Flex>
            </Flex>
            {/* </Center> */}
        </>
    );
}

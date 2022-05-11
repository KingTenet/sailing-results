import { Box, Flex, Heading, List, ListItem, Text, Grid, GridItem } from "@chakra-ui/react";
import React, { useState } from "react";

import HelmResult from "../store/types/HelmResult";
import Result from "../store/types/Result";
import { calculatePIFromPersonalHandicap } from "../common/personalHandicapHelpers.js";
import { useDimensionsToggle, useSortedResults } from "../common/hooks.js";

import { GreenButton } from "./Buttons";

const RACE_VIEWS = ["PERSONAL_HANDICAP", "CLASS_HANDICAP", "FINISH_TIME"];

const COLUMN_1_DIMENSIONS = {
    "PERSONAL_HANDICAP": [
        "NAME",
        "SAIL_NUMBER",
    ],
    "CLASS_HANDICAP": [
        "NAME",
        "SAIL_NUMBER",
    ],
    "FINISH_TIME": [
        "NAME",
        "SAIL_NUMBER",
    ],
};

const COLUMN_2_DIMENSIONS = {
    "PERSONAL_HANDICAP": [
        "CLASS_NAME",
        "PERSONAL_HANDICAP",
        "CLASS_HANDICAP"
    ],
    "CLASS_HANDICAP": [
        "CLASS_NAME",
        "CLASS_HANDICAP"
    ],
    "FINISH_TIME": [
        "CLASS_NAME",
        "CLASS_HANDICAP"
    ],
};

const COLUMN_3_DIMENSIONS = {
    "PERSONAL_HANDICAP": [
        "PERSONAL_CORRECTED_TIME",
        "PERSONAL_HANDICAP_RESULT",
        "PERSONAL_INTERVAL",
        // "PERSONAL_INTERVAL_FROM_PH",
    ],
    "CLASS_HANDICAP": [
        "CLASS_CORRECTED_TIME",
    ],
    "FINISH_TIME": [
        "FINISH_TIME",
        "LAPS",
    ],
};

const DIMENSION_LABELS = {
    "NAME": "Name",
    "SAIL_NUMBER": "Sail Number",
    "CLASS_NAME": "Class",
    "PERSONAL_HANDICAP": "Personal PY",
    "CLASS_HANDICAP": "Class PY",
    "PERSONAL_CORRECTED_TIME": "Time",
    "PERSONAL_HANDICAP_RESULT": "PH",
    "PERSONAL_INTERVAL": "PI (%)",
    "PERSONAL_INTERVAL_FROM_PH": "PY/PH (%)",
    "CLASS_CORRECTED_TIME": "Time",
    "FINISH_TIME": "Time",
    "LAPS": "Laps",
};

function secondsToMinutesSeconds(totalSeconds) {
    const SECONDS_IN_MINUTE = 60;
    var minutes = Math.floor(totalSeconds / SECONDS_IN_MINUTE);
    var seconds = totalSeconds % SECONDS_IN_MINUTE;
    return [minutes, seconds];
}

function formatMinutesSeconds([minutes, seconds]) {
    const pad = (v) => {
        return `0${Math.round(v)}`.slice(v > 100 ? -3 : -2);
    }
    return [pad(minutes), pad(seconds)].join(":");
}

function formatBoatClass(className) {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    return className.split(" ").map((word) => capitalize(word.toLowerCase())).join(" ");
}

function formatPI(personalInterval) {
    return Math.round((personalInterval + Number.EPSILON) * 100) / 100;
}

function ResultDimension({ children, ...props }) {
    return (
        <GridItem
            height='20px'
            {...props}>
            <Text isTruncated>{children}</Text>
        </GridItem>
    );
}

function HeadingRow({ toggleDimension1, toggleDimension2, toggleDimension3, dimension1, dimension2, dimension3 }) {
    const dimension1Label = DIMENSION_LABELS[dimension1];
    const dimension2Label = DIMENSION_LABELS[dimension2];
    const dimension3Label = DIMENSION_LABELS[dimension3];

    return <>
        <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"}>
            <Flex>
                <Grid
                    templateColumns='repeat(16, 1fr)'
                    gap={3}
                    width={"100%"}>
                    <ResultDimension colSpan={1}></ResultDimension>
                    <ResultDimension colSpan={6} onClick={toggleDimension1}>{dimension1Label}</ResultDimension>
                    <ResultDimension colSpan={6} onClick={toggleDimension2}>{dimension2Label}</ResultDimension>
                    <ResultDimension colSpan={3} onClick={toggleDimension3}>{dimension3Label}</ResultDimension>
                </Grid>
            </Flex>
        </Box>
    </>
}

function getDimensionValue(dimension, result) {
    switch (dimension) {
        case "NAME":
            return Result.getHelmId(result);
        case "SAIL_NUMBER":
            return result.getSailNumber();
        case "CLASS_NAME":
            return formatBoatClass(result.getBoatClass().getClassName());
        case "PERSONAL_HANDICAP":
            return result.getRollingPersonalHandicapBeforeRace();
        case "CLASS_HANDICAP":
            return result.getBoatClass().getPY();
        case "PERSONAL_CORRECTED_TIME":
            return result.isValidFinish()
                ? formatMinutesSeconds(secondsToMinutesSeconds(result.getPersonalCorrectedFinishTime()))
                : "DNF"
        case "PERSONAL_HANDICAP_RESULT":
            return result.isValidFinish()
                ? result.getPersonalHandicapFromRace()
                : "DNF"
        case "PERSONAL_INTERVAL":
            return result.isValidFinish()
                ? formatPI(calculatePIFromPersonalHandicap(result.getBoatClass().getPY(), result.getPersonalHandicapFromRace()))
                : "DNF"
        case "PERSONAL_INTERVAL_FROM_PH":
            return formatPI(calculatePIFromPersonalHandicap(result.getRollingPersonalHandicapBeforeRace(), result.getPersonalHandicapFromRace()));
        case "CLASS_CORRECTED_TIME":
            return result.isValidFinish()
                ? formatMinutesSeconds(secondsToMinutesSeconds(result.getClassCorrectedTime()))
                : "DNF"
        case "FINISH_TIME":
            return result.isValidFinish()
                ? formatMinutesSeconds(secondsToMinutesSeconds(result.getFinishTime()))
                : "DNF"
        case "LAPS":
            return result.getLaps();
        default:
            return dimension;
    }
}

function ResultListItem({ result, position, toggleDimension1, toggleDimension2, toggleDimension3, dimension1, dimension2, dimension3 }) {
    return <>
        <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"} marginBottom={"5px"} backgroundColor="white">
            <Flex>
                <Grid
                    templateColumns='repeat(16, 1fr)'
                    gap={3}
                    width={"100%"}>
                    <ResultDimension colSpan={1}>{position}</ResultDimension>
                    <ResultDimension colSpan={6} onClick={toggleDimension1}>{getDimensionValue(dimension1, result)}</ResultDimension>
                    <ResultDimension colSpan={6} onClick={toggleDimension2}>{getDimensionValue(dimension2, result)}</ResultDimension>
                    <ResultDimension colSpan={3} onClick={toggleDimension3}>{getDimensionValue(dimension3, result)}</ResultDimension>
                </Grid>
            </Flex>
        </Box>
    </>
}

function OODListItem({ ood }) {
    const helmName = Result.getHelmId(ood);

    return (
        <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"} backgroundColor="white" >
            <ResultDimension colSpan={1}>{helmName}</ResultDimension>
        </Box>
    );
}

function OODView({ oods, ...props }) {
    return (
        <ResultsList {...props}>
            {oods.map((ood) =>
                <ListItem key={HelmResult.getId(ood)}>
                    <OODListItem ood={ood} />
                </ListItem>
            )}
        </ResultsList>
    );
}

function ResultsList({ children, isDisabled, ...props }) {
    return (
        <Box {...props}>
            <List spacing="5px">
                {children}
            </List>
        </Box>
    )
}

export default function RaceResultsView({ results, oods, race, ...props }) {
    const [raceView, updateRaceView] = useState(RACE_VIEWS[0]);
    const [dimension1, toggleDimension1] = useDimensionsToggle(COLUMN_1_DIMENSIONS[raceView]);
    const [dimension2, toggleDimension2] = useDimensionsToggle(COLUMN_2_DIMENSIONS[raceView]);
    const [dimension3, toggleDimension3] = useDimensionsToggle(COLUMN_3_DIMENSIONS[raceView]);

    const [byFinishTime, byClassFinishTime, byPersonalFinishTime, correctedLaps, SCT] = useSortedResults(results, race);
    const sortedResults =
        raceView === "FINISH_TIME" ? byFinishTime.map((result, key) => [result, key + 1])
            : raceView === "CLASS_HANDICAP" ? byClassFinishTime
                : byPersonalFinishTime;

    const heading =
        raceView === "FINISH_TIME" ? "Finish times"
            : raceView === "CLASS_HANDICAP" ? `Corrected to ${correctedLaps} laps by class PY`
                : `Corrected to ${correctedLaps} laps by personal PY`;

    const buttonMsg =
        raceView === "FINISH_TIME" ? "Show results by personal handicap"
            : raceView === "CLASS_HANDICAP" ? "Show results by finish time"
                : "Show results by class handicap";

    const toggleResultsView = (event) => {
        event.preventDefault();
        updateRaceView(RACE_VIEWS[(RACE_VIEWS.indexOf(raceView) + 1) % RACE_VIEWS.length]);
    }

    return (
        <>
            <Heading marginBottom="20px" marginLeft="20px" size={"md"}>{`${heading}`}</Heading>
            <ResultsList marginBottom="20px" >
                <HeadingRow raceView={raceView} dimension1={dimension1} dimension2={dimension2} dimension3={dimension3} toggleDimension1={toggleDimension1} toggleDimension2={toggleDimension2} toggleDimension3={toggleDimension3} />
                {sortedResults.map(([result, position]) =>
                    <ListItem key={HelmResult.getId(result)}>
                        <ResultListItem
                            result={result}
                            raceView={raceView}
                            position={position}
                            dimension1={dimension1}
                            dimension2={dimension2}
                            dimension3={dimension3}
                            toggleDimension1={toggleDimension1}
                            toggleDimension2={toggleDimension2}
                            toggleDimension3={toggleDimension3} />
                    </ListItem>
                )}
            </ResultsList>
            {Boolean(oods.length) &&
                <>
                    <Heading size={"lg"} marginBottom="10px">OODs</Heading>
                    <OODView marginBottom="20px" oods={oods} />
                </>
            }

            <GreenButton onClick={toggleResultsView} autoFocus {...props}>{buttonMsg}</GreenButton>
        </>
    );
}

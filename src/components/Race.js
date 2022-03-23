import { Box, Button, Flex, Heading, List, ListItem, Text, Spacer, Grid, GridItem, useDisclosure } from "@chakra-ui/react";
import { AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter } from "@chakra-ui/react";

import { useNavigate, useParams } from "react-router-dom";
import React, { useState } from "react";

import { useAppState, useServices } from "../useAppState";
import { getURLDate, parseURLDate, useBack } from "../common";
import StoreRace from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";
import Result from "../store/types/Result";
import { calculatePIFromPersonalHandicap } from "../common/personalHandicapHelpers.js";

import { BackButton, GreenButton, RedButton, BlueButton } from "./Buttons";

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
    const pad = (v) => `0${Math.round(v)}`.slice(-2);
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
            return formatMinutesSeconds(secondsToMinutesSeconds(result.getPersonalCorrectedFinishTime()));
        case "PERSONAL_HANDICAP_RESULT":
            return result.getPersonalHandicapFromRace();
        case "PERSONAL_INTERVAL":
            return formatPI(calculatePIFromPersonalHandicap(result.getBoatClass().getPY(), result.getPersonalHandicapFromRace()));
        case "PERSONAL_INTERVAL_FROM_PH":
            return formatPI(calculatePIFromPersonalHandicap(result.getRollingPersonalHandicapBeforeRace(), result.getPersonalHandicapFromRace()));
        case "CLASS_CORRECTED_TIME":
            return formatMinutesSeconds(secondsToMinutesSeconds(result.getClassCorrectedTime()));
        case "FINISH_TIME":
            return formatMinutesSeconds(secondsToMinutesSeconds(result.getFinishTime()));
        case "LAPS":
            return result.getLaps();
        default:
            return dimension;
    }
}

function ResultListItem({ result, position, toggleDimension1, toggleDimension2, toggleDimension3, dimension1, dimension2, dimension3 }) {
    return <>
        <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"}>
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

function RegisteredListItem({ registered, onClick }) {
    const helmName = Result.getHelmId(registered);
    const boatClass = formatBoatClass(registered.getBoatClass().getClassName());
    const sailNumber = registered.getSailNumber();

    return <>
        <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"} onClick={onClick}>
            <Flex>
                <Grid
                    templateColumns='repeat(3, 1fr)'
                    gap={5}
                    width={"100%"}>
                    <ResultDimension colSpan={1}>{helmName}</ResultDimension>
                    <ResultDimension colSpan={1}>{boatClass}</ResultDimension>
                    <ResultDimension colSpan={1}>{sailNumber}</ResultDimension>
                </Grid>
            </Flex>
        </Box>
    </>
}

function AlertDialogExample({ children, deleteHeading, deleteBody, onConfirm }) {
    const cancelRef = React.useRef();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const onDelete = () => {
        onClose();
        onConfirm();
    }

    return (
        <>
            <Box onClick={onOpen}>
                {children}
            </Box>
            <>
                <AlertDialog
                    isOpen={isOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={onClose}
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                                {deleteHeading}
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                Are you sure? This action cannot be undone.
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button colorScheme='red' onClick={onDelete} ml={3}>
                                    Delete
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            </>
        </>
    )
}

function DeleteFinisher({ finisher, children }) {
    const [, updateAppState] = useAppState();

    const deleteFinisher = () => {
        updateAppState(({ results, ...state }) => ({
            ...state,
            results: results.filter((result) => HelmResult.getId(result) !== HelmResult.getId(finisher)),
        }));
    };

    return (
        <AlertDialogExample onConfirm={() => deleteFinisher()} deleteHeading={`Delete result for ${HelmResult.getHelmId(finisher)}.`}>
            {children}
        </AlertDialogExample >
    )
}


function DeleteOOD({ ood, children }) {
    const [, updateAppState] = useAppState();

    const deleteOOD = () => {
        updateAppState(({ oods, ...state }) => ({
            ...state,
            oods: oods.filter((prev) => HelmResult.getId(prev) !== HelmResult.getId(ood)),
        }));
    };

    return (
        <AlertDialogExample onConfirm={() => deleteOOD()} deleteHeading={`Delete OOD: ${HelmResult.getHelmId(ood)}.`}>
            {children}
        </AlertDialogExample >
    )
}

function OODListItem({ ood }) {
    const helmName = Result.getHelmId(ood);

    return <>
        <DeleteOOD ood={ood} >
            <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"}>
                <ResultDimension colSpan={1}>{helmName}</ResultDimension>
            </Box>
        </DeleteOOD>
    </>
}


function FinisherListItem({ result }) {
    const helmName = Result.getHelmId(result);
    const boatClass = formatBoatClass(result.getBoatClass().getClassName());
    const sailNumber = result.getSailNumber();
    const finishTime = formatMinutesSeconds(secondsToMinutesSeconds(result.getFinishTime()));
    const laps = result.getLaps();

    return <>
        <DeleteFinisher finisher={result} >
            <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"}>
                <Flex>
                    <Grid
                        templateColumns='repeat(3, 1fr)'
                        gap={3}
                        width={"100%"}>
                        <ResultDimension colSpan={1}>{helmName}</ResultDimension>
                        <ResultDimension colSpan={1}>{`${boatClass}, ${sailNumber}`}</ResultDimension>
                        <ResultDimension colSpan={1}>{`${laps} lap${laps > 1 ? "s" : ""} in ${finishTime}`}</ResultDimension>
                    </Grid>
                </Flex>
            </Box>
        </DeleteFinisher>
    </>
}


function useSortedResults(results, race) {
    const services = useServices();
    const [raceFinish] = useState(
        () => services.getRaceFinishForResults(race, results),
        [],
    );

    return [
        raceFinish.getCorrectedResults().sort((a, b) => b.sortByFinishTimeDesc(a)),
        raceFinish.getClassCorrectedPointsByResult(),
        raceFinish.getPersonalCorrectedPointsByResult(),
        raceFinish.getMaxLaps(),
        raceFinish.getSCT(),
    ];
}

function useDimensionsToggle(dimensions) {
    const [dimensionCounter, updateDimensionCounter] = useState(0);
    return [dimensions[dimensionCounter % dimensions.length], () => updateDimensionCounter(dimensionCounter + 1)];
}

function RaceResultsView({ results, race, ...props }) {
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
                        <ResultListItem result={result} raceView={raceView} position={position} dimension1={dimension1} dimension2={dimension2} dimension3={dimension3} toggleDimension1={toggleDimension1} toggleDimension2={toggleDimension2} toggleDimension3={toggleDimension3} />
                    </ListItem>
                )}
            </ResultsList>
            <GreenButton onClick={toggleResultsView} autoFocus {...props}>{buttonMsg}</GreenButton>
        </>
    );
}

function RegisteredView({ registered, ...props }) {
    const navigateTo = useNavigate();
    return (
        <ResultsList {...props}>
            {registered.map((registeredHelm) =>
                <ListItem key={HelmResult.getId(registeredHelm)}>
                    <RegisteredListItem registered={registeredHelm} onClick={() => navigateTo(`register/${HelmResult.getHelmId(registeredHelm)}`)} />
                </ListItem>
            )}
        </ResultsList>
    );
}

function FinisherView({ results, ...props }) {
    return (
        <ResultsList {...props}>
            {results.map((result) =>
                <ListItem key={HelmResult.getId(result)}>
                    <FinisherListItem result={result} />
                </ListItem>
            )}
        </ResultsList>
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

function ResultsList({ children, ...props }) {
    return (
        <Box {...props}>
            <List spacing="5px">
                {children}
            </List>
        </Box>
    )
}

export default function Race() {
    const navigateTo = useNavigate();
    const navigateBack = useBack();
    const [appState, updateAppState] = useAppState();
    const params = useParams();
    const raceDateStr = params["raceDate"];
    const raceNumberStr = params["raceNumber"];
    const raceDate = parseURLDate(raceDateStr);
    const raceNumber = parseInt(raceNumberStr);
    const race = new StoreRace(raceDate, raceNumber);
    const services = useServices();
    const [raceIsMutable, setRaceIsMutable] = useState(() => services.isRaceMutable(raceDate, raceNumber));
    const [editingRace, updateEditingRace] = useState(() => raceIsMutable)
    const [committingResults, setCommittingResults] = useState(false);

    const raceResults = appState.results.filter((result) => Result.getRaceId(result) === StoreRace.getId(race));
    const raceRegistered = appState.registered.filter((result) => Result.getRaceId(result) === StoreRace.getId(race));
    const oods = appState.oods.filter((ood) => Result.getRaceId(ood) === StoreRace.getId(race));

    const formatRaceNumber = (raceNumber) => ["1st", "2nd", "3rd"][raceNumber - 1];
    const commitResults = () => {
        setCommittingResults(true);
        services
            .commitFleetResultsForRace(race, raceResults, oods)
            .catch((err) => console.log(err))
            .then(() =>
                updateAppState(({ results, ...state }) => ({
                    ...state,
                    results: results.filter((result) => !raceResults.includes(result)),
                }))
            )
            .then(() => updateEditingRace(false))
            .then(() => setRaceIsMutable(services.isRaceMutable(raceDate, raceNumber)))
            .then(() => setCommittingResults(false));
        console.log("Commit results");
    };

    return (
        <>
            <Flex direction="column" margin="5px">
                <Box marginTop="20px" />
                {/* <Center width="100%"> */}
                <Flex direction="row" marginBottom="20px">
                    <Heading size={"lg"} marginLeft="20px">{`${getURLDate(raceDate).replace(/-/g, "/")}`}</Heading>
                    <Spacer width="50px" />
                    <Heading size={"lg"} marginRight="20px">{`${formatRaceNumber(raceNumber)} race`}</Heading>
                </Flex>
                {/* </Center> */}
                {raceIsMutable && editingRace &&
                    <>
                        <BackButton>Back to races</BackButton>
                        <GreenButton onClick={() => navigateTo("ood")}>Register OOD</GreenButton>
                        <Flex direction="column" marginBottom="20px">
                            <GreenButton onClick={() => navigateTo("register")} autoFocus>Register Helm</GreenButton>
                        </Flex>
                        {Boolean(raceRegistered.length) &&
                            <>
                                <Heading size={"lg"} marginBottom="10px">Registered</Heading>
                                <RegisteredView marginBottom="20px" registered={raceRegistered} />
                            </>
                        }
                        {Boolean(raceResults.length) &&
                            <>
                                <Heading size={"lg"} marginBottom="10px">Finishers</Heading>
                                <FinisherView marginBottom="20px" results={raceResults} />
                            </>
                        }
                        {Boolean(oods.length) &&
                            <>
                                <Heading size={"lg"} marginBottom="10px">OODs</Heading>
                                <OODView marginBottom="20px" oods={oods} isDisabled={committingResults} />
                            </>
                        }
                    </>
                }
                {raceIsMutable && !editingRace && Boolean(raceResults.length) &&
                    <>
                        <RedButton
                            onClick={() => updateEditingRace(true)}
                            isDisabled={committingResults}
                        >Edit results</RedButton>
                        <BlueButton
                            onClick={() => commitResults()}
                            isLoading={committingResults}
                            loadingText='Committing Results'
                        >Commit results</BlueButton>
                        <RaceResultsView results={raceResults} race={race} isDisabled={committingResults} />

                        {Boolean(oods.length) &&
                            <>
                                <Heading size={"lg"} marginBottom="10px">OODs</Heading>
                                <OODView marginBottom="20px" oods={oods} isDisabled={committingResults} />
                            </>
                        }
                    </>
                }
                {!raceIsMutable &&
                    <>
                        <BackButton>Back to races</BackButton>
                        <RaceResultsView race={race} />
                    </>
                }
                {editingRace && !raceRegistered.length && raceResults.length > 2 &&
                    <GreenButton onClick={() => updateEditingRace(false)} autoFocus>View Results</GreenButton>
                }
            </Flex>
        </>
    )
}

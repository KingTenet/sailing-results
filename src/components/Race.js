import { Box, Button, Flex, Heading, List, Text, Spacer, Grid, GridItem, useDisclosure, Portal } from "@chakra-ui/react";
import {
    AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from "@chakra-ui/react";

import { useNavigate, useParams } from "react-router-dom";
import React, { useRef, useState } from "react";

import { useAppState, useServices } from "../useAppState";
import { getURLDate, parseURLDate, useBack } from "../common";
import StoreRace from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";
import Result from "../store/types/Result";
import RaceResultsView from "./RaceResultsView";

import { BackButton, GreenButton, RedButton, BlueButton } from "./Buttons";
import { DroppableContext, DroppableList } from "./Droppable";

import Helm from "../store/types/Helm";
import { DeleteIcon } from "@chakra-ui/icons";

const BASE_DROPPABLE_STYLE = {
    backgroundColor: "lightBlue",
    borderRadius: "12px",
    borderColor: "DarkSlateGray",
    borderWidth: "0px 0px 0px 0px",
    padding: "10px 2px 10px 2px",
    borderStyle: "solid",
    marginBottom: "10px",
    // margin: "0px 0px 10px 0px",
};

const DEFAULT_DROPPABLE_HIGHLIGHT_STYLE = {
    backgroundColor: "lightBlue",
    borderColor: "darkGreen",
    borderStyle: "dashed",
    borderWidth: "2px 2px 2px 2px",
    padding: "8px 0px 8px 0px",
}

function getDroppableStyleForHighlight(
    highlightStyles = DEFAULT_DROPPABLE_HIGHLIGHT_STYLE,
    baseStyle = BASE_DROPPABLE_STYLE
) {
    return (isDraggingOver) => {
        if (!isDraggingOver) {
            return {
                ...BASE_DROPPABLE_STYLE,
                ...baseStyle,
            };
        }

        return {
            ...BASE_DROPPABLE_STYLE,
            ...baseStyle,
            ...DEFAULT_DROPPABLE_HIGHLIGHT_STYLE,
            ...highlightStyles,
        };
    }
}

const registeredGetDroppableStyle = getDroppableStyleForHighlight({

}, {
    ...BASE_DROPPABLE_STYLE,
    backgroundColor: "lightBlue",
});

const defaultGetDroppableStyle = getDroppableStyleForHighlight({
    backgroundColor: "lightGreen",
    borderStyle: "dashed",
    borderWidth: "2px",
    // borderRadius: "10px",
    borderColor: "darkGreen",
}, {
    ...BASE_DROPPABLE_STYLE,
    backgroundColor: "lightGreen",
});

const deleteGetDroppableStyle = getDroppableStyleForHighlight({
    backgroundColor: "pink",
    borderStyle: "dashed",
    borderWidth: "2px",
    // borderRadius: "10px",
    borderColor: "red",
}, {
    ...BASE_DROPPABLE_STYLE,
    minHeight: "52px",
    backgroundColor: "pink",
});
const dnfGetDroppableStyle = getDroppableStyleForHighlight({
    backgroundColor: "#ffc680",
    borderStyle: "dashed",
    borderWidth: "2px",
    // borderRadius: "10px",
    borderColor: "DarkOrange",
}, {
    ...BASE_DROPPABLE_STYLE,
    backgroundColor: "#ffc680",
    // borderColor: "DarkOrange",
});

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

function formatFleetPursuit(isPursuitRace) {
    return isPursuitRace ? "pursuit" : "fleet";
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

function AlertDialogWrapper
    ({ children, deleteHeading, onConfirm, confirmButtonText = "Delete" }) {
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
                                    {confirmButtonText}
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
        <AlertDialogWrapper
            onConfirm={() => deleteFinisher()} deleteHeading={`Delete result for ${HelmResult.getHelmId(finisher)}.`}>
            {children}
        </AlertDialogWrapper>
    )
}

// function DeleteRegistered({ registeredToDelete, children }) {
//     const [, updateAppState] = useAppState();

//     const deleteRegistered = () => {
//         updateAppState(({ registered, ...state }) => ({
//             ...state,
//             registered: registered.filter((prev) => HelmResult.getId(prev) !== HelmResult.getId(registeredToDelete)),
//         }));
//     };

//     return (
//         <AlertDialogWrapper
//             onConfirm={() => deleteRegistered()} deleteHeading={`Delete registered helm: ${HelmResult.getHelmId(registeredToDelete)}.`}>
//             {children}
//         </AlertDialogWrapper>
//     )
// }

function DeleteOOD({ ood, children }) {
    const [, updateAppState] = useAppState();

    const deleteOOD = () => {
        updateAppState(({ oods, ...state }) => ({
            ...state,
            oods: oods.filter((prev) => HelmResult.getId(prev) !== HelmResult.getId(ood)),
        }));
    };

    return (
        <AlertDialogWrapper
            onConfirm={() => deleteOOD()} deleteHeading={`Delete OOD: ${HelmResult.getHelmId(ood)}.`}>
            {children}
        </AlertDialogWrapper>
    )
}

function ListItemWrapper({ children, ...props }) {
    return <>
        <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"} backgroundColor="white" {...props}>
            <Flex>
                {children}
            </Flex>

        </Box>
        <Box height={"3px"}></Box>
    </>
}

function RegisteredListItem({ registered, onClick }) {
    const helmName = Result.getHelmId(registered);
    const boatClass = formatBoatClass(registered.getBoatClass().getClassName());
    const sailNumber = registered.getSailNumber();

    return (
        <ListItemWrapper onClick={onClick}>
            <Grid
                templateColumns='repeat(3, 1fr)'
                gap={5}
                width={"100%"}>
                <ResultDimension colSpan={1}>{helmName}</ResultDimension>
                <ResultDimension colSpan={1}>{boatClass}</ResultDimension>
                <ResultDimension colSpan={1}>{sailNumber}</ResultDimension>
            </Grid>
        </ListItemWrapper>
    );
}

function PursuitFinishListItem({ result, index }) {
    const helmName = Result.getHelmId(result);
    const boatClass = formatBoatClass(result.getBoatClass().getClassName());
    const sailNumber = result.getSailNumber();

    return (
        <DeleteFinisher finisher={result} >
            <ListItemWrapper>
                <Grid
                    templateColumns='repeat(16, 1fr)'
                    gap={3}
                    width={"100%"}>
                    <ResultDimension colSpan={1}>{index + 1}</ResultDimension>
                    <ResultDimension colSpan={6}>{helmName}</ResultDimension>
                    <ResultDimension colSpan={6}>{boatClass}</ResultDimension>
                    <ResultDimension colSpan={3}>{sailNumber}</ResultDimension>
                </Grid>
            </ListItemWrapper>
        </DeleteFinisher>
    )
}

function OODListItem({ ood }) {
    const helmName = Result.getHelmId(ood);

    return (
        <DeleteOOD ood={ood} >
            <ListItemWrapper>
                <Grid templateColumns='repeat(1, 1fr)'>
                    <ResultDimension colSpan={1}>{helmName}</ResultDimension>
                </Grid>
            </ListItemWrapper>
        </DeleteOOD>
    )
}


function FinisherListItem({ result }) {
    const helmName = Result.getHelmId(result);
    const boatClass = formatBoatClass(result.getBoatClass().getClassName());
    const sailNumber = result.getSailNumber();
    const finishTime = formatMinutesSeconds(secondsToMinutesSeconds(result.getFinishTime()));
    const laps = result.getLaps();
    const validFinish = result.isValidFinish();

    return <>
        <DeleteFinisher finisher={result} >
            <ListItemWrapper>
                <Grid
                    templateColumns='repeat(17, 1fr)'
                    gap={3}
                    width={"100%"}>
                    <ResultDimension colSpan={6}>{helmName}</ResultDimension>
                    <ResultDimension colSpan={5}>{`${sailNumber}, ${boatClass}`}</ResultDimension>
                    {validFinish && <ResultDimension colSpan={6}>{`${laps} lap${laps > 1 ? "s" : ""} in ${finishTime}`}</ResultDimension>}
                    {!validFinish && <ResultDimension colSpan={6}>{"DNF"}</ResultDimension>}
                </Grid>
            </ListItemWrapper>
        </DeleteFinisher>
    </>
}

function DraggableView({ registered, results, oods, isPursuitRace, portalRef }) {
    const navigateTo = useNavigate();
    const finished = results.filter((result) => result.finishCode.validFinish());
    const dnf = results.filter((result) => !result.finishCode.validFinish());

    const WrappedRegisteredListItem = ({ item }) =>
        <RegisteredListItem
            registered={item}
            onClick={() => navigateTo(`fleetFinish/${HelmResult.getHelmId(item)}`)}
        />

    const WrappedFinisherListItem = ({ item }) => <FinisherListItem result={item} />
    const WrappedOODListItem = ({ item }) => <OODListItem ood={item} />
    const WrappedPursuitFinishListItem = ({ item, index }) => <PursuitFinishListItem result={item} index={index} />

    return (
        <DraggableFinishView
            PursuitFinishListItem={WrappedPursuitFinishListItem}
            pursuitFinishes={registered}
            RegisteredListItem={WrappedRegisteredListItem}
            registered={registered}
            FinishedListItem={WrappedFinisherListItem}
            finished={finished}
            DNFListItem={WrappedFinisherListItem}
            dnf={dnf}
            OODListItem={WrappedOODListItem}
            oods={oods}
            isPursuitRace={isPursuitRace}
            portalRef={portalRef}
        />
    );
}


function DroppableHeader({ isDraggingOver, heading }) {
    return (
        <Flex direction="row">
            <Text paddingLeft="10px" fontSize="20px">{heading}</Text>
        </Flex>
    );
}

function RegisteredDroppableHeader({ isDraggingOver }) {
    return <DroppableHeader heading={"Registered"} isDraggingOver={isDraggingOver} />;
}

function FinishedDroppableHeader({ isDraggingOver }) {
    return <DroppableHeader heading={"Finished"} isDraggingOver={isDraggingOver} />;
}

function OODDroppableHeader({ isDraggingOver }) {
    return <DroppableHeader heading={"OODs"} isDraggingOver={isDraggingOver} />;
}

function DNFDroppableHeader({ isDraggingOver, listItems }) {
    return (
        <Flex direction="row">
            <Text paddingLeft="10px" fontSize="20px">DNF</Text>
            {listItems && !Boolean(listItems.length)
                && <Text fontSize="15px" marginTop="5px" marginLeft="80px">Drag any non-finishers here!</Text>
            }
        </Flex>
    );
}

function DeleteDroppableHeader({ isDraggingOver, placeholder }) {
    if (placeholder) {
        return (
            <Flex direction="row">
                <Box boxSize="2em" />
                <Spacer />
                <Text paddingLeft="20px" fontSize="20px">{" "}</Text>
                <Spacer />
                <Box boxSize="2em" />
            </Flex>
        );
    }

    return (
        <Flex direction="row">
            <DeleteIcon boxSize="2em" />
            <Spacer />
            <Text paddingLeft="20px" fontSize="20px">Drag to delete</Text>
            <Spacer />
            <DeleteIcon boxSize="2em" />
        </Flex>
    );
}

function WrappedDroppableList({ item, ...props }) {
    return <DroppableList getId={(item) => HelmResult.getId(item)} {...props} />
}

function DraggableFinishView({ PursuitFinishListItem, pursuitFinishes, RegisteredListItem, registered, FinishedListItem, finished = [], dnf, OODListItem, oods, isPursuitRace, portalRef }) {
    const [draggingRegistered, setIsDraggingRegistered] = useState(false);
    const [draggingFinisher, setIsDraggingFinisher] = useState(false);
    const [draggingOOD, setIsDraggingOOD] = useState(false);

    const renderingDeleteDropZone = draggingRegistered || draggingFinisher || draggingOOD;

    return (
        <>
            {isPursuitRace &&
                <DroppableContext setIsDragging={setIsDraggingRegistered}>
                    {pursuitFinishes && Boolean(pursuitFinishes.length) &&
                        <WrappedDroppableList
                            droppableId={"pursuitFinishes"}
                            listItems={pursuitFinishes}
                            DraggableListItem={PursuitFinishListItem}
                            getDroppableStyle={defaultGetDroppableStyle}
                            DroppableHeader={FinishedDroppableHeader}
                        />
                    }
                    {(registered && Boolean(registered.length) || (dnf && Boolean(dnf.length))) &&
                        <WrappedDroppableList
                            droppableId={"dnf"}
                            listItems={dnf}
                            DraggableListItem={FinishedListItem}
                            getDroppableStyle={dnfGetDroppableStyle}
                            DroppableHeader={DNFDroppableHeader}
                        />
                    }
                    {draggingRegistered &&
                        <WrappedDroppableList
                            droppableId={"deleteRegistered"}
                            getDroppableStyle={deleteGetDroppableStyle}
                            DroppableHeader={DeleteDroppableHeader}
                        />
                    }
                </DroppableContext>
            }
            {!isPursuitRace &&
                <>
                    <DroppableContext setIsDragging={setIsDraggingRegistered}>
                        {registered && Boolean(registered.length) &&
                            <WrappedDroppableList
                                droppableId={"registered"}
                                listItems={registered}
                                DraggableListItem={RegisteredListItem}
                                getDroppableStyle={registeredGetDroppableStyle}
                                DroppableHeader={RegisteredDroppableHeader}
                                isDropDisabled={true}
                            />
                        }
                        {(registered && Boolean(registered.length) || (dnf && Boolean(dnf.length))) &&
                            <WrappedDroppableList
                                droppableId={"dnf"}
                                listItems={dnf}
                                DraggableListItem={FinishedListItem}
                                getDroppableStyle={dnfGetDroppableStyle}
                                DroppableHeader={DNFDroppableHeader}
                            />
                        }
                        {draggingRegistered &&
                            <WrappedDroppableList
                                droppableId={"deleteRegistered"}
                                getDroppableStyle={deleteGetDroppableStyle}
                                DroppableHeader={DeleteDroppableHeader}
                            />
                        }
                    </DroppableContext>
                    <DroppableContext setIsDragging={setIsDraggingFinisher}>
                        {finished && Boolean(finished.length) &&
                            <WrappedDroppableList
                                droppableId={"finished"}
                                listItems={finished}
                                DraggableListItem={FinishedListItem}
                                getDroppableStyle={defaultGetDroppableStyle}
                                DroppableHeader={FinishedDroppableHeader}
                            />
                        }
                        {(draggingFinisher) &&
                            <WrappedDroppableList
                                droppableId={"deleteFinisher"}
                                getDroppableStyle={deleteGetDroppableStyle}
                                DroppableHeader={DeleteDroppableHeader}
                            />
                        }
                    </DroppableContext>
                </>
            }
            <DroppableContext setIsDragging={setIsDraggingOOD}>
                {oods && Boolean(oods.length) &&
                    <WrappedDroppableList
                        droppableId={"oods"}
                        listItems={oods}
                        DraggableListItem={OODListItem}
                        getDroppableStyle={defaultGetDroppableStyle}
                        DroppableHeader={OODDroppableHeader}
                    />
                }
                {draggingOOD &&
                    <WrappedDroppableList
                        droppableId={"deleteOOD"}
                        getDroppableStyle={deleteGetDroppableStyle}
                        DroppableHeader={DeleteDroppableHeader}
                    />
                }
            </DroppableContext>
            {!renderingDeleteDropZone &&
                <Box style={{ ...deleteGetDroppableStyle(), backgroundColor: "inherit" }} hidden={false}>
                    <DeleteDroppableHeader placeholder={true} />
                </Box>
            }
        </>
    );
}

export default function Race() {
    const portalRef = useRef();
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
    const committingResultsStarted = () => {
        setCommittingResults(true);
    };

    const committingResultsSuccess = () => {
        updateEditingRace(false);
        setRaceIsMutable(services.isRaceMutable(raceDate, raceNumber));
        setCommittingResults(false);
    };

    const committingResultsFailed = () => {
        throw new Error("Failed to commit results to store");
    };

    const updatePursuitPositions = (newRegistered) => {
        updateAppState(({ registered, ...state }) => ({
            ...state,
            registered: newRegistered,
        }));
    }

    const setIsPursuitRace = (value) => {
        updateAppState(({ isPursuitRace, ...state }) => ({
            ...state,
            isPursuitRace: value,
        }))
    }

    function Wrapped({ children }) {
        return (
            <Box bg="blue.50" minHeight="100vh" margin="0">
                <Flex direction="column" minHeight="80vh" alignItems>
                    <Flex direction="row" marginTop="20px" marginBottom="20px">
                        <Heading size={"lg"} marginLeft="20px">{`${getURLDate(raceDate).replace(/-/g, "/")}`}</Heading>
                        <Spacer width="50px" />
                        <Heading size={"lg"} marginRight="20px">{`${formatRaceNumber(raceNumber)} ${formatFleetPursuit(appState.isPursuitRace)} race`}</Heading>
                    </Flex>
                    {children}
                    <BackButton disabled={committingResults}>Back to races</BackButton>
                </Flex>
            </Box>
        )
    }

    if (editingRace) {
        return (
            <Wrapped>
                <DraggableView registered={raceRegistered} results={raceResults} oods={oods} isPursuitRace={appState.isPursuitRace} portalRef={portalRef} />
                <Box marginTop="20px" />
                {!raceRegistered.length && raceResults.length > 2 &&
                    <GreenButton onClick={() => updateEditingRace(false)} autoFocus>View Results</GreenButton>
                }
                <Spacer />
                <GreenButton onClick={() => navigateTo("ood")}>Register OOD</GreenButton>
                <GreenButton onClick={() => navigateTo("register")} autoFocus>Register Helm</GreenButton>
                {!Boolean(raceResults.length) &&
                    <>
                        {!appState.isPursuitRace && <BlueButton onClick={() => setIsPursuitRace(true)}>Change to pursuit race</BlueButton>}
                        {appState.isPursuitRace && <BlueButton onClick={() => setIsPursuitRace(false)}>Change to fleet race</BlueButton>}
                    </>
                }
            </Wrapped>
        );
    }
    else {
        return <Wrapped>
            {/* {Boolean(raceResults.length) &&
                <>
                    <CommitResultsDialog race={race} onSuccess={committingResultsSuccess} onFailed={committingResultsFailed} onStarted={committingResultsStarted} >
                        <BlueButton
                            onClick={(event) => event.preventDefault()}
                            isLoading={committingResults}
                            loadingText='Committing Results'
                            style={{ width: "100%" }}
                        >Commit results</BlueButton>
                    </CommitResultsDialog>
                </>
            } */}
            <RaceResultsView results={raceResults} oods={oods} race={race} isDisabled={committingResults} raceIsMutable={raceIsMutable} />
            <Spacer />
            <RedButton onClick={() => updateEditingRace(true)} isDisabled={committingResults}>Edit results</RedButton>
        </Wrapped>
    }
}

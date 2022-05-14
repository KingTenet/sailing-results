import { Box, Collapse, Flex, Heading, Spacer } from "@chakra-ui/react";

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
import { RegisteredListItem, FinisherListItem, OODListItem, PursuitFinishListItem } from "./ListItems";
import { RegisteredCard, DeleteCard, DNFCard, FinishersCard, PlaceholderCard } from "./Cards";
import { RegisteredDroppableHeader, DeleteDroppableHeader, DNFDroppableHeader, FinishedDroppableHeader, OODDroppableHeader } from "./CardHeaders";
import MutableRaceResult from "../store/types/MutableRaceResult";
import CommitResultsDialog from "./CommitResultsDialog";

function formatFleetPursuit(isPursuitRace) {
    return isPursuitRace ? "pursuit" : "fleet";
}

function WrappedDroppableList({ item, isOpen, ...props }) {
    return <DroppableList getId={(item) => HelmResult.getId(item)} {...props} />
}

function DraggableFinishView({
    PursuitFinishListItem,
    RegisteredListItem,
    registered,
    FinishedListItem,
    finished = [],
    dnf,
    OODListItem,
    oods,
    isPursuitRace,
    onDragCompleted
}) {
    const [draggingRegistered, setIsDraggingRegistered] = useState(false);
    const [draggingFinisher, setIsDraggingFinisher] = useState(false);
    const [draggingOOD, setIsDraggingOOD] = useState(false);

    const pursuitFinishes = registered;

    const renderingDeleteDropZone = draggingRegistered || draggingFinisher || draggingOOD;

    const onDragEnd = (result) => {
        const insertItem = (newItem, index, items) => [...items.slice(0, index), newItem, ...items.slice(index)];
        const deleteItem = (index, items) => [...items.slice(0, index), ...items.slice(index + 1)];

        const { source, destination } = result;

        if (!destination ||
            (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return;
        }

        let newRegistered = registered;
        let newFinished = finished;
        let newDNF = dnf;
        let newOODs = oods;

        const actOnRegistered = (action) => newRegistered = action(newRegistered);
        const actOnDNF = (action) => newDNF = action(newDNF);
        const actOnFinished = (action) => newFinished = action(newFinished);
        const actOnOOD = (action) => newOODs = action(newOODs);

        const droppableActor = {
            "pursuitFinishes": actOnRegistered,
            "registered": actOnRegistered,
            "dnf": actOnDNF,
            "pursuitDNF": actOnDNF,
            "finished": actOnFinished,
            "oods": actOnOOD,
        };

        const sourceActor = droppableActor[source.droppableId];
        const destinationActor = droppableActor[destination.droppableId];

        if (!sourceActor) {
            throw new Error("Unknown droppableId " + source.droppableId);
        }

        if (destination.droppableId !== "delete" && !destinationActor) {
            throw new Error("Unknown droppableId " + destination.droppableId);
        }

        if (destination.droppableId === "delete") {
            // Just need to modify source...
            sourceActor((items) => deleteItem(source.index, items));
        }
        else {
            let deletedItem;
            sourceActor((items) => {
                deletedItem = items[source.index];
                return deleteItem(source.index, items);
            });
            destinationActor((items) => insertItem(deletedItem, destination.index, items))
        }

        return onDragCompleted(newRegistered, newFinished, newDNF, newOODs);
    };
    return (
        <>
            {isPursuitRace &&
                <DroppableContext setIsDragging={setIsDraggingRegistered} onDragEnd={onDragEnd}>
                    {pursuitFinishes && Boolean(pursuitFinishes.length) &&
                        <WrappedDroppableList
                            droppableId={"pursuitFinishes"}
                            listItems={pursuitFinishes}
                            DraggableListItem={PursuitFinishListItem}
                            DroppableContainer={FinishersCard}
                            DroppableHeader={FinishedDroppableHeader}
                        />
                    }
                    {(registered && Boolean(registered.length) || (dnf && Boolean(dnf.length))) &&
                        <WrappedDroppableList
                            droppableId={"pursuitDNF"}
                            listItems={dnf}
                            DraggableListItem={FinishedListItem}
                            DroppableContainer={DNFCard}
                            DroppableHeader={DNFDroppableHeader}
                        />
                    }
                    {draggingRegistered &&
                        <WrappedDroppableList
                            droppableId={"delete"}
                            DroppableContainer={DeleteCard}
                            DroppableHeader={DeleteDroppableHeader}
                        />
                    }
                </DroppableContext>
            }
            {!isPursuitRace &&
                <>
                    <DroppableContext setIsDragging={setIsDraggingRegistered} onDragEnd={onDragEnd}>
                        {registered && Boolean(registered.length) &&
                            <WrappedDroppableList
                                droppableId={"registered"}
                                listItems={registered}
                                DraggableListItem={RegisteredListItem}
                                DroppableContainer={RegisteredCard}
                                DroppableHeader={RegisteredDroppableHeader}
                                isDropDisabled={true}
                            />
                        }
                        {(registered && Boolean(registered.length) || (dnf && Boolean(dnf.length))) &&
                            <WrappedDroppableList
                                droppableId={"dnf"}
                                listItems={dnf}
                                DraggableListItem={FinishedListItem}
                                DroppableContainer={DNFCard}
                                DroppableHeader={DNFDroppableHeader}
                            />
                        }
                        {draggingRegistered &&
                            <WrappedDroppableList
                                droppableId={"delete"}
                                DroppableContainer={DeleteCard}
                                DroppableHeader={DeleteDroppableHeader}
                            />
                        }
                    </DroppableContext>
                    <DroppableContext setIsDragging={setIsDraggingFinisher} onDragEnd={onDragEnd}>
                        {finished && Boolean(finished.length) &&
                            <WrappedDroppableList
                                droppableId={"finished"}
                                listItems={finished}
                                DraggableListItem={FinishedListItem}
                                DroppableContainer={FinishersCard}
                                DroppableHeader={FinishedDroppableHeader}
                                isDropDisabled={true}
                            />
                        }
                        {(draggingFinisher) &&
                            <WrappedDroppableList
                                droppableId={"delete"}
                                DroppableContainer={DeleteCard}
                                DroppableHeader={DeleteDroppableHeader}
                            />
                        }
                    </DroppableContext>
                </>
            }
            <DroppableContext setIsDragging={setIsDraggingOOD} onDragEnd={onDragEnd}>
                {oods && Boolean(oods.length) &&
                    <WrappedDroppableList
                        droppableId={"oods"}
                        listItems={oods}
                        DraggableListItem={OODListItem}
                        DroppableContainer={FinishersCard}
                        DroppableHeader={OODDroppableHeader}
                    />
                }
                {draggingOOD &&
                    <WrappedDroppableList
                        droppableId={"delete"}
                        DroppableContainer={DeleteCard}
                        DroppableHeader={DeleteDroppableHeader}
                    />
                }
            </DroppableContext>
            {!renderingDeleteDropZone &&
                <PlaceholderCard>
                    <DeleteDroppableHeader placeholder={true} />
                </PlaceholderCard>
            }
        </>
    );
}

function DraggableView({ registered, finished, dnf, oods, isPursuitRace, updateRaceResults }) {
    const navigateTo = useNavigate();

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
            RegisteredListItem={WrappedRegisteredListItem}
            registered={registered}
            FinishedListItem={WrappedFinisherListItem}
            finished={finished}
            DNFListItem={WrappedFinisherListItem}
            dnf={dnf}
            OODListItem={WrappedOODListItem}
            oods={oods}
            isPursuitRace={isPursuitRace}
            onDragCompleted={updateRaceResults}
        />
    );
}

export default function Race() {
    const navigateTo = useNavigate();
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
    const isPursuitRace = appState.isPursuitRace;

    const formatRaceNumber = (raceNumber) => ["1st", "2nd", "3rd"][raceNumber - 1];
    const committingResultsStarted = () => {
        setCommittingResults(true);
    };

    const committingResultsSuccess = () => {
        updateEditingRace(false);
        setRaceIsMutable(services.isRaceMutable(raceDate, raceNumber));
        setCommittingResults(false);
    };

    const committingResultsFailed = (err) => {
        console.log(err);
        throw new Error("Failed to commit results to store");
    };

    const setIsPursuitRace = (value) => {
        updateAppState(({ isPursuitRace, ...state }) => ({
            ...state,
            isPursuitRace: value,
        }))
    }

    const finished = raceResults.filter((result) => result.finishCode.validFinish());
    const dnf = raceResults.filter((result) => !result.finishCode.validFinish());

    const updateRaceResults = (newRegistered, newFinished, newDNF, newOODs) => {
        updateAppState((state) => ({
            ...state,
            registered: newRegistered.map((result) => result instanceof Result ? MutableRaceResult.fromResult(result) : result),
            results: newFinished !== finished || newDNF !== dnf
                ? [
                    ...newFinished,
                    ...newDNF.map((helmResult) => Result.fromRegistered(helmResult)),
                ]
                : raceResults,
            oods: newOODs,
        }));
    }

    function Wrapped({ children }) {
        return (
            <Box bg="blue.50" minHeight="100vh" margin="0">
                <Flex direction="column" minHeight="80vh" alignItems>
                    <Flex direction="row" marginTop="20px" marginBottom="20px">
                        <Heading size={"lg"} marginLeft="20px">{`${getURLDate(raceDate).replace(/-/g, "/")}`}</Heading>
                        <Spacer width="50px" />
                        <Heading size={"lg"} marginRight="20px">{`${formatRaceNumber(raceNumber)} ${formatFleetPursuit(isPursuitRace)} race`}</Heading>
                    </Flex>
                    {children}
                    <BackButton disabled={committingResults}>Back to races</BackButton>
                </Flex>
            </Box>
        )
    }

    const viewableRaceResults = !isPursuitRace
        ? raceResults
        : [...raceResults, ...raceRegistered.map((result, positionIndex) => Result.fromRegistered(result, positionIndex + 1))];

    if (editingRace) {
        return (
            <Wrapped>
                <DraggableView registered={raceRegistered} finished={finished} dnf={dnf} oods={oods} isPursuitRace={isPursuitRace} updateRaceResults={updateRaceResults} />
                <Box marginTop="20px" />
                {((isPursuitRace && (raceRegistered.length + raceResults.length) > 2) || (!raceRegistered.length && raceResults.length > 2)) &&
                    <GreenButton onClick={() => updateEditingRace(false)} autoFocus>View results</GreenButton>
                }
                <Spacer />
                <GreenButton onClick={() => navigateTo("ood")}>Register OOD</GreenButton>
                <GreenButton onClick={() => navigateTo("register")} autoFocus>Register Helm</GreenButton>
                {!Boolean(raceResults.filter((result) => result.finishCode.validFinish()).length) &&
                    <>
                        {!isPursuitRace && <BlueButton onClick={() => setIsPursuitRace(true)}>Change to pursuit race</BlueButton>}
                        {isPursuitRace && <BlueButton onClick={() => setIsPursuitRace(false)}>Change to fleet race</BlueButton>}
                    </>
                }
            </Wrapped>
        );
    }
    else {
        return <Wrapped>
            {Boolean(viewableRaceResults.length) &&
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
            }
            <RaceResultsView results={viewableRaceResults} oods={oods} race={race} isDisabled={committingResults} raceIsMutable={raceIsMutable} />
            <Spacer />
            {raceIsMutable &&
                <RedButton onClick={() => updateEditingRace(true)} isDisabled={committingResults}>Edit results</RedButton>
            }
        </Wrapped>
    }
}

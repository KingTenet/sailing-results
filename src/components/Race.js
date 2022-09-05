import { Box, Center, Flex, Heading, Spacer } from "@chakra-ui/react";

import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useRef } from "react";

import { useAppState, useServices } from "../useAppState";
import { getURLDate, parseURLDate, useBack } from "../common";
import StoreRace from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";
import Result from "../store/types/Result";
import RaceResultsView from "./RaceResultsView";

import { BackButton, GreenButton, BlueButton, YellowButton } from "./Buttons";
import { DroppableContext, DroppableList } from "./Droppable";
import { RegisteredListItem, FinisherListItem, OODListItem, PursuitFinishListItem, DNFListItem } from "./ListItems";
import { RegisteredCard, DeleteCard, DNFCard, FinishersCard, PlaceholderCard } from "./Cards";
import { RegisteredDroppableHeader, DeleteDroppableHeader, DNFDroppableHeader, FinishedDroppableHeader, OODDroppableHeader } from "./CardHeaders";
import MutableRaceResult from "../store/types/MutableRaceResult";
import CommitResultsDialog from "./CommitResultsDialog";
import CopyFromPreviousRace from "./CopyFromPreviousRace";

import { DeleteFinisher, DeleteOOD, DeletePursuitFinish, ResetTiming, wrapDeleteOnSwipe } from "./DeleteItems";
import BackHeader from "./BackHeader";

function formatFleetPursuit(isPursuitRace) {
    return isPursuitRace ? "pursuit" : "fleet";
}

function WrappedDroppableList({ item, isOpen, ...props }) {
    return <DroppableList getId={(item) => HelmResult.getId(item)} {...props} />
}

function WrappedList({ Header, Container, ListItem, item, isOpen, listItems, ...props }) {
    const getId = (item) => HelmResult.getId(item);

    return <Container>
        {Header && <Header listItems={listItems} />}
        {listItems.map((item, index) =>
            <Box key={getId(item)}>
                <ListItem item={item} index={index} />
            </Box>
        )}
    </Container>
}

function FinishView({
    RegisteredListItem: RegisteredListItemToUse,
    registered,
    FinishedListItem,
    DNFListItem,
    finished = [],
    dnf,
    OODListItem,
    oods,
}) {
    return (
        <>
            {registered && Boolean(registered.length) &&
                <WrappedList
                    droppableId={"registered"}
                    listItems={registered}
                    ListItem={RegisteredListItemToUse}
                    Container={RegisteredCard}
                    Header={RegisteredDroppableHeader}
                />
            }
            {dnf && Boolean(dnf.length) &&
                <WrappedList
                    droppableId={"dnf"}
                    listItems={dnf}
                    ListItem={DNFListItem}
                    Container={DNFCard}
                    Header={DNFDroppableHeader}
                />
            }
            {finished && Boolean(finished.length) &&
                <WrappedList
                    droppableId={"finished"}
                    listItems={finished}
                    ListItem={FinishedListItem}
                    Container={FinishersCard}
                    Header={FinishedDroppableHeader}
                />
            }
            {oods && Boolean(oods.length) &&
                <WrappedList
                    droppableId={"oods"}
                    listItems={oods}
                    ListItem={OODListItem}
                    Container={FinishersCard}
                    Header={OODDroppableHeader}
                />
            }
        </>
    );
}


function DraggableFinishView(props) {
    if (!props.isPursuitRace) {
        return <FinishView {...props} />;
    }

    let {
        PursuitFinishListItem,
        RegisteredListItem: RegisteredListItemToUse,
        registered,
        FinishedListItem,
        DNFListItem,
        finished = [],
        dnf,
        OODListItem,
        oods,
        isPursuitRace,
        onDragCompleted
    } = props;

    const pursuitFinishes = registered;

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
            <DroppableContext onDragEnd={onDragEnd}>
                {pursuitFinishes && Boolean(pursuitFinishes.length) &&
                    <WrappedDroppableList
                        droppableId={"pursuitFinishes"}
                        listItems={pursuitFinishes}
                        DraggableListItem={PursuitFinishListItem}
                        DroppableContainer={FinishersCard}
                        DroppableHeader={FinishedDroppableHeader}
                    />
                }
            </DroppableContext>
            {dnf && Boolean(dnf.length) &&
                <WrappedList
                    listItems={dnf}
                    ListItem={DNFListItem}
                    Container={DNFCard}
                    Header={DNFDroppableHeader}
                />
            }
            {oods && Boolean(oods.length) &&
                <WrappedList
                    droppableId={"oods"}
                    listItems={oods}
                    ListItem={OODListItem}
                    Container={FinishersCard}
                    Header={OODDroppableHeader}
                />
            }
        </>
    );
}


function DraggableView({ registered, finished, dnf, oods, isPursuitRace, updateRaceResults }) {
    const navigateTo = useNavigate();

    const onDNF = (registeredToMove) =>
        updateRaceResults(
            registered.filter((prev) => HelmResult.getId(prev) !== HelmResult.getId(registeredToMove)),
            finished,
            [...dnf, registeredToMove],
            oods
        );

    const resetFinisher = (itemToReset) => {
        updateRaceResults(
            [...registered, MutableRaceResult.fromResult(itemToReset)],
            finished.filter((prev) => HelmResult.getId(prev) !== HelmResult.getId(itemToReset)),
            dnf.filter((prev) => HelmResult.getId(prev) !== HelmResult.getId(itemToReset)),
            oods
        );

        if (!isPursuitRace) {
            navigateTo(`fleetFinish/${HelmResult.getHelmId(itemToReset)}`)
        }
    };

    const WrappedRegisteredListItem = ({ item, ...props }) => <RegisteredListItem registered={item} onDNF={() => onDNF(item)} {...props} />;
    const WrappedFinisherListItem = ({ item, ...props }) => <FinisherListItem result={item} {...props} />
    const WrappedDNFListItem = ({ item, ...props }) => <DNFListItem result={item} {...props} />
    const WrappedOODListItem = ({ item, ...props }) => <OODListItem ood={item} {...props} />
    const WrappedPursuitFinishListItem = ({ item, index, ...props }) => <PursuitFinishListItem result={item} onDNF={() => onDNF(item)} index={index} {...props} />

    return (
        <DraggableFinishView
            PursuitFinishListItem={wrapDeleteOnSwipe(DeletePursuitFinish, WrappedPursuitFinishListItem)}
            RegisteredListItem={wrapDeleteOnSwipe(DeletePursuitFinish, WrappedRegisteredListItem, (item) => ({
                onClick: () => navigateTo(`fleetFinish/${HelmResult.getHelmId(item)}`)
            }))}
            registered={registered}
            FinishedListItem={wrapDeleteOnSwipe(DeleteFinisher, WrappedFinisherListItem, undefined, resetFinisher)}
            finished={finished}
            DNFListItem={wrapDeleteOnSwipe(DeleteFinisher, WrappedDNFListItem, undefined, resetFinisher)}
            dnf={dnf}
            OODListItem={wrapDeleteOnSwipe(DeleteOOD, WrappedOODListItem)}
            oods={oods}
            isPursuitRace={isPursuitRace}
            onDragCompleted={updateRaceResults}
        />
    );
}

export default function Race({ backButtonText }) {
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
    const [isPursuitRace] = useState(() => services.isPursuitRace(race));
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
        console.log("Committing results success");
        updateEditingRace(false);
        setRaceIsMutable(services.isRaceMutable(raceDate, raceNumber));
        setCommittingResults(false);
        navigateTo("/races/");
    };

    const committingResultsFailed = (err) => {
        console.log(err);
        throw new Error("Failed to commit results to store");
    };

    const finished = raceResults.filter((result) => result.finishCode.validFinish());
    const dnf = raceResults.filter((result) => !result.finishCode.validFinish());

    const updateRaceResults = (newRegistered, newFinished, newDNF, newOODs) => {
        updateAppState(({ registered, results, oods, ...state }) => ({
            ...state,
            registered: [
                ...registered.filter((result) => Result.getRaceId(result) !== StoreRace.getId(race)),
                ...newRegistered.map((result) => result instanceof Result ? MutableRaceResult.fromResult(result) : result),
            ],
            results: [
                ...results.filter((result) => Result.getRaceId(result) !== StoreRace.getId(race)),
                ...(newFinished !== finished || newDNF !== dnf
                    ? [
                        ...newFinished,
                        ...newDNF.map((helmResult) => Result.fromRegistered(helmResult)),
                    ]
                    : raceResults),
            ],
            oods: [
                ...oods.filter((result) => Result.getRaceId(result) !== StoreRace.getId(race)),
                ...newOODs,
            ],
        }));
    }

    const viewableRaceResults = !isPursuitRace
        ? raceResults
        : [...raceResults, ...raceRegistered.map((result, positionIndex) => Result.fromRegistered(result, positionIndex + 1))];

    function Wrapped({ children }) {
        return (

            <Flex direction="column" className="device-height" alignItems={"center"}>
                {(editingRace || !raceIsMutable) &&
                    <Flex direction="row" marginTop="20px" marginBottom="20px" width="100%" style={{ overflow: "hidden" }}>
                        <Heading size={"lg"} marginLeft="20px">{`${getURLDate(raceDate).replace(/-/g, "/")}`}</Heading>
                        <Spacer />
                        <Heading size={"lg"} marginRight="20px">{`${formatRaceNumber(raceNumber)} ${formatFleetPursuit(isPursuitRace)} race`}</Heading>
                    </Flex>
                }
                {children}
                {!raceIsMutable &&
                    <BackButton disabled={committingResults}>{backButtonText}</BackButton>
                }
            </Flex>

        )
    }

    if (editingRace) {
        return (
            <>
                {!Boolean(raceRegistered.length || finished.length || dnf.length || oods.length || raceNumber === 1) &&
                    <CopyFromPreviousRace race={race} previousRace={new StoreRace(race.getDate(), race.getNumber() - 1)}></CopyFromPreviousRace>
                }
                <Wrapped>

                    <DraggableView registered={raceRegistered} finished={finished} dnf={dnf} oods={oods} isPursuitRace={isPursuitRace} updateRaceResults={updateRaceResults} />
                    <Box marginTop="20px" />
                    {((isPursuitRace && (raceRegistered.length + raceResults.length) > 2) || (!raceRegistered.length && raceResults.length > 2)) &&
                        <GreenButton onClick={() => updateEditingRace(false)} autoFocus>View results</GreenButton>
                    }
                    <Spacer />
                    <GreenButton onClick={() => navigateTo("ood")}>Register OOD</GreenButton>
                    <GreenButton onClick={() => navigateTo("register")} autoFocus>Register Helms</GreenButton>
                </Wrapped>
            </>
        );
    }
    else {
        return <Wrapped>
            {raceIsMutable &&
                <BackHeader heading={"Race results"} onClick={() => updateEditingRace(true)} />
            }
            <RaceResultsView results={viewableRaceResults} oods={oods} race={race} isDisabled={committingResults} raceIsMutable={raceIsMutable} />
            <Spacer />
            {raceIsMutable &&
                <>
                    <BlueButton onClick={() => updateEditingRace(true)} isDisabled={committingResults}>Edit results</BlueButton>
                    {Boolean(viewableRaceResults.length) &&
                        <CommitResultsDialog race={race} onSuccess={committingResultsSuccess} onFailed={committingResultsFailed} onStarted={committingResultsStarted} >
                            <Center>
                                <YellowButton
                                    onClick={(event) => event.preventDefault()}
                                    isLoading={committingResults}
                                    loadingText='Committing Results'
                                >Commit results</YellowButton>
                            </Center>
                        </CommitResultsDialog>
                    }
                </>
            }
        </Wrapped>
    }
}

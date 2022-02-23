import { Box, Button, Flex, List, ListItem, Text } from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

import { useAppState } from "../useAppState";
import { getURLDate, parseURLDate } from "../common"
import StoreRace from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";
import Helm from "../store/types/Helm";

function initialiseRaceState(services, editableRaceDate, raceDate, raceNumber) {
    const race = new StoreRace(raceDate, raceNumber);
    const userAllowedToEdit = !editableRaceDate || editableRaceDate.getTime() === raceDate.getTime();
    const raceResults = services.stores.results.all()
        .filter((result) => StoreRace.getId(result.getRace()) === StoreRace.getId(race));

    const registered = services.stores.registered.all()
        .filter((result) => StoreRace.getId(result.getRace()) === StoreRace.getId(race));

    if (!raceResults.length) {
        return {
            immutable: !userAllowedToEdit,
            registered: registered,
            results: [],
        };
    }

    return {
        immutable: !userAllowedToEdit || raceResults.some((result) => !result.hasStaleRemote()),
        registered: registered,
        results: raceResults,
        raceFinish: services.stores.raceFinishes.get(StoreRace.getId(race)),
    }
}

const RACE_VIEWS = ["PERSONAL_HANDICAP", "CLASS_HANDICAP", "FINISH_TIME"];

export default function Race() {
    const navigateTo = useNavigate();
    const [appState] = useAppState();
    const [raceState, updateRaceState] = useState();
    const [raceView, updateRaceView] = useState(RACE_VIEWS[0]);
    const params = useParams();
    const raceDateStr = params["raceDate"];
    const raceNumberStr = params["raceNumber"];
    const raceDate = parseURLDate(raceDateStr);
    const raceNumber = parseInt(raceNumberStr);

    useEffect(() => {
        if (!raceState && appState) {
            const initialState = initialiseRaceState(appState.services, appState.editableRaceDate, raceDate, raceNumber);
            console.log(initialState);
            updateRaceState(initialState);
        }
    });

    if (!raceState) {
        return (
            <>
            </>
        )
    }

    const persistResults = (event) => {
        event.preventDefault();
        appState.finishRace();
        updateRaceState(undefined);
    }

    const toggleResultsView = (event) => {
        event.preventDefault();
        updateRaceView(RACE_VIEWS[(RACE_VIEWS.indexOf(raceView) + 1) % RACE_VIEWS.length]);
    }


    return (
        <>
            <Flex direction="row" width="100vh" justify={"space-between"}>
                <Text>Home</Text>
                <Text>Race</Text>
            </Flex>
            <Text>{`${raceState.immutable ? "View" : "Update"} ${getURLDate(raceDate)}, race ${raceNumber}`}</Text>
            <Flex direction="column">
                <Button onClick={() => navigateTo("register")}>Register helm</Button>
            </Flex>
            <Box><Text>Registered</Text></Box>
            <List>
                {raceState.registered.map((registered) =>
                    <ListItem key={HelmResult.getId(registered)}>
                        <Link to={`register/${HelmResult.getHelmId(registered)}`}>{HelmResult.getId(registered)}</Link>
                    </ListItem>
                )}
            </List>
            <Box><Text>Finishers</Text></Box>
            <List>
                {raceState.results.map((result) =>
                    <ListItem key={HelmResult.getId(result)}>
                        {HelmResult.getId(result)}
                    </ListItem>
                )}
            </List>
            {!raceState.registered.length && raceState.results.length > 2 &&
                <Button backgroundColor="green.500" onClick={persistResults} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus><Text fontSize={"lg"}>Persist results</Text></Button>
            }
            {raceState.raceFinish &&
                <>
                    <Box><Text>{`Results By ${raceView}`}</Text></Box>
                    {raceView === "PERSONAL_HANDICAP" &&
                        <List>
                            {raceState.raceFinish.getPersonalCorrectedPointsByResult().map(([result, points]) =>
                                <ListItem key={HelmResult.getId(result)}>
                                    {`${Helm.getId(result.getHelm())} PH:${result.getRollingPersonalHandicapBeforeRace()} PCT:${result.getPersonalCorrectedFinishTime()} Points:${points}`}
                                </ListItem>
                            )}
                        </List>
                    }
                    {raceView === "CLASS_HANDICAP" &&
                        <List>
                            {raceState.raceFinish.getClassCorrectedPointsByResult().map(([result, points]) =>
                                <ListItem key={HelmResult.getId(result)}>
                                    {`${Helm.getId(result.getHelm())} PY:${result.getBoatClass().getPY()} CCT:${result.getClassCorrectedTime()} Points:${points}`}
                                </ListItem>
                            )}
                        </List>
                    }
                    {raceView === "FINISH_TIME" &&
                        <List>
                            {raceState.raceFinish.getFinishersByFinishTime().map((result) =>
                                <ListItem key={HelmResult.getId(result)}>
                                    {`${Helm.getId(result.getHelm())} Laps:${result.getLaps()} FT:${result.getFinishTime()}`}
                                </ListItem>
                            )}
                        </List>
                    }
                    <Button backgroundColor="green.500" onClick={toggleResultsView} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus><Text fontSize={"lg"}>Toggle View</Text></Button>
                </>
            }
        </>
    )
}
import React from "react";
import { useState } from "react";
// import './App.css';
import FinishTimeSelector from "./FinishTimeSelector";
import LapsSelector from "./LapsSelector";
import { useAppState, useServices } from "../useAppState";
import { parseURLDate, useBack } from "../common"
import { Center, Text, Button, Flex } from '@chakra-ui/react'
import { useParams } from "react-router-dom";
import Race from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";

import {
    Alert,
    AlertIcon,
    AlertTitle,
    Box,
    Input,
    InputGroup,
    InputRightElement,
    Spacer,
} from '@chakra-ui/react';

import { CheckCircleIcon } from '@chakra-ui/icons';

function FinishHelm() {
    const navigateBack = useBack();
    const [finishTimeSeconds, setFinishTimeSeconds] = useState();
    const [finishedLaps, setFinishedLaps] = useState();
    const [appState, updateAppState] = useAppState();
    const services = useServices();

    const params = useParams();
    const raceDateStr = params["raceDate"];
    const raceNumberStr = params["raceNumber"];
    const registeredStr = params["registered"];
    const raceDate = parseURLDate(raceDateStr);
    const raceNumber = parseInt(raceNumberStr);
    const race = new Race(raceDate, raceNumber);

    const registeredResult = appState.registered
        .find((tmpResult) =>
            HelmResult.getHelmId(tmpResult) === registeredStr
            && Race.getId(tmpResult.getRace()) === Race.getId(race)
        );

    const finishHelm = (event) => {
        event.preventDefault();

        updateAppState(({ results, registered, ...state }) => {
            if (appState.results.find((prev) => HelmResult.getId(prev) === HelmResult.getId(registeredResult))) {
                // TODO: Allow result to be updated..
                throw new Error("Cannot update helms");
            }
            else {
                return {
                    ...state,
                    registered: [
                        ...registered.filter((prev) => prev !== registeredResult),
                    ],
                    results: [
                        ...results,
                        services.createHelmFinish(registeredResult, finishedLaps, undefined, finishTimeSeconds),
                    ],
                };
            }
        });

        navigateBack();
    };

    if (!registeredResult) {
        return (
            <>
                <Alert status='error'>
                    <AlertIcon />
                    <AlertTitle mr={2}>{"Helm has not been registered"}</AlertTitle>
                </Alert>
                <Button tabIndex="-1" backgroundColor="red.500" onClick={() => navigateBack()} marginLeft="50px" marginRight="50px" marginTop="50px"><Text fontSize={"lg"}>Cancel</Text></Button>
            </>
        );
    }

    return (
        <>
            <form onSubmit={(evt) => evt.preventDefault()}>
                <Center height="80vh" width="100%">
                    <Flex direction={"column"} height="100%" width="100vh">
                        <Box borderRadius={"12px"} borderWidth="1px" padding="20px">
                            <Flex direction={"column"}>
                                <Text fontSize={"lg"}>{"Helm"}</Text>
                                <Spacer />
                                <Box>
                                    <InputGroup>
                                        <Input readOnly={true} onFocus="this.blur()" tabIndex="-1" placeholder={registeredResult ? HelmResult.getHelmId(registeredResult) : ""} />
                                        <InputRightElement children={<CheckCircleIcon color='green.500' />} />
                                    </InputGroup>
                                </Box>
                            </Flex>
                        </Box>
                        <Box borderRadius={"12px"} borderWidth="1px" padding="20px">
                            <Flex direction={"column"}>
                                <Text fontSize={"lg"}>{"Boat"}</Text>
                                <Spacer />
                                <Box>
                                    <InputGroup>
                                        <Input readOnly={true} onFocus="this.blur()" tabIndex="-1" placeholder={registeredResult ? registeredResult.getBoatClass().getClassName() : ""} />
                                        <InputRightElement children={<CheckCircleIcon color='green.500' />} />
                                    </InputGroup>
                                </Box>
                            </Flex>
                        </Box>
                        <FinishTimeSelector
                            setFinishTimeSeconds={setFinishTimeSeconds}
                        />
                        {finishTimeSeconds &&
                            <LapsSelector onLapsUpdated={setFinishedLaps} />
                        }
                        {finishedLaps &&
                            <Button tabIndex="-1" backgroundColor="green.500" onClick={finishHelm} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus><Text fontSize={"lg"}>Add to race results</Text></Button>
                        }
                        <Button tabIndex="-1" backgroundColor="red.500" onClick={() => navigateBack()} marginLeft="50px" marginRight="50px" marginTop="50px"><Text fontSize={"lg"}>Cancel</Text></Button>
                    </Flex>
                </Center>
            </form>
        </>
    );
}

export default FinishHelm;







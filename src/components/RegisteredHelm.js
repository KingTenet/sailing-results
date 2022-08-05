import React from "react";
import { useAppState } from "../useAppState";
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
    Spacer
} from '@chakra-ui/react';

import { CheckCircleIcon } from '@chakra-ui/icons';
import SpinnerWithTimeout from "./Spinner";

function RegisteredHelm({ children }) {
    const navigateBack = useBack();
    const [appState] = useAppState();

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

    if (!registeredResult) {
        return (
            <SpinnerWithTimeout timeout={5000}>
                <Alert status='error'>
                    <AlertIcon />
                    <AlertTitle mr={2}>{"Helm has not been registered"}</AlertTitle>
                </Alert>
                <Button tabIndex="-1" backgroundColor="red.500" onClick={() => navigateBack()} marginLeft="50px" marginRight="50px" marginTop="50px"><Text fontSize={"lg"}>Cancel</Text></Button>
            </SpinnerWithTimeout>
        );
    }

    return (
        <>
            <form onSubmit={(evt) => evt.preventDefault()}>
                <Flex direction={"column"} className="device-height fixed-height" width="100%" alignItems="center">
                    <Flex direction={"column"} alignItems={"center"} width="100%" >
                        <Box borderRadius={"12px"} borderWidth="1px" style={{ padding: "8px 15px 8px 15px" }} width="100%" className={"input-container-1 input-container"}>
                            <Flex direction={"row"} >
                                <Box minWidth="110px" paddingTop="5px">
                                    <Text fontSize={"lg"}>{"Helm"}</Text>
                                </Box>
                                <Box width="100%" >
                                    <InputGroup>
                                        <Input bgColor="white" _placeholder={{ opacity: 1 }} readOnly={true} disabled={true} onFocus="this.blur()" tabIndex="-1" placeholder={registeredResult ? HelmResult.getHelmId(registeredResult) : ""} />
                                        <InputRightElement children={<CheckCircleIcon color='green.500' />} />
                                    </InputGroup>
                                </Box>
                            </Flex>
                        </Box>
                        <Box borderRadius={"12px"} borderWidth="1px" style={{ padding: "8px 15px 8px 15px" }} width="100%" className={"input-container-2 input-container"}>
                            <Flex direction={"row"}>
                                <Box minWidth="110px" paddingTop="5px">
                                    <Text fontSize={"lg"}>{"Boat"}</Text>
                                </Box>
                                <Box width="100%" >
                                    <InputGroup>
                                        <Input bgColor="white" _placeholder={{ opacity: 1 }} readOnly={true} disabled={true} onFocus="this.blur()" tabIndex="-1" placeholder={registeredResult ? registeredResult.getBoatClass().getClassName() : ""} />
                                        <InputRightElement children={<CheckCircleIcon color='green.500' />} />
                                    </InputGroup>
                                </Box>
                            </Flex>
                        </Box>
                        <Box borderRadius={"12px"} borderWidth="1px" style={{ padding: "8px 15px 8px 15px" }} width="100%" className={"input-container-3 input-container"}>
                            <Flex direction={"row"}>
                                <Box minWidth="110px" paddingTop="5px">
                                    <Text fontSize={"lg"}>{"Sail Number"}</Text>
                                </Box>
                                <Box width="100%" >
                                    <InputGroup>
                                        <Input bgColor="white" _placeholder={{ opacity: 1 }} readOnly={true} disabled={true} onFocus="this.blur()" tabIndex="-1" placeholder={registeredResult ? registeredResult.getSailNumber() : ""} />
                                        <InputRightElement children={<CheckCircleIcon color='green.500' />} />
                                    </InputGroup>
                                </Box>
                            </Flex>
                        </Box>
                    </Flex>
                    {React.Children.map(
                        children,
                        (child) => React.isValidElement(child)
                            ? React.cloneElement(child, { registeredResult })
                            : child
                    )}
                </Flex>
            </form>
        </>
    );
}

export default RegisteredHelm;







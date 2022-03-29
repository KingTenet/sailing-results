import {
    Stack,
    Box,
    Text,
    PinInput,
    PinInputField,
    Alert,
    AlertIcon,
    AlertTitle,
    Spacer,
    Switch,
    Flex,
} from '@chakra-ui/react'

import { useState, useEffect } from "react";

const MAX_MINUTES = 99;
const MAX_SECONDS = 59;

function NumberSelector({ setFinishTimeSeconds, setDNF }) {
    const [minutes, setMinutes] = useState()
    const [seconds, setSeconds] = useState()
    const [completed, setCompleted] = useState()
    const [isDNF, setIsDNF] = useState(false);

    let minutesInvalid = minutes < 0 || minutes > MAX_MINUTES;
    let secondsInvalid = seconds < 0 || seconds > MAX_SECONDS;

    useEffect(() => {
        if (minutes && !minutesInvalid && seconds !== undefined && !secondsInvalid) {
            setCompleted(true);
            setFinishTimeSeconds(minutes * 60 + seconds);
        }
        setDNF(isDNF);
    }, [seconds, minutes, isDNF])

    const onComplete = (value) => {
        setMinutes(parseInt(value.slice(0, 2)));
        setSeconds(parseInt(value.slice(2)));
    };

    return (
        <>
            <Box borderRadius={"12px"} borderWidth="1px" style={{ padding: "8px 15px 8px 15px" }}>
                {!completed &&
                    <Flex direction={"row"}>
                        <Box minWidth="110px" paddingTop="2px">
                            <Text fontSize={"lg"}>Helm Did Not Finish</Text>
                        </Box>
                        <Spacer />
                        <Switch size="lg" isChecked={isDNF} onChange={() => setIsDNF(!isDNF)} marginRight="5px" />
                    </Flex>
                }
                {completed &&
                    <Flex direction={"row"}>
                        <Box minWidth="110px" paddingTop="2px">
                            <Text fontSize={"lg"}>Helm Did Not Finish</Text>
                        </Box>
                        <Spacer />
                        <Switch size="lg" isChecked={isDNF} isDisabled marginRight="5px" />
                    </Flex>
                }
            </Box>
            {!isDNF &&
                <Box borderRadius={"12px"} borderWidth="1px" style={{ padding: "8px 15px 8px 15px" }}>
                    {!completed &&
                        <Box minWidth="110px" paddingTop="5px">
                            <Text fontSize={"lg"}>{"Finish Time"}</Text>
                        </Box>
                    }
                    <Stack direction='row' marginTop={!completed ? "10px" : "0px"}>
                        {completed &&
                            <Box minWidth={!completed ? "110px" : "94px"} paddingTop="5px">
                                <Text fontSize={"lg"}>{"Finish Time"}</Text>
                            </Box>
                        }
                        <PinInput onComplete={onComplete} isInvalid={secondsInvalid}>
                            <Text paddingTop="7px">{!completed ? "Minutes" : ""}</Text>
                            <PinInputField autoFocus />
                            <PinInputField />
                            <Text paddingTop="7px">{!completed ? "Seconds" : ":"}</Text>
                            <PinInputField />
                            <PinInputField />
                        </PinInput>
                    </Stack>
                    {secondsInvalid &&
                        <>
                            <Spacer />
                            <Alert status='error'>
                                <AlertIcon />
                                <AlertTitle mr={2}>Seconds must not exceed 59</AlertTitle>
                            </Alert>
                        </>
                    }
                </Box>
            }
        </>
    );
}

export default NumberSelector;
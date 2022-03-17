import {
    Stack,
    Box,
    Text,
    PinInput,
    PinInputField,
    Alert,
    AlertIcon,
    AlertTitle,
    Spacer
} from '@chakra-ui/react'

import { useState, useEffect } from "react";

const MAX_MINUTES = 99;
const MAX_SECONDS = 59;

function NumberSelector({ setFinishTimeSeconds }) {
    const [minutes, setMinutes] = useState()
    const [seconds, setSeconds] = useState()

    let minutesInvalid = minutes < 0 || minutes > MAX_MINUTES;
    let secondsInvalid = seconds < 0 || seconds > MAX_SECONDS;

    useEffect(() => {
        if (minutes && !minutesInvalid && seconds !== undefined && !secondsInvalid) {
            setFinishTimeSeconds(minutes * 60 + seconds);
        }
    })

    const onComplete = (value) => {
        setMinutes(parseInt(value.slice(0, 2)));
        setSeconds(parseInt(value.slice(2)));
    };

    return (
        <>
            <Box borderRadius="12px" borderWidth="1px" padding="20px">
                <Text>Finish Time</Text>
                <Stack direction='row'>
                    <PinInput onComplete={onComplete} isInvalid={secondsInvalid}>
                        <Text>Minutes</Text>
                        <PinInputField autoFocus />
                        <PinInputField />
                        <Text>Seconds</Text>
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
        </>
    );
}

export default NumberSelector;
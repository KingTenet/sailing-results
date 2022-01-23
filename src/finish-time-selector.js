import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stack,
  FormControl,
  FormLabel,
  Box,
  Center,
  Text,
  Heading,
  FormErrorMessage
} from '@chakra-ui/react'

import {useState, useEffect} from "react";

const MAX_MINUTES = 99;
const MAX_SECONDS = 59;

function NumberSelector({setFinishTimeSeconds}) {
    const [minutes, setMinutes] = useState()
    const [seconds, setSeconds] = useState()

    let minutesInvalid = minutes < 0 || minutes > MAX_MINUTES;
    let secondsInvalid = seconds < 0 || seconds > MAX_SECONDS;
    
    useEffect(() => {
        if (minutes && !minutesInvalid && seconds !== undefined && !secondsInvalid) {
            setFinishTimeSeconds(minutes * 60 + seconds);
        }
    })

    return (
        <>
            <Box borderRadius="12px" borderWidth="1px" padding="20px">
                <Heading>Finish Time</Heading>
                <Stack direction='row'>
                    <Box>
                        <Text>Minutes</Text>
                        <FormControl isRequired isInvalid={minutesInvalid}>
                            <NumberInput
                                size='lg'
                                value={minutes}
                                onChange={(valueString) => setMinutes(valueString)}
                                min={0}
                                max={MAX_MINUTES}
                                clampValueOnBlur={false}
                            >
                                <NumberInputField autoFocus/>
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                            <FormErrorMessage>Minutes cannot exceed 99</FormErrorMessage>
                        </FormControl>
                    </Box>
                    <Box>
                        <Text>Seconds</Text>
                        <FormControl isRequired isInvalid={secondsInvalid}>
                            <NumberInput
                                size='lg'
                                value={seconds}
                                onChange={(valueString) => setSeconds(valueString)}
                                min={0}
                                max={MAX_SECONDS}
                                clampValueOnBlur={false}
                            >
                                <NumberInputField/>
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                        <FormErrorMessage>Seconds cannot exceed 59</FormErrorMessage>
                        </FormControl>
                    </Box>
                </Stack>
            </Box>
        </>
    );
}

export default NumberSelector;
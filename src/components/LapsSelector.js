import {
    Stack,
    Box,
    Text,
    PinInput,
    PinInputField,
} from '@chakra-ui/react'

function LapsSelector({ onLapsUpdated }) {
    return (
        <>
            <Box borderRadius="12px" borderWidth="1px" padding="20px">
                <Text>Laps</Text>
                <Stack direction='row'>
                    <PinInput onComplete={(value) => onLapsUpdated(parseInt(value))}>
                        <Text>Laps</Text>
                        <PinInputField autoFocus />
                    </PinInput>
                </Stack>
            </Box>
        </>
    );
}

export default LapsSelector;
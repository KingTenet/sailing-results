import {
    Stack,
    Box,
    Text,
    PinInput,
    PinInputField,
} from '@chakra-ui/react';

import { useState } from "react";

function LapsSelector({ onLapsUpdated }) {
    const [completed, setCompleted] = useState()

    const onComplete = (value) => {
        setCompleted(true);
        onLapsUpdated(value);
    };

    return (
        <>
            <Box borderRadius={"12px"} borderWidth="1px" style={{ padding: "8px 15px 8px 15px" }} className={"input-container input-container-6"}>
                {!completed &&
                    <Box minWidth="110px" paddingTop="5px">
                        <Text fontSize={"lg"}>{"Laps"}</Text>
                    </Box>
                }
                <Stack direction='row' marginTop={!completed ? "10px" : "0px"}>
                    {completed &&
                        <Box minWidth={!completed ? "110px" : "103px"} paddingTop="5px">
                            <Text fontSize={"lg"}>{"Laps"}</Text>
                        </Box>
                    }
                    <PinInput onComplete={(value) => onComplete(parseInt(value))}>
                        <PinInputField bgColor="white" autoFocus />
                    </PinInput>
                </Stack>
            </Box>
        </>
    );
}

export default LapsSelector;
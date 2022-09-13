import { useAppState, useServices } from "./useAppState";
import React, { useState } from "react";
import { Button, Box, Text } from "@chakra-ui/react";
import StoresSync from "./StoresSync";

export default function Debug() {
    const services = useServices();
    const [state, updateAppState] = useAppState();
    const [showState, updateShowState] = useState(false);

    return (
        <>
            <Button onClick={() => console.log(state)}>Log state</Button>
            <Button onClick={() => localStorage.clear()}>Clear cache</Button>
            <Button onClick={() => updateShowState(!showState)}>Show state</Button>
            <Button onClick={() => services.backup()}>Backup</Button>
            <Button onClick={() => updateAppState((prevState) => ({
                ...prevState,
                count:
                    state.count
                        ? state.count + 1
                        : 1
            }))}
            >Update state</Button>
            <StoresSync verbose={true} />
            <Box>
                <Text>{`${JSON.stringify(state, null, 4)}`}</Text>
            </Box>
        </>
    )
}
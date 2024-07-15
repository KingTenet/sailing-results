import { useAppState, useServices } from "./useAppState";
import React, { useState } from "react";
import { Button, Box, Text } from "@chakra-ui/react";
import StoresSync from "./StoresSync";
import { GreenButton } from "./components/Buttons";
import { useNavigate } from "react-router-dom";


function clearCacheNotToken() {
    const token = localStorage.getItem("token");
    localStorage.clear();
    localStorage.setItem("token", token);
    window.location.reload();
}

function ButtonRow({ onClick, children }) {
    return <Box marginBottom="10px"><GreenButton onClick={onClick}>{children}</GreenButton></Box>;
}


export default function Debug() {
    const navigateTo = useNavigate();
    const services = useServices();
    const [state, updateAppState] = useAppState();
    const [showState, updateShowState] = useState(false);

    return (
        <div>
            <ButtonRow onClick={() => console.log(state)}>Log state</ButtonRow>
            <ButtonRow onClick={() => clearCacheNotToken()}>Clear cache</ButtonRow>
            <ButtonRow onClick={() => updateShowState(!showState)}>{`${showState ? "Hide" : "Show"} state`}</ButtonRow>
            <ButtonRow onClick={() => services.backup()}>Backup</ButtonRow>
            <StoresSync verbose={true} />
            {showState &&
                <Box>
                    <Text>{`${JSON.stringify(state, null, 4)}`}</Text>
                </Box>
            }
            <ButtonRow onClick={() => navigateTo("/races")}>Edit races</ButtonRow>
            <ButtonRow onClick={() => navigateTo("/series")}>Series</ButtonRow>
        </div>
    )
}
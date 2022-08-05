import React from "react";
import { useState } from "react";
import FinishTimeSelector from "./FinishTimeSelector";
import LapsSelector from "./LapsSelector";
import { useBack } from "../common"
import { useAppState, useServices } from "../useAppState";
import HelmResult from "../store/types/HelmResult";
import { Spacer, Flex, Box } from '@chakra-ui/react';
import { GreenButton, RedButton } from "./Buttons";

export default function FinishedHelm({ registeredResult }) {
    const navigateBack = useBack();
    const [finishTimeSeconds, setFinishTimeSeconds] = useState();
    const [finishedLaps, setFinishedLaps] = useState();
    const [, updateAppState] = useAppState();
    const services = useServices();

    const finishHelm = (event) => {
        event.preventDefault();

        updateAppState(({ results, registered, oods, ...state }) => {
            if (results.find((prev) => HelmResult.getId(prev) === HelmResult.getId(registeredResult))
                || oods.find((prev) => HelmResult.getId(prev) === HelmResult.getId(registeredResult))
            ) {
                throw new Error("Cannot update helms");
            }
            else {
                return {
                    ...state,
                    oods: oods,
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

    return (
        <Flex direction="column" width="100%" height="100%" alignItems={"center"}>
            <Box width="100%">
                <FinishTimeSelector setFinishTimeSeconds={setFinishTimeSeconds} />
                {finishTimeSeconds &&
                    <LapsSelector onLapsUpdated={setFinishedLaps} />
                }
            </Box>
            <Spacer />
            {(finishedLaps) &&
                <GreenButton tabIndex="-1" onClick={finishHelm} autoFocus>Add to race results</GreenButton>
            }
            <RedButton tabIndex="-1" backgroundColor="red.500" onClick={() => navigateBack()}>Cancel</RedButton>
        </Flex >
    )
}

import React from "react";
import { useState } from "react";
import FinishTimeSelector from "./FinishTimeSelector";
import LapsSelector from "./LapsSelector";
import { useBack } from "../common"
import { useAppState, useServices } from "../useAppState";
import { Text, Button } from '@chakra-ui/react'
import HelmResult from "../store/types/HelmResult";

import { Spacer } from '@chakra-ui/react';


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
        <>
            <FinishTimeSelector setFinishTimeSeconds={setFinishTimeSeconds} />
            {finishTimeSeconds &&
                <LapsSelector onLapsUpdated={setFinishedLaps} />
            }
            <Spacer />
            {(finishedLaps) &&
                <Button tabIndex="-1" backgroundColor="green.500" onClick={finishHelm} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus><Text fontSize={"lg"}>Add to race results</Text></Button>
            }
            <Button tabIndex="-1" backgroundColor="red.500" onClick={() => navigateBack()} marginLeft="50px" marginRight="50px" marginTop="50px"><Text fontSize={"lg"}>Cancel</Text></Button>
        </>
    )
}

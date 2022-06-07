import React, { useState } from "react";

import { useAppState, useServices } from "../useAppState";
import StoreRace from "../store/types/Race";
import Result from "../store/types/Result";
import HelmResult from "../store/types/HelmResult";
import { Box, Button, Flex, Spacer, useDisclosure } from "@chakra-ui/react";
import {
    AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from "@chakra-ui/react";
import MutableRaceResult from "../store/types/MutableRaceResult";

export default function CopyFromPreviousRace({ race, previousRace }) {
    const [appState, updateAppState] = useAppState();
    const services = useServices();
    const cancelRef = React.useRef();
    const raceResults = appState.results.filter((result) => HelmResult.getRaceId(result) === StoreRace.getId(previousRace));
    const raceRegistered = appState.registered.filter((result) => HelmResult.getRaceId(result) === StoreRace.getId(previousRace));
    const oods = appState.oods.filter((ood) => HelmResult.getRaceId(ood) === StoreRace.getId(previousRace));

    const [[previousRaceResults, previousRaceOODs]] = useState(() => {
        const isPursuitRace = appState.isPursuitRace;

        const viewableRaceResults = !isPursuitRace
            ? raceResults
            : [...raceResults, ...raceRegistered.map((result, positionIndex) => Result.fromRegistered(result, positionIndex + 1))];

        const previousRaceValid = !viewableRaceResults.length || viewableRaceResults.some((result) => result.finishCode.validFinish());
        const previousRaceFinish = previousRaceValid && services.getRaceFinishForResults(previousRace, viewableRaceResults, oods);

        return [
            (previousRaceFinish && previousRaceFinish.results.length && previousRaceFinish.getCorrectedResults()) || [],
            (previousRaceFinish && previousRaceFinish.getOODs()) || []
        ];
    }, []);

    const { isOpen, onClose } = useDisclosure({ defaultIsOpen: previousRaceResults.length || previousRaceOODs.length });

    const copyHelmsOODs = () => {
        updateAppState(({ registered, oods, ...state }) => ({
            ...state,
            registered: [
                ...registered,
                ...previousRaceResults.map((result) => MutableRaceResult.fromPreviousResult(result, race))
            ],
            oods: [
                ...oods,
                ...previousRaceOODs.map((result) => HelmResult.fromPreviousResult(result, race))
            ]
        }));
    };

    const onConfirm = () => {
        copyHelmsOODs();
        onClose();
    }

    return (
        <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                        {"Use the helms and OODs from the previous race?"}
                    </AlertDialogHeader>
                    <AlertDialogBody>{"It is recommended to use the helms/OODs registered from the previous race. Those that are not taking part or have changed rig/boat can be deleted. New helms can still be added."}</AlertDialogBody>
                    <AlertDialogFooter>
                        <Flex width="100%" direction={"column"}>
                            <Button marginBottom="20px" colorScheme='green' onClick={onConfirm}>
                                {"Yes"}
                            </Button>
                            <Spacer />
                            <Button ref={cancelRef} marginBottom="20px" colorScheme='blue' onClick={onClose}>
                                {"No"}
                            </Button>
                        </Flex>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    )
}
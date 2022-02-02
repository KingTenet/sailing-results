import React from "react";
import { useState } from "react";
import './App.css';
import Autocomplete from "./AutocompleteSimple";
import FinishTimeSelector from "./FinishTimeSelector2";
import { search } from "./search";
import LapsSelector from "./LapsSelector";
import { useAppState } from "./useAppState";
import { useBack } from "./common"

import { Center, Text, Button, Flex } from '@chakra-ui/react'
import { useParams } from "react-router-dom";

function AddHelmResult() {
    const navigateBack = useBack();
    const [selectedHelm, setSelectedHelm] = useState(null);
    const [selectedBoat, setSelectedBoat] = useState(null);
    const [finishTimeSeconds, setFinishTimeSeconds] = useState();
    const [finishedLaps, setFinishedLaps] = useState();
    const [appState, updateAppState] = useAppState();
    const params = useParams();

    const raceDate = appState?.store?.raceDate;
    const races = appState?.store?.activeRaces;
    const helmsIndex = appState?.services?.helmsIndex;
    const raceNumber = params["raceNumber"];

    const activeRace = appState?.store?.activeRaces.find(({ raceNumber: activeRaceNumber }) => activeRaceNumber === raceNumber);

    if (!races || !raceDate || !raceNumber || !activeRace) {
        return (
            <>
            </>
        )
    }

    const processHelmResult = (event) => {
        event.preventDefault();

        const result = {
            helm: selectedHelm,
            boat: selectedBoat,
            finishTime: finishTimeSeconds,
            finishLaps: finishedLaps,
            finishCode: undefined,
            finishPosition: undefined
        };

        const updateActiveRaceState = (raceTransform) => updateAppState(({ store: { activeRaces, ...rest }, ...state }) => ({
            ...state,
            store: {
                ...rest,
                activeRaces: activeRaces.map((activeRace) => raceNumber === activeRace.raceNumber
                    ? raceTransform(activeRace)
                    : activeRace
                )
            }
        }));

        if (activeRace.results.find(({ helm }) => helm.name === selectedHelm.name)) {
            updateActiveRaceState((race) => ({
                ...race,
                results: race.results.map((oldResult) => result.helm.name === oldResult.helm.name
                    ? result
                    : oldResult
                ),
            }));
        }
        else {
            updateActiveRaceState((race) => ({
                ...race,
                results: [
                    ...race.results,
                    result,
                ],
            }));
        }

        navigateBack();
    };

    return (
        <>
            <form onSubmit={(evt) => evt.preventDefault()}>
                <Center height="80vh" width="100%">
                    <Flex direction={"column"} height="100%" width="100vh">
                        <Autocomplete
                            heading={"Helm"}
                            data={helmsIndex.data}
                            itemToString={(helm) => (helm ? helm.name : "")}
                            filterData={(inputValue) => helmsIndex.search(inputValue)}
                            handleSelectedItemChange={setSelectedHelm}
                            getInvalidItemString={(partialMatch) => `${partialMatch} has not raced before, create a new helm record`}
                            createNewMessage={"Create a new helm record"}
                            placeholder={"Enter helm name here..."}
                        />
                        {selectedHelm &&
                            <Autocomplete
                                heading={"Boat"}
                                data={search.boatsIndex.data}
                                itemToString={(boat) => (boat ? boat.class : "")}
                                filterData={(inputValue) => search.boatsIndex.search(inputValue)}
                                handleSelectedItemChange={setSelectedBoat}
                                getInvalidItemString={(partialMatch) => `${partialMatch} has not raced before, create a new boat record`}
                                createNewMessage={"Create a new boat record"}
                                placeholder={"Enter boat sail number here..."}
                            />
                        }
                        {selectedBoat &&
                            <FinishTimeSelector
                                setFinishTimeSeconds={setFinishTimeSeconds}
                            />
                        }
                        {finishTimeSeconds &&
                            <LapsSelector onLapsUpdated={setFinishedLaps} />
                        }
                        {finishedLaps &&
                            <Button tabIndex="-1" backgroundColor="green.500" onClick={processHelmResult} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus><Text fontSize={"lg"}>Add to race results</Text></Button>
                        }
                        <Button tabIndex="-1" backgroundColor="red.500" onClick={() => navigateBack()} marginLeft="50px" marginRight="50px" marginTop="50px"><Text fontSize={"lg"}>Cancel</Text></Button>
                    </Flex>
                </Center>
            </form>
        </>
    );
}

export default AddHelmResult;







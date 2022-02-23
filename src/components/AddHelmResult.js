import React, { useEffect } from "react";
import { useState } from "react";
// import './App.css';
import Autocomplete from "./AutocompleteSimple";
import FinishTimeSelector from "./FinishTimeSelector2";
import LapsSelector from "./LapsSelector";
import { useAppState } from "../useAppState";
import { parseURLDate, useBack } from "../common"
import Result from "../store/types/Result";
import { Center, Text, Button, Flex } from '@chakra-ui/react'
import { useParams } from "react-router-dom";
import Race from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";

function AddHelmResult() {
    const navigateBack = useBack();
    const [selectedHelm, setSelectedHelm] = useState(null);
    const [selectedBoat, setSelectedBoat] = useState(null);
    const [finishTimeSeconds, setFinishTimeSeconds] = useState();
    const [finishedLaps, setFinishedLaps] = useState();
    const [appState, updateAppState] = useAppState();
    // const params = useParams();

    // const raceDate = appState?.store?.raceDate;
    // const races = appState?.store?.activeRaces;
    const helmsIndex = appState?.services?.helmsIndex;

    // const raceNumber = parseInt(params["raceNumber"]);
    // const raceDate = parseURLDate(params["raceDate"]);

    const params = useParams();
    const raceDateStr = params["raceDate"];
    const raceNumberStr = params["raceNumber"];
    const registeredStr = params["registered"];
    const raceDate = parseURLDate(raceDateStr);
    const raceNumber = parseInt(raceNumberStr);
    const race = new Race(raceDate, raceNumber);

    // const activeRace = appState?.store?.otherActiveRaces.find(({ raceNumber: activeRaceNumber }) => activeRaceNumber === raceNumber);
    useEffect(() => {
        if (registeredStr && appState && (!selectedHelm || !selectedBoat)) {
            const registered = appState.services.stores.registered.all()
                .find((tmpResult) =>
                    HelmResult.getHelmId(tmpResult) === registeredStr
                    && Race.getId(tmpResult.getRace()) === Race.getId(race)
                );
            if (!registered) {
                throw new Error(`Could not find helm ${registeredStr} to update`);
            }
            if (!selectedHelm) {
                setSelectedHelm(registered.getHelm());
            }
            if (!selectedBoat) {
                setSelectedBoat(registered.getBoatClass());
            }
        }
    });

    if (!helmsIndex || !raceDate || !raceNumber) {
        return (
            <>
            </>
        )
    }

    const boatsIndex = appState.services.getBoatIndexForRace(race);

    const processHelmResult = (event) => {
        event.preventDefault();

        if (!registeredStr) {
            appState.signOnHelm(race, selectedHelm, selectedBoat, 0);
            navigateBack();
            return;
        }
        //boatSailNumber, laps, finishTime, finishCode
        appState.finishHelm(race, selectedHelm, selectedBoat, 0, finishedLaps, finishTimeSeconds);
        navigateBack();

        return;

        // const result = {
        //     helm: Helm.getId(selectedHelm),
        //     boat: BoatClass.getId(selectedBoat),
        //     finishTime: finishTimeSeconds,
        //     finishLaps: finishedLaps,
        //     finishCode: undefined,
        //     finishPosition: undefined
        // };

        // const updateActiveRaceState = (raceTransform) => updateAppState(({ store: { activeRaces, ...rest }, ...state }) => ({
        //     ...state,
        //     store: {
        //         ...rest,
        //         activeRaces: activeRaces.map((activeRace) => raceNumber === activeRace.raceNumber
        //             ? raceTransform(activeRace)
        //             : activeRace
        //         )
        //     }
        // }));

        // if (activeRace.results.find((prev) => prev.getHelm() === result.getHelm())) {
        //     // TODO: Allow result to be updated..
        //     updateActiveRaceState((race) => ({
        //         ...race,
        //         results: race.results.map((oldResult) => Result.getId(oldResult) === Result.getId(result)
        //             ? result
        //             : oldResult
        //         ),
        //     }));
        // }
        // else {
        //     updateActiveRaceState((race) => ({
        //         ...race,
        //         results: [
        //             ...race.results,
        //             result,
        //         ],
        //     }));
        // }

        // console.log("In process helm result");
        // updateAppState(({ store: { otherActiveRaces, ...rest }, ...state }) => {
        //     console.log("In update appstate");
        //     return ({
        //         ...state,
        //         store: {
        //             ...rest,
        //             otherActiveRaces: otherActiveRaces
        //                 .map((activeRace) => Race.getId(activeRace) === Result.getRaceId(result)
        //                     ? activeRace.addResult(result)
        //                     : activeRace
        //                 ),
        //         }
        //     })
        // });

    };

    return (
        <>
            <form onSubmit={(evt) => evt.preventDefault()}>
                <Center height="80vh" width="100%">
                    <Flex direction={"column"} height="100%" width="100vh">
                        <Autocomplete
                            heading={"Helm"}
                            data={helmsIndex.data}
                            itemToString={(helm) => (helm ? helm.getName() : "")}
                            filterData={(inputValue) => helmsIndex.search(inputValue)}
                            handleSelectedItemChange={setSelectedHelm}
                            getInvalidItemString={(partialMatch) => `${partialMatch} has not raced before, create a new helm record`}
                            createNewMessage={"Create a new helm record"}
                            placeholder={"Enter helm name here..."}
                            bootstrapValue={selectedHelm}
                        />
                        {selectedHelm &&
                            <Autocomplete
                                heading={"Boat"}
                                data={boatsIndex.data}
                                itemToString={(boat) => (boat ? boat.getClassName() : "")}
                                filterData={(inputValue) => boatsIndex.search(inputValue)}
                                handleSelectedItemChange={setSelectedBoat}
                                getInvalidItemString={(partialMatch) => `${partialMatch} has not raced before, create a new boat record`}
                                createNewMessage={"Create a new boat record"}
                                placeholder={"Enter boat sail number here..."}
                                bootstrapValue={selectedBoat}
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







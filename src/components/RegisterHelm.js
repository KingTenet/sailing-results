import React, { useEffect } from "react";
import { useState } from "react";
// import './App.css';
import Autocomplete from "./AutocompleteSimple";
import { useAppState, useServices } from "../useAppState";
import { parseURLDate, useBack } from "../common"
import { Center, Text, Button, Flex, Spacer } from '@chakra-ui/react'
import { useParams } from "react-router-dom";
import Race from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";

function RegisterHelm() {
    const navigateBack = useBack();
    const [selectedHelm, setSelectedHelm] = useState(null);
    const [selectedBoat, setSelectedBoat] = useState(null);
    const [sailNumber, setSailNumber] = useState();

    const [appState, updateAppState] = useAppState();
    const services = useServices();

    const params = useParams();
    const raceDateStr = params["raceDate"];
    const raceNumberStr = params["raceNumber"];
    const raceDate = parseURLDate(raceDateStr);
    const raceNumber = parseInt(raceNumberStr);
    const race = new Race(raceDate, raceNumber);

    const [excludedHelmIds] = useState(() => [
        ...appState.results.filter((result) => HelmResult.getRaceId(result) === Race.getId(race)),
        ...appState.registered.filter((result) => HelmResult.getRaceId(result) === Race.getId(race)),
        ...appState.oods.filter((result) => HelmResult.getRaceId(result) === Race.getId(race))
    ].map((result) => result.getHelm()));

    const [helmsIndex] = useState(() => services.indexes.getHelmsIndex(excludedHelmIds));
    const [boatsIndex, setBoatsIndex] = useState(null);
    const [sailNumberIndex, setSailNumberIndex] = useState(null);

    const processHelmResult = (event) => {
        event.preventDefault();
        const newRegisteration = services.createRegisteredHelm(race, selectedHelm, selectedBoat, parseInt(sailNumber));

        updateAppState(({ registered, results, oods, ...state }) => {
            if (registered.find((prev) => HelmResult.getId(prev) === HelmResult.getId(newRegisteration))
                || results.find((prev) => HelmResult.getId(prev) === HelmResult.getId(newRegisteration))
                || oods.find((prev) => HelmResult.getId(prev) === HelmResult.getId(newRegisteration))
            ) {
                throw new Error("Cannot update helms");
            }
            else {
                return {
                    ...state,
                    results: results,
                    oods: oods,
                    registered: [
                        ...registered,
                        newRegisteration,
                    ],
                };
            }
        });

        navigateBack();
    };

    useEffect(() => {
        services.indexes.updateFromResults(appState.results);
    }, [appState.results]);

    useEffect(() => {
        if (selectedHelm && selectedBoat) {
            const index = services.indexes.getSailNumberIndexForHelmBoat(
                selectedHelm,
                selectedBoat,
            );

            setSailNumberIndex(index);
            // setAllSailNumbers(sailNumbers);
        }
    },
        [selectedBoat]
    );

    useEffect(() => {
        if (selectedHelm) {
            setBoatsIndex(services.indexes.getBoatIndexForHelmRace(selectedHelm, race));
        }
    }, [selectedHelm])

    console.log(sailNumber);
    console.log(selectedHelm);

    return (
        <>
            {/* <Box height="100vh" /> */}
            <form onSubmit={(evt) => evt.preventDefault()}>
                <Center height="80vh">
                    <Flex direction={"column"} height="80vh" width="100%">
                        <Flex direction={"column"} height="100%" >
                            <Autocomplete
                                heading={"Helm"}
                                data={helmsIndex.data}
                                itemToString={(helm) => (helm ? helm.getName() : "")}
                                filterData={(inputValue) => helmsIndex.search(inputValue)}
                                handleSelectedItemChange={setSelectedHelm}
                                getInvalidItemString={(partialMatch) => `${partialMatch} has not raced before, create a new helm record`}
                                createNewMessage={"Create a new helm record"}
                                placeholder={"Enter helm name here..."}
                                openOnFocus={true}
                            />
                            {selectedHelm && boatsIndex &&
                                <Autocomplete
                                    heading={"Boat"}
                                    data={boatsIndex.data}
                                    itemToString={(boat) => (boat ? boat.getClassName() : "")}
                                    filterData={(inputValue) => boatsIndex.search(inputValue)}
                                    handleSelectedItemChange={setSelectedBoat}
                                    getInvalidItemString={(partialMatch) => `${partialMatch} has not raced before, create a new boat record`}
                                    createNewMessage={"Create a new boat record"}
                                    placeholder={"Enter boat..."}
                                    openOnFocus={true}
                                />
                            }
                            {selectedBoat && sailNumberIndex &&
                                <>
                                    <Autocomplete
                                        heading={"Sail Number"}
                                        data={sailNumberIndex.data}
                                        // itemToString={({ sailNumber, date, count, score }) => (sailNumber !== undefined ? `${sailNumber} ${date.toISOString()} ${count} ${score}` : "")}
                                        itemToString={({ sailNumber }) => (sailNumber !== undefined ? sailNumber : "")}
                                        filterData={(inputValue) => sailNumberIndex.search(inputValue)}
                                        handleSelectedItemChange={(item) => item !== undefined ? setSailNumber(parseInt(item) || item.sailNumber) : ""}
                                        getInvalidItemString={(partialMatch) => `${partialMatch} is not a sail number used before, create a new boat record`}
                                        createNewMessage={"Use new boat sail number"}
                                        placeholder={"Enter boat sail number here..."}
                                        openOnFocus={true}
                                        type={"number"}
                                        triggerExactMatchOnBlur={true}
                                    />
                                    <input style={{
                                        opacity: 0,         // hide it visually
                                        zIndex: -1,         // avoid unintended clicks
                                        position: "absolute"  // don't affect other elements positioning
                                    }}></input>
                                </>
                            }
                        </Flex>
                        <Spacer />
                        {sailNumber &&
                            <Button backgroundColor="green.500" onClick={processHelmResult} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus><Text fontSize={"lg"}>Add to race results</Text></Button>
                        }
                        <Button tabIndex="-1" backgroundColor="red.500" onClick={() => navigateBack()} marginLeft="50px" marginRight="50px" marginTop="50px"><Text fontSize={"lg"}>Cancel</Text></Button>
                    </Flex>
                </Center>
            </form>
        </>
    );
}

export default RegisterHelm;

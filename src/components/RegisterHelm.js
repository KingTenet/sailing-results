import React, { useEffect } from "react";
import { useState } from "react";
import Autocomplete from "./AutocompleteSimple";
import { useAppState, useServices } from "../useAppState";
import { parseURLDate, useBack } from "../common"
import { Center, Text, Button, Flex, Spacer } from '@chakra-ui/react'
import { useParams } from "react-router-dom";
import Race from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";
import ClubMember from "../store/types/ClubMember";
import NewHelm from "./NewHelm";
import Helm from "../store/types/Helm";

function RegisterHelm() {
    const navigateBack = useBack();
    const [selectedHelm, setSelectedHelm] = useState(null);
    const [selectedClubMember, setSelectedClubMember] = useState(null);
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

    const [helmsIndex, setHelmsIndex] = useState(null);
    const [boatsIndex, setBoatsIndex] = useState(null);
    const [sailNumberIndex, setSailNumberIndex] = useState(null);

    const processHelmResult = () => {
        console.log("in process helm result");
        // event.preventDefault();
        console.log("in process helm result");
        const newRegisteration = services.createRegisteredHelm(race, selectedHelm, selectedBoat, parseInt(sailNumber), appState.newHelms);

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
        if (!selectedHelm) {
            setHelmsIndex(services.indexes.getHelmsIndex(excludedHelmIds, appState.newHelms))
        }
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

    const handleSelectedHelm = (selectedHelm) => {
        if (selectedHelm instanceof ClubMember) {
            // Do some club member stuff..
            setSelectedClubMember(selectedHelm);
        }
        else {
            setSelectedHelm(selectedHelm);
        }
    };

    const onNewHelm = (newHelm) => {
        updateAppState(({ newHelms, ...state }) => {
            if (newHelms.find((prev) => Helm.getId(prev) === Helm.getId(newHelm))) {
                throw new Error("Cannot add helm that already exists");
            }
            else {
                return {
                    ...state,
                    newHelms: [
                        ...newHelms,
                        newHelm,
                    ]
                };
            }
        });

        setSelectedHelm(newHelm);
    };

    console.log(sailNumber);

    return (
        <>
            {/* <Box height="100vh" /> */}
            <form onSubmit={(evt) => evt.preventDefault()}>
                <Center height="80vh">
                    <Flex direction={"column"} height="80vh" width="100%">
                        <Flex direction={"column"} height="100%" >
                            {helmsIndex && !selectedClubMember &&
                                <Autocomplete
                                    heading={"Helm"}
                                    data={helmsIndex.data}
                                    itemToString={(helm) => (helm ? helm.getName() : "")}
                                    filterData={(inputValue) => helmsIndex.search(inputValue)}
                                    handleSelectedItemChange={handleSelectedHelm}
                                    placeholder={"Enter helm name here..."}
                                />
                            }
                            {
                                selectedClubMember && <NewHelm onNewHelm={onNewHelm} clubMember={selectedClubMember} />
                            }
                            {selectedHelm && boatsIndex &&
                                <Autocomplete
                                    heading={"Boat"}
                                    data={boatsIndex.data}
                                    itemToString={(boat) => (boat ? boat.getClassName() : "")}
                                    filterData={(inputValue) => boatsIndex.search(inputValue)}
                                    handleSelectedItemChange={setSelectedBoat}
                                    placeholder={"Enter boat..."}
                                />
                            }
                            {selectedBoat && sailNumberIndex &&
                                <>
                                    <Autocomplete
                                        heading={"Sail Number"}
                                        data={sailNumberIndex.data}
                                        itemToString={({ sailNumber }) => (sailNumber !== undefined ? sailNumber : "")}
                                        filterData={(inputValue) => sailNumberIndex.search(inputValue)}
                                        handleSelectedItemChange={(item) => item !== undefined ? setSailNumber(!isNaN(parseInt(item)) ? parseInt(item) : item.sailNumber) : ""}
                                        placeholder={"Enter boat sail number here..."}
                                        type={"number"}
                                        triggerExactMatchOnBlur={true}
                                    />
                                    {!sailNumber &&
                                        <input style={{
                                            opacity: 0,         // hide it visually
                                            zIndex: -1,         // avoid unintended clicks
                                            position: "absolute"  // don't affect other elements positioning
                                        }}></input>
                                    }
                                </>
                            }
                        </Flex>
                        <Spacer />
                        {sailNumber !== undefined &&
                            <Button backgroundColor="green.500" onClick={() => {
                                console.log("Received click");
                                processHelmResult();
                            }} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus><Text fontSize={"lg"}>Add to race results</Text></Button>
                        }
                        <Button tabIndex="-1" backgroundColor="red.500" onClick={() => navigateBack()} marginLeft="50px" marginRight="50px" marginTop="50px"><Text fontSize={"lg"}>Cancel</Text></Button>
                    </Flex>
                </Center>
            </form>
        </>
    );
}

export default RegisterHelm;

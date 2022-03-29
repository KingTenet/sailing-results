import React, { useEffect } from "react";
import { useState } from "react";
import Autocomplete from "./AutocompleteSimple";
import { useAppState, useServices } from "../useAppState";
import { parseURLDate, useBack } from "../common"
import { Center, Text, Button, Flex, Spacer } from '@chakra-ui/react'
import { useParams } from "react-router-dom";
import Race from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";
import Helm from "../store/types/Helm";
import ClubMember from "../store/types/ClubMember";
import NewHelm from "./NewHelm";

function RegisterHelm() {
    const navigateBack = useBack();
    const [selectedHelm, setSelectedHelm] = useState(null);
    const [selectedClubMember, setSelectedClubMember] = useState(null);

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

    const processHelmResult = (event) => {
        event.preventDefault();
        const newRegisteration = services.createOOD(race, selectedHelm, appState.newHelms);

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
                    registered: registered,
                    oods: [
                        ...oods,
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

    return (
        <>
            <form onSubmit={(evt) => evt.preventDefault()}>
                <Center height="80vh">
                    <Flex direction={"column"} height="80vh" width="100%">
                        <Flex direction={"column"} height="100%" >
                            {helmsIndex && !selectedClubMember && <Autocomplete
                                heading={"OOD"}
                                data={helmsIndex.data}
                                itemToString={(helm) => (helm ? helm.getName() : "")}
                                filterData={(inputValue) => helmsIndex.search(inputValue)}
                                handleSelectedItemChange={handleSelectedHelm}
                                placeholder={"Enter name here..."}
                            />
                            }
                            {
                                selectedClubMember && <NewHelm onNewHelm={onNewHelm} clubMember={selectedClubMember} />
                            }
                        </Flex>
                        <Spacer />
                        {selectedHelm &&
                            <Button backgroundColor="green.500" onClick={processHelmResult} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus><Text fontSize={"lg"}>Add OOD to race</Text></Button>
                        }
                        <Button tabIndex="-1" backgroundColor="red.500" onClick={() => navigateBack()} marginLeft="50px" marginRight="50px" marginTop="50px"><Text fontSize={"lg"}>Cancel</Text></Button>
                    </Flex>
                </Center>
            </form>
        </>
    );
}

export default RegisterHelm;

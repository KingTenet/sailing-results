import React, { useEffect } from "react";
import { useState } from "react";
import Autocomplete from "./AutocompleteSimple";
import { useAppState, useServices } from "../useAppState";
import { parseURLDate, useBack, cleanName } from "../common"
import { Flex, Spacer, useDisclosure } from '@chakra-ui/react'
import { useParams } from "react-router-dom";
import Race from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";
import Helm from "../store/types/Helm";
import ClubMember from "../store/types/ClubMember";
import NewHelm from "./NewHelm";
import { GreenButton, RedButton } from "./Buttons";
import AlertDialogWrapper from "./AlertDialogWrapper";


export default function RegisterOOD() {
    const navigateBack = useBack();
    const [selectedHelm, setSelectedHelm] = useState(null);
    const [selectedNewMember, setSelectedNewMember] = useState(null);
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

    useEffect(() => setSelectedHelm(undefined), [selectedClubMember]);

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

    const { onOpen, isOpen, onClose } = useDisclosure();

    const onNewHelmName = (newMemberName) => {
        try {
            const cleanedName = cleanName(newMemberName);
            if (!services.stores.clubMembers.has(cleanedName)
                && !services.stores.newMembers.has(cleanedName)) {
                setSelectedNewMember(cleanedName);
                onOpen();
            }
        }
        catch (err) {
            // do nothing
        }
    };

    const onConfirmNewClubMember = () => {
        if (services.stores.helms.has(selectedNewMember)) {
            setSelectedHelm(services.stores.helms.get(selectedNewMember));
            return;
        }
        setSelectedClubMember(ClubMember.fromName(selectedNewMember));
    };

    const getHelmNameErrorMessage = (partialMatch) => {
        try {
            cleanName(partialMatch);
            return;
        }
        catch (err) {
            return err.message;
        }
    }

    return (
        <>
            <form onSubmit={(evt) => evt.preventDefault()}>
                <Flex direction={"column"} className="device-height fixed-height" width="100%" justifyContent={"center"} alignItems="center">
                    <Flex direction={"column"} height="100%" alignItems={"center"} width="100%">
                        {helmsIndex && !selectedClubMember &&

                            <AlertDialogWrapper
                                providedDisclosure={{ isOpen: isOpen, onClose }}
                                onConfirm={() => onConfirmNewClubMember()}
                                confirmColorScheme="green"
                                confirmButtonText="Confirm"
                                warningText="Are you sure you want to add a new OOD?"
                                deleteHeading={`Add new OOD: ${selectedNewMember}.`}
                            >
                                <Autocomplete
                                    customClassName="input-container-1 input-container"
                                    heading={"OOD"}
                                    data={helmsIndex.data}
                                    itemToString={(helm) => (helm ? helm.getName() : "")}
                                    filterData={(inputValue) => helmsIndex.search(inputValue)}
                                    handleSelectedItemChange={handleSelectedHelm}
                                    placeholder={"Enter name here..."}
                                    handleOnBlur={onNewHelmName}
                                    forceBlurOnExactMatch={true}
                                    getPartialMatchErrorMsg={getHelmNameErrorMessage}
                                />
                            </AlertDialogWrapper>
                        }
                        {
                            selectedClubMember && <NewHelm onNewHelm={onNewHelm} clubMember={selectedClubMember} />
                        }
                        <Spacer />
                        {selectedHelm &&
                            <GreenButton onClick={processHelmResult} autoFocus>Add OOD to race</GreenButton>
                        }
                        <RedButton tabIndex="-1" onClick={() => navigateBack()}>Cancel</RedButton>
                    </Flex>
                </Flex>
            </form>
        </>
    );
}

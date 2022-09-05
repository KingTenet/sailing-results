import React, { useEffect } from "react";
import { useState } from "react";
import Autocomplete from "./AutocompleteSimple";
import { useAppState, useServices } from "../useAppState";
import { parseURLDate, useBack, getURLDate, cleanName } from "../common"
import { Center, Text, Button, Flex, Spacer, useDisclosure } from '@chakra-ui/react'
import { useParams, useNavigate } from "react-router-dom";
import Race from "../store/types/Race";
import HelmResult from "../store/types/HelmResult";
import ClubMember from "../store/types/ClubMember";
import NewHelm from "./NewHelm";
import Helm from "../store/types/Helm";
import { GreenButton, RedButton } from "./Buttons";
import AlertDialogWrapper from "./AlertDialogWrapper";
import BackHeader from "./BackHeader";

function RegisterHelm({ addAnotherHelmWorkflow }) {
    const navigateBack = useBack();
    const [selectedHelm, setSelectedHelm] = useState(null);
    const [selectedNewMember, setSelectedNewMember] = useState(null);
    const [selectedClubMember, setSelectedClubMember] = useState(null);
    const [selectedBoat, setSelectedBoat] = useState(null);
    const [sailNumber, setSailNumber] = useState();
    const [showCommit, setShowCommit] = useState();

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

    const navigateTo = useNavigate();

    const processHelmResult = () => {
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
                    ].sort((helmA, helmB) => {
                        const helmAPI = services.getLatestHelmPersonalHandicap(HelmResult.getHelmId(helmA));
                        const helmBPI = services.getLatestHelmPersonalHandicap(HelmResult.getHelmId(helmB));
                        return helmBPI > helmAPI
                            || helmBPI === undefined ? -1 : 1;
                    }),
                };
            }
        });

        if (!addAnotherHelmWorkflow) {
            navigateBack();
        }
        else {
            navigateTo(`/races/${getURLDate(race.getDate())}/${race.getNumber()}/registerAnother/${HelmResult.getHelmId(newRegisteration)}`, { replace: true });
        }
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
        }
        else {
            setSailNumber(undefined);
            setSailNumberIndex(undefined);
        }
    },
        [selectedBoat]
    );

    useEffect(() => {
        if (selectedHelm) {
            setBoatsIndex(services.indexes.getBoatIndexForHelmRace(selectedHelm, race));
        }
        else {
            setSelectedBoat(undefined);
            setBoatsIndex(undefined);
        }
    }, [selectedHelm]);

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
                    <BackHeader heading="Register Helm" marginBottom="5px" />
                    <Flex direction={"column"} height="100%" width="100%" alignItems={"center"}>
                        {helmsIndex && !selectedClubMember &&
                            <AlertDialogWrapper
                                providedDisclosure={{ isOpen: isOpen, onClose }}
                                onConfirm={() => onConfirmNewClubMember()}
                                confirmColorScheme="green"
                                confirmButtonText="Confirm"
                                warningText="Do you want to add them?"
                                deleteHeading={`${selectedNewMember} is not a recognised member.`}
                            >
                                <Autocomplete
                                    customClassName="input-container-1 input-container"
                                    heading={"Helm"}
                                    data={helmsIndex.data}
                                    itemToString={(helm) => (helm ? helm.getName() : "")}
                                    filterData={(inputValue) => helmsIndex.search(inputValue)}
                                    handleSelectedItemChange={handleSelectedHelm}
                                    sortFn={(helmA, helmB) => helmA.getName() > helmB.getName() ? 1 : -1}
                                    placeholder={"Enter helm name here..."}
                                    handleOnBlur={onNewHelmName}
                                    forceBlurOnExactMatch={true}
                                    getPartialMatchErrorMsg={getHelmNameErrorMessage}
                                />
                            </AlertDialogWrapper>
                        }
                        {
                            selectedClubMember && <NewHelm onNewHelm={onNewHelm} clubMember={selectedClubMember} />
                        }
                        {selectedHelm && boatsIndex &&
                            <Autocomplete
                                customClassName="input-container-2 input-container"
                                heading={"Boat"}
                                data={boatsIndex.data}
                                itemToString={(boat) => (boat ? boat.getClassName() : "")}
                                filterData={(inputValue) => boatsIndex.search(inputValue)}
                                handleSelectedItemChange={setSelectedBoat}
                                getPartialMatchErrorMsg={(partialMatch) => `${partialMatch} is not a recognised boat class`}
                                placeholder={"Enter boat..."}
                                triggerExactMatchOnBlurIfValid={true}
                            />
                        }
                        {selectedBoat && sailNumberIndex &&
                            <>
                                <Autocomplete
                                    customClassName="input-container-3 input-container"
                                    heading={"Sail Number"}
                                    data={sailNumberIndex.data}
                                    itemToString={({ sailNumber }) => (sailNumber !== undefined ? sailNumber : "")}
                                    filterData={(inputValue) => {
                                        const matches = sailNumberIndex.search(inputValue);
                                        if (!matches.length && !isNaN(parseInt(inputValue))) {
                                            setShowCommit(true);
                                        }
                                        else if (showCommit) {
                                            setShowCommit(false);
                                        }
                                        return matches;
                                    }}
                                    handleSelectedItemChange={(item) => {
                                        if (item !== undefined) {
                                            const sailNumber = !isNaN(parseInt(item)) ? parseInt(item) : item.sailNumber;
                                            setSailNumber(sailNumber);
                                        }
                                        else {
                                            setSailNumber();
                                        }
                                    }}
                                    placeholder={"Enter boat sail number here..."}
                                    type={"number"}
                                    triggerExactMatchOnBlur={true}
                                />
                            </>
                        }
                        {sailNumber === undefined &&
                            <input className="hidden-input"></input>
                        }
                        <Spacer />
                        {(sailNumber !== undefined || showCommit) &&
                            <GreenButton onClick={() => processHelmResult()} autoFocus={sailNumber}>Register Helm</GreenButton>
                        }
                        <RedButton tabIndex="-1" onClick={() => navigateBack()}>Cancel</RedButton>
                    </Flex>
                </Flex>
            </form>
        </>
    );
}

export default RegisterHelm;

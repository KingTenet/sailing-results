import React from "react";
import { parseURLDate, useBack, getURLDate } from "../common"
import { Text, Button, Flex, Spacer } from '@chakra-ui/react'
import { useParams, useNavigate } from "react-router-dom";
import Race from "../store/types/Race";
import { GreenButton, RedButton } from "./Buttons";

export default function RegisterAnotherButtons() {
    const navigateBack = useBack();

    const params = useParams();
    const raceDateStr = params["raceDate"];
    const raceNumberStr = params["raceNumber"];
    const raceDate = parseURLDate(raceDateStr);
    const raceNumber = parseInt(raceNumberStr);
    const race = new Race(raceDate, raceNumber);

    const navigateTo = useNavigate();
    const registerAnother = () => navigateTo(`/races/${getURLDate(race.getDate())}/${race.getNumber()}/register`, { replace: true });

    return (
        <>
            <Spacer />
            <Flex direction="column" width="100%" alignItems={"center"}>
                <GreenButton onClick={() => registerAnother()} autoFocus={true}>Register Another Helm</GreenButton>
                <RedButton tabIndex="-1" onClick={() => navigateBack()}>Back to race editing</RedButton>
            </Flex>
        </>
    );
}

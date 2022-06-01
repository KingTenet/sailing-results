import React from "react";
import { parseURLDate, useBack, getURLDate } from "../common"
import { Text, Button, Flex } from '@chakra-ui/react'
import { useParams, useNavigate } from "react-router-dom";
import Race from "../store/types/Race";

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
        <Flex direction="column">
            <Button backgroundColor="green.500" onClick={() => registerAnother()} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus={true}><Text fontSize={"lg"}>Register Another Helm</Text></Button>
            <Button tabIndex="-1" backgroundColor="red.500" onClick={() => navigateBack()} marginLeft="50px" marginRight="50px" marginTop="50px"><Text fontSize={"lg"}>Back to race</Text></Button>
        </Flex>
    );
}

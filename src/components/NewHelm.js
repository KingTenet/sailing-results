import React, { useState } from "react";
import { useServices } from "../useAppState";
import { Text, Flex, Alert, AlertIcon, AlertTitle, Box, Input, InputGroup } from '@chakra-ui/react'
import { BlueButton, GreenButton } from "./Buttons";
import Helm from "../store/types/Helm";
import { CheckCircleIcon } from '@chakra-ui/icons'


const NEW_HELM_GENDERS = [
    "Male",
    "Female",
];

const NOVICE = "a Novice";

const NEW_HELM_EXPERIENCE = [
    NOVICE,
    "an Experienced",
];

function useDimensionsToggle(dimensions) {
    const [dimensionCounter, updateDimensionCounter] = useState(0);
    return [dimensions[dimensionCounter % dimensions.length], () => updateDimensionCounter(dimensionCounter + 1)];
}

export default function NewHelm({ clubMember, onNewHelm }) {
    const [gender, toggleGender] = useDimensionsToggle(NEW_HELM_GENDERS);
    const [experience, toggleExperience] = useDimensionsToggle(NEW_HELM_EXPERIENCE);
    const services = useServices();
    const [genderEnabled, setGenderEnabled] = useState(false);
    const [experienceEnabled, setExperienceEnabled] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const onConfirm = () => {
        setConfirmed(true);

        const getGender = (gender) => {
            switch (gender) {
                case "Male":
                    return Helm.Gender.MALE;
                case "Female":
                    return Helm.Gender.FEMALE;
                default:
                    throw new Error(`Support for gender:${gender} has not been added to the system yet.`);
            }
        };

        if (genderEnabled && experienceEnabled) {
            onNewHelm(services.createHelmFromClubMember(clubMember, getGender(gender), experience === NOVICE));
        }
    };

    return (
        <>
            <Box borderRadius={"12px"} borderWidth="1px" style={{ padding: "8px 15px 8px 15px" }}>
                <Flex direction={"row"}>
                    <Box minWidth="110px" paddingTop="5px">
                        <Text fontSize={"lg"}>{"Helm"}</Text>
                    </Box>
                    <Box>
                        <InputGroup>
                            <Input readOnly={true} onFocus="this.blur()" tabIndex="-1" placeholder={clubMember ? clubMember.getName() : ""} />
                        </InputGroup>
                    </Box>
                </Flex>
                {!confirmed &&
                    < Box minWidth="110px" paddingTop="10px">
                        <Alert status='error'>
                            <AlertIcon />
                            <AlertTitle mr={2}>{`${clubMember.getName()} has not raced before. Please provide some additional details.`}</AlertTitle>
                        </Alert>
                    </Box>
                }
                <Flex direction={"row"} marginTop="20px">
                    <Text fontSize={"large"} marginTop="7px">{clubMember.getName()} is</Text>
                    {!experienceEnabled &&
                        <BlueButton onClick={() => setExperienceEnabled(true)} style={{ marginLeft: "10px", opacity: "0.4" }} autoFocus>{experience}</BlueButton>
                    }
                    {experienceEnabled &&
                        <BlueButton onClick={() => toggleExperience(true)} style={{ marginLeft: "10px" }} autoFocus disabled={confirmed}>{experience}</BlueButton>
                    }
                    {!genderEnabled &&
                        <BlueButton onClick={() => setGenderEnabled(true)} style={{ marginLeft: "10px", opacity: "0.4" }}>{gender}</BlueButton>
                    }
                    {genderEnabled &&
                        <BlueButton onClick={() => toggleGender(true)} style={{ marginLeft: "10px" }} disabled={confirmed} autoFocus>{gender}</BlueButton>
                    }
                    <Text fontSize={"large"} marginTop="7px" marginLeft="10px" >sailor</Text>
                    {confirmed &&
                        <CheckCircleIcon marginLeft="10px" marginTop="13px" color='green.500' />
                    }
                </Flex>
                {genderEnabled && experienceEnabled && !confirmed &&
                    < GreenButton onClick={() => onConfirm()} style={{ marginLeft: "10px" }} disabled={confirmed}>Confirm</GreenButton>
                }
            </Box>
        </>
    );
}

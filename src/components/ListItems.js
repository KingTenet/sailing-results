import { EditIcon, HamburgerIcon } from "@chakra-ui/icons";
import { Box, Flex, Text, Grid, GridItem } from "@chakra-ui/react";
import React from "react";
import Result from "../store/types/Result";



function secondsToMinutesSeconds(totalSeconds) {
    const SECONDS_IN_MINUTE = 60;
    var minutes = Math.floor(totalSeconds / SECONDS_IN_MINUTE);
    var seconds = totalSeconds % SECONDS_IN_MINUTE;
    return [minutes, seconds];
}

function formatMinutesSeconds([minutes, seconds]) {
    const pad = (v) => {
        return `0${Math.round(v)}`.slice(v > 100 ? -3 : -2);
    }
    return [pad(minutes), pad(seconds)].join(":");
}

function formatBoatClass(className) {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    return className.split(" ").map((word) => capitalize(word.toLowerCase())).join(" ");
}

function ResultDimension({ children, ...props }) {
    return (
        <GridItem
            height='20px'
            maxWidth="100%"
            {...props}>
            <Text noOfLines={1}>{children}</Text>
        </GridItem>
    );
}

function ListItemWrapper({ children, dragHandleProps, ...props }) {
    return <>
        <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"} backgroundColor="white" {...props}>
            <Flex direction={"row"} justifyContent="space-between">
                {children}
                <div {...dragHandleProps}>
                    <HamburgerIcon boxSize={"5"} />
                </div>
            </Flex>
        </Box>
        <Box height={"3px"}></Box>
    </>
}

export function RegisteredListItem({ registered, onClick, ...props }) {
    const helmName = Result.getHelmId(registered);
    const boatClass = formatBoatClass(registered.getBoatClass().getClassName());
    const sailNumber = registered.getSailNumber();

    return (
        <ListItemWrapper onClick={onClick} {...props}>
            <Grid
                templateColumns='repeat(16, 1fr)'
                gap={5}
                width={"100%"}
            >
                <ResultDimension colSpan={6}>{helmName}</ResultDimension>
                <ResultDimension colSpan={6}>{boatClass}</ResultDimension>
                <ResultDimension colSpan={4}>{sailNumber}</ResultDimension>
            </Grid>
        </ListItemWrapper>
    );
}

export function DNFListItem({ result, onClick, ...props }) {
    const helmName = Result.getHelmId(result);
    const boatClass = formatBoatClass(result.getBoatClass().getClassName());
    const sailNumber = result.getSailNumber();

    return (
        <ListItemWrapper onClick={onClick} {...props}>
            <Grid
                templateColumns='repeat(16, 1fr)'
                gap={5}
                width={"100%"}
            >
                <ResultDimension colSpan={6}>{helmName}</ResultDimension>
                <ResultDimension colSpan={6}>{boatClass}</ResultDimension>
                <ResultDimension colSpan={4}>{sailNumber}</ResultDimension>
            </Grid>
        </ListItemWrapper>
    );
}

export function PursuitFinishListItem({ result, index, ...props }) {
    const helmName = Result.getHelmId(result);
    const boatClass = formatBoatClass(result.getBoatClass().getClassName());
    const sailNumber = result.getSailNumber();

    return (
        <ListItemWrapper {...props}>
            <Grid
                templateColumns='repeat(16, 1fr)'
                gap={3}
                width={"100%"}>
                <ResultDimension colSpan={1}>{index + 1}</ResultDimension>
                <ResultDimension colSpan={6}>{helmName}</ResultDimension>
                <ResultDimension colSpan={6}>{boatClass}</ResultDimension>
                <ResultDimension colSpan={3}>{sailNumber}</ResultDimension>
            </Grid>
        </ListItemWrapper>
    )
}

export function OODListItem({ ood, ...props }) {
    const helmName = Result.getHelmId(ood);

    return (
        <ListItemWrapper {...props}>
            <Grid templateColumns='repeat(1, 1fr)'>
                <ResultDimension colSpan={1}>{helmName}</ResultDimension>
            </Grid>
        </ListItemWrapper>
    )
}

export function FinisherListItem({ result, ...props }) {
    const helmName = Result.getHelmId(result);
    const boatClass = formatBoatClass(result.getBoatClass().getClassName());
    const sailNumber = result.getSailNumber();
    const finishTime = formatMinutesSeconds(secondsToMinutesSeconds(result.getFinishTime()));
    const laps = result.getLaps();
    const validFinish = result.isValidFinish();

    return <>
        <ListItemWrapper {...props}>
            <Grid
                templateColumns='repeat(17, 1fr)'
                gap={3}
                width={"100%"}>
                <ResultDimension colSpan={6}>{helmName}</ResultDimension>
                <ResultDimension colSpan={5}>{`${sailNumber}, ${boatClass}`}</ResultDimension>
                {validFinish && <ResultDimension colSpan={6}>{`${laps} lap${laps > 1 ? "s" : ""} in ${finishTime}`}</ResultDimension>}
                {!validFinish && <ResultDimension colSpan={6}>{"DNF"}</ResultDimension>}
            </Grid>
        </ListItemWrapper>
    </>
}
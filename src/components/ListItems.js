import { DeleteIcon, EditIcon, HamburgerIcon } from "@chakra-ui/icons";
import { Box, Flex, Text, Grid, GridItem, Spacer } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import Result from "../store/types/Result";
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'



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

function Slider({ disabled, onDelete, onDNF, children }) {
    const [{ x }, api] = useSpring(() => ({
        x: 0,
    }));
    const [latchedX, updateLatchedX] = useState();

    useEffect(() => {
        if (latchedX) {
            if (latchedX < 0) {
                onDNF();
            }
            else {
                onDelete();
            }
            updateLatchedX();
        }
    }, [latchedX])

    const MAX_X = 100;

    const bind = useDrag(
        ({ active, movement: [x, y], last }) => {
            if (disabled) {
                return api.start({
                    x: 0,
                    immediate: name => active && name === 'x',
                });
            }

            const xToUse = Math.max(Math.min(x, onDelete ? MAX_X : 0), onDNF ? -MAX_X : 0);
            if (last && y < 100 && !latchedX && (xToUse === MAX_X || xToUse === -MAX_X)) {
                updateLatchedX(xToUse);
            }

            return api.start({
                x: (active) ? xToUse : 0,
                immediate: name => active && name === 'x',
            });
        },
        // { axis: 'x' }
    )

    const avSize = x.to({
        map: Math.abs,
        range: [50, MAX_X],
        output: [0.6, 0.8],
        extrapolate: 'clamp',
    });

    return (
        <div className="container">
            <animated.div {...bind()} className={"item"} style={{ background: `linear-gradient(to right, rgba(219, 17, 17, 0.76) 0%, rgba(50, 50, 220, 0.8) 50%, rgba(253,249,24, 0.84) 100%) ` }}>
                <div className={"item"} style={{ width: "100%", display: "flex", alignItems: "space-between" }}>
                    <animated.div className={"av"} style={{ scale: avSize, justifySelf: "start", lineHeight: "35px" }} >
                        <DeleteIcon style={{ fontSize: "18pt" }} />
                    </animated.div >
                    <Spacer />
                    <animated.div className={"av"} style={{ fontSize: "12pt", fontWeight: "600", scale: avSize, lineHeight: "42px", justifySelf: "end" }} >
                        DNF
                    </animated.div >
                </div>
                <animated.div className={"fg"} style={{ x, touchAction: 'pan-y' }}>
                    {children}
                </animated.div>
            </animated.div >
        </div >
    );
}

function ListItemWrapper({ children, shortClickExceeded, onDNF, onDelete, draggableSnapshot, onClick, dragHandleProps, ...props }) {
    return <Slider
        onDelete={onDelete}
        onDNF={onDNF}
        disabled={draggableSnapshot.isDragging}
    >
        <Box
            className="list-item"
            as="button"
            textAlign="left"
            onClick={onClick}
        >
            <Flex direction={"row"} justifyContent="space-between">
                {children}
                <div {...dragHandleProps} >
                    <HamburgerIcon boxSize={"5"} />
                </div>
            </Flex>
        </Box>
    </Slider>
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


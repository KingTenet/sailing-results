import { ArrowBackIcon, ArrowForwardIcon, DeleteIcon, DragHandleIcon, EditIcon, HamburgerIcon } from "@chakra-ui/icons";
import { Box, Flex, Text, Grid, GridItem, Spacer, Icon } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import Result from "../store/types/Result";
import { useSpring, animated } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'


const SwipeIcon = (props) => (
    <Icon viewBox='200 200 400 400' {...props}>
        <path d="M506.5 362.32v-2.633 2.106c0 1.578 0 3.683.527 5.261-.527-1.578-.527-3.156-.527-4.734zM484.4 365.48c-5.79 0-11.051 1.578-15.262 4.21-4.734-9.995-14.734-16.84-26.309-16.84-5.79 0-11.051 1.579-15.262 4.212-4.734-9.996-14.734-16.84-26.309-16.84-4.21 0-8.945 1.05-12.629 2.633v-78.93c0-16.312-13.156-28.941-28.941-28.941s-28.941 13.156-28.941 28.94v131.55l-8.945-18.417c-4.211-11.051-15.262-18.941-27.363-18.941-3.157 0-6.84.527-9.996 1.578-7.368 2.633-13.156 7.894-16.312 15.262-3.157 6.84-3.684 14.734-1.051 22.102 0 0 0 .527.527.527l60.512 128.39c0 .527.527.527.527 1.05 6.313 9.474 13.68 17.892 22.625 25.259.528.527 1.051.527 1.579 1.05l1.05 1.051c17.363 12.63 37.887 19.47 59.461 19.47 53.672 0 97.875-42.099 99.977-95.243v-10.519l.004-73.676c.528-15.785-12.629-28.941-28.94-28.941zm-71.035 192.06c-17.891 0-34.73-5.262-48.938-15.785l-1.05-1.05c-1.052-1.052-2.106-1.579-3.157-2.106-6.84-5.79-12.629-12.102-17.363-19.47l-59.992-127.34c-1.05-3.156-1.05-6.312.527-9.472 1.578-3.156 3.684-5.262 6.84-6.313 6.313-2.105 13.68 1.051 15.785 7.368 0 0 0 .527.527.527l24.73 52.621c1.579 3.684 5.79 5.262 9.473 4.734 3.684-1.05 6.313-4.21 6.313-7.894V263.92c0-6.84 5.789-12.63 12.629-12.63s12.629 5.79 12.629 12.63v105.24c0 4.734 3.683 8.418 8.418 8.418s8.418-3.684 8.418-8.418c0-6.84 5.789-12.63 12.629-12.63s12.629 5.79 12.629 12.63v12.629c0 4.734 3.683 8.418 8.418 8.418s8.418-3.684 8.418-8.418c0-6.84 5.789-12.63 12.629-12.63s12.629 5.79 12.629 12.63v12.629c0 4.734 3.683 8.418 8.418 8.418s8.418-3.684 8.418-8.418c0-6.84 5.789-12.63 12.629-12.63s12.629 5.79 12.629 12.63v84.195c-4.2 44.2-40.508 78.927-85.234 78.927z" />
        <path d="M311.28 267.61h-41.57l9.473-9.473c3.156-3.156 3.156-8.418 0-11.578-3.157-3.156-8.418-3.156-11.578 0l-23.68 23.68c-1.051 1.051-1.578 1.578-1.578 2.633-1.051 2.106-1.051 4.211 0 6.313.527 1.05 1.05 2.105 1.578 2.632l23.68 23.68c1.578 1.578 3.683 2.633 5.789 2.633s4.21-1.05 5.789-2.633c3.156-3.156 3.156-8.418 0-11.578l-9.473-9.472h41.57c4.735 0 8.418-3.684 8.418-8.418.004-4.735-3.68-8.418-8.418-8.418zM477.56 272.87c-.527-1.05-1.05-2.106-1.578-2.633.523.528 1.05 1.578 1.578 2.633zM475.45 281.81c.527-.527 1.578-1.578 1.578-2.633 0 1.055-.527 1.578-1.578 2.633z" />
        <path d="M477.56 272.87c-.527-1.05-1.05-2.106-1.578-2.633l-23.68-23.68c-3.156-3.156-8.418-3.156-11.578 0-3.156 3.156-3.156 8.418 0 11.578l9.473 9.473h-41.57c-4.735 0-8.418 3.683-8.418 8.418 0 4.734 3.683 8.418 8.418 8.418h41.043l-9.473 9.473c-3.156 3.156-3.156 8.418 0 11.578 1.578 1.578 3.684 2.632 5.789 2.632s4.21-1.05 5.79-2.632l23.68-23.68c1.05-1.051 1.577-1.579 1.577-2.633 1.055-2.106 1.055-4.207.528-6.313z" />
    </Icon>
)

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

function Slider({ disabled, onDelete, onDNF, onClick, clickable, draggable, children }) {
    const [{ x, isActive }, api] = useSpring(() => ({
        x: 0,
        isActive: 0,
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
                    isActive: 0,
                    immediate: name => active && name === 'x',
                });
            }

            const xToUse = Math.max(Math.min(x, onDelete ? MAX_X : 0), onDNF ? -MAX_X : 0);
            if (last && y < 100 && !latchedX && (xToUse === MAX_X || xToUse === -MAX_X)) {
                updateLatchedX(xToUse);
            }

            return api.start({
                x: active ? xToUse : 0,
                isActive: active ? 1 : 0,
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
            <animated.div className={"item"} >
                <div className={"item slider-background"} >
                    <animated.div className={"av"} style={{ scale: avSize, justifySelf: "start", lineHeight: "35px" }} >
                        <DeleteIcon style={{ fontSize: "18pt" }} />
                    </animated.div >
                    <Spacer />
                    <animated.div className={"av"} style={{ fontSize: "12pt", fontWeight: "600", scale: avSize, lineHeight: "42px", justifySelf: "end" }} >
                        DNF
                    </animated.div >
                </div>
                <animated.div className={"fg hover"} style={{ x, opacity: isActive.to((v) => v ? 1 : 0), touchAction: 'pan-y' }}>
                    <div className="active item" >
                        <Box
                            className="list-item"
                            as="button"
                            textAlign="left"
                        >
                            <Flex direction={"row"} justifyContent="space-between">
                                {onDelete
                                    ? <ArrowForwardIcon boxSize={"5"} />
                                    : <div />
                                }
                                <Spacer />
                                {onDNF
                                    ? <ArrowBackIcon boxSize={"5"} />
                                    : <div />
                                }
                            </Flex>
                        </Box>
                    </div>
                </animated.div>
                <animated.div className={"fg"} style={{ x, opacity: isActive.to((v) => v ? 0 : 1), touchAction: 'pan-y' }}>
                    {children}
                </animated.div>
                <div className={"fg slide-handle"} onClick={onClick} {...bind()} />
            </animated.div >
        </div >
    );
}

function ListItemWrapper({ children, shortClickExceeded, onDNF, onDelete, draggableSnapshot = {}, onClick, dragHandleProps, ...props }) {
    const draggable = draggableSnapshot.isDragging !== undefined;

    return <Slider
        onDelete={onDelete}
        onDNF={onDNF}
        draggable={draggable}
        onClick={onClick}
        clickable={Boolean(onClick)}
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
                <Flex direction={"row"} justifyContent="space-between" style={{ position: "relative" }}>
                    <div  {...dragHandleProps} >
                        {
                            draggable
                                ? <DragHandleIcon boxSize={"5"} />
                                : onClick
                                    ? <EditIcon boxSize={"5"} />
                                    : <></>
                        }
                    </div>
                </Flex>
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


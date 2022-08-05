import React, { useEffect, useState, useRef } from "react";
import { Text, Spinner, Flex } from "@chakra-ui/react";

function SpinnerPage() {
    return (
        <Flex width="100vw" height="100vh" align={"center"} justify={"center"} direction="column">
            <Spinner color='blue.500' size="xl" />
            <Text marginLeft={"10px"} marginTop={"20px"}>Loading...</Text>
        </Flex>
    );
}

export default function SpinnerWithTimeout({ timeout = 0, children }) {
    const [started] = useState(Date.now());
    const [count, updateCount] = useState(0);
    const timeoutRef = useRef();

    const timeoutElapsed = Date.now() >= (started + timeout);

    useEffect(() => {
        if (timeoutElapsed) {
            return;
        }

        if (timeoutRef.current) {
            clearInterval(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => updateCount(count + 1), started + timeout - Date.now());
        return () => clearInterval(timeoutRef.current);

    }, [count]);

    if (!timeout || !timeoutElapsed) {
        return <SpinnerPage />;
    }

    return <>
        {children}
    </>
}

export function ForceSpinnerOld({ timeout = 100, children: getChildren }) {
    const [started] = useState(Date.now());
    const [count, updateCount] = useState(0);
    const timeoutRef = useRef();

    const timeoutElapsed = Date.now() >= (started + timeout);

    useEffect(() => {
        if (timeoutElapsed) {
            return;
        }

        if (timeoutRef.current) {
            clearInterval(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => updateCount(count + 1), started + timeout - Date.now());
        return () => clearInterval(timeoutRef.current);

    }, [count]);

    if (timeout && timeoutElapsed) {
        return <>
            {getChildren()}
        </>
    }

    return <SpinnerPage />;
}

export function ForceSpinner({ children: getChildren, threshold = 2 }) {
    const [count, updateCount] = useState(0);

    useEffect(() => {
        if (count < threshold) {
            window.requestAnimationFrame(() => updateCount(count + 1));
        }
    }, [count]);

    console.log("Rendering force spinner");

    if (count >= threshold) {
        return <>
            {getChildren()}
        </>
    }

    return <SpinnerPage />;
}
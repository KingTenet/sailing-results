
import { Button, Text } from "@chakra-ui/react";
import { useBack } from "../common"

export function BackButton({ children, ...props }) {
    const navigateBack = useBack();
    return (
        <RedButton
            onClick={() => navigateBack()}
            {...props}
        >
            {children}
        </RedButton>

    );
}

export function RedButton({ children, ...props }) {
    return (
        <Button
            backgroundColor="red.500"
            marginBottom="20px"
            maxWidth="500px"
            {...props}
        >
            <Text fontSize={"lg"}>{children}</Text>
        </Button>
    );
}

export function GreenButton({ children, ...props }) {
    return (
        <Button
            backgroundColor="green.500"
            marginBottom="20px"
            maxWidth="500px"
            {...props}
        >
            <Text fontSize={"lg"}>{children}</Text>
        </Button>
    );
}

export function BlueButton({ children, ...props }) {
    return (
        <Button
            backgroundColor="blue.500"
            marginBottom="20px"
            maxWidth="500px"
            {...props}
        >
            <Text fontSize={"lg"}>{children}</Text>
        </Button>
    );
}
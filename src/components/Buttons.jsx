
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
            className="nav-button"
            backgroundColor="red.500"
            {...props}
        >
            <Text fontSize={"lg"}>{children}</Text>
        </Button>
    );
}

export function GreenButton({ children, ...props }) {
    return (
        <Button
            className="nav-button"
            backgroundColor="green.500"
            {...props}
        >
            <Text fontSize={"lg"}>{children}</Text>
        </Button>
    );
}

export function BlueButton({ children, ...props }) {
    return (
        <Button
            className="nav-button"
            backgroundColor="blue.500"
            {...props}
        >
            <Text fontSize={"lg"}>{children}</Text>
        </Button>
    );
}

export function YellowButton({ children, ...props }) {
    return (
        <Button
           className="nav-button"
            backgroundColor="yellow.500"
            {...props}
        >
            <Text fontSize={"lg"}>{children}</Text>
        </Button>
    );
}
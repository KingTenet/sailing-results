import { Box, Flex, Text, Spacer } from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";

export function DroppableHeader({ isDraggingOver, heading }) {
    return (
        <Flex direction="row">
            <Text paddingLeft="10px" fontSize="20px">{heading}</Text>
        </Flex>
    );
}

export function RegisteredDroppableHeader({ isDraggingOver }) {
    return <DroppableHeader heading={"Registered"} isDraggingOver={isDraggingOver} />;
}

export function FinishedDroppableHeader({ isDraggingOver }) {
    return <DroppableHeader heading={"Finished"} isDraggingOver={isDraggingOver} />;
}

export function OODDroppableHeader({ isDraggingOver }) {
    return <DroppableHeader heading={"OODs"} isDraggingOver={isDraggingOver} />;
}

export function DNFDroppableHeader({ isDraggingOver, listItems }) {
    return (
        <Flex direction="row">
            <Text paddingLeft="10px" fontSize="20px">DNF</Text>
            {listItems && !Boolean(listItems.length)
                && <Text fontSize="15px" marginTop="5px" marginLeft="80px">Drag any non-finishers here!</Text>
            }
        </Flex>
    );
}

export function DeleteDroppableHeader({ isDraggingOver, placeholder }) {
    if (placeholder) {
        return (
            <Flex direction="row">
                <Box boxSize="2em" />
                <Spacer />
                <Text paddingLeft="20px" fontSize="20px"></Text>
                <Spacer />
                <Box boxSize="2em" />
            </Flex>
        );
    }

    return (
        <Flex direction="row">
            <DeleteIcon boxSize="2em" />
            <Spacer />
            <Text paddingLeft="20px" fontSize="20px">Drag to delete</Text>
            <Spacer />
            <DeleteIcon boxSize="2em" />
        </Flex>
    );
}
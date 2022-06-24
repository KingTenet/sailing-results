import { Box } from "@chakra-ui/react";

const BASE_DROPPABLE_STYLE = {
    width: "100%",
    backgroundColor: "lightBlue",
    borderRadius: "12px",
    borderColor: "DarkSlateGray",
    borderWidth: "0px 0px 0px 0px",
    padding: "10px 5px 10px 5px",
    borderStyle: "solid",
    marginBottom: "10px",
    // margin: "0px 0px 10px 0px",
};

const DEFAULT_DROPPABLE_HIGHLIGHT_STYLE = {
    backgroundColor: "lightBlue",
    borderColor: "darkGreen",
    borderStyle: "dashed",
    borderWidth: "2px 2px 2px 2px",
    padding: "8px 3px 8px 3px",
}

function getDroppableStyleForHighlight(
    highlightStyles = DEFAULT_DROPPABLE_HIGHLIGHT_STYLE,
    baseStyle = BASE_DROPPABLE_STYLE
) {
    return (isDraggingOver) => {
        if (!isDraggingOver) {
            return {
                ...BASE_DROPPABLE_STYLE,
                ...baseStyle,
            };
        }

        return {
            ...BASE_DROPPABLE_STYLE,
            ...baseStyle,
            ...DEFAULT_DROPPABLE_HIGHLIGHT_STYLE,
            ...highlightStyles,
        };
    }
}

const registeredGetDroppableStyle = getDroppableStyleForHighlight({

}, {
    ...BASE_DROPPABLE_STYLE,
    backgroundColor: "lightBlue",
});

const defaultGetDroppableStyle = getDroppableStyleForHighlight({
    backgroundColor: "lightGreen",
    borderStyle: "dashed",
    borderWidth: "2px",
    // borderRadius: "10px",
    borderColor: "darkGreen",
}, {
    ...BASE_DROPPABLE_STYLE,
    backgroundColor: "lightGreen",
});

const deleteGetDroppableStyle = getDroppableStyleForHighlight({
    backgroundColor: "pink",
    borderStyle: "dashed",
    borderWidth: "2px",
    // borderRadius: "10px",
    borderColor: "red",
}, {
    ...BASE_DROPPABLE_STYLE,
    minHeight: "52px",
    backgroundColor: "pink",
});

const dnfGetDroppableStyle = getDroppableStyleForHighlight({
    backgroundColor: "#ffc680",
    borderStyle: "dashed",
    borderWidth: "2px",
    // borderRadius: "10px",
    borderColor: "DarkOrange",
}, {
    ...BASE_DROPPABLE_STYLE,
    backgroundColor: "#ffc680",
    // borderColor: "DarkOrange",
});

const placeholderStyle = getDroppableStyleForHighlight(undefined, { backgroundColor: "inherit", });

export function RegisteredCard({ isDraggingOver, ...props }) {
    return <Box style={registeredGetDroppableStyle(isDraggingOver)} {...props} />
}

export function PlaceholderCard({ isDraggingOver, ...props }) {
    return <Box style={placeholderStyle(isDraggingOver)} {...props} />
}

export function DeleteCard({ isDraggingOver, ...props }) {
    return <Box style={deleteGetDroppableStyle(isDraggingOver)} {...props} />
}

export function DNFCard({ isDraggingOver, ...props }) {
    return <Box style={dnfGetDroppableStyle(isDraggingOver)} {...props} />
}

export function FinishersCard({ isDraggingOver, ...props }) {
    return <Box style={defaultGetDroppableStyle(isDraggingOver)} {...props} />
}

export function RacesCard({ isDraggingOver, ...props }) {
    return <Box style={registeredGetDroppableStyle(isDraggingOver)} {...props} />
}
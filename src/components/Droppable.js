import { Box } from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export function DroppableContext({ setIsDragging, onDragEnd, children }) {
    const handleDragEnd = (...props) => {
        setIsDragging(false);
        onDragEnd(...props);
    };

    return (
        <DragDropContext onDragEnd={(...props) => handleDragEnd(...props)} onBeforeCapture={() => setIsDragging(true)}>
            {children}
        </DragDropContext>
    );
}

export function DroppableList({ DraggableListItem, listItems = [], droppableId, DroppableHeader, isDropDisabled, DroppableContainer, getId }) {
    return (
        < DroppableWrapper
            droppableId={droppableId}
            isDropDisabled={isDropDisabled || false}
        >
            {(isDraggingOver, placeholder) =>
                <DroppableContainer isDraggingOver={isDraggingOver}>
                    {DroppableHeader && <DroppableHeader isDraggingOver={isDraggingOver} listItems={listItems} />}
                    {listItems.map((item, index) =>
                        <Draggable
                            key={getId(item)}
                            draggableId={`${droppableId}${getId(item)}`}
                            index={index}
                        >
                            {(draggableProvided, draggableSnapshot) =>
                                <Box
                                    key={getId(item)}
                                    ref={draggableProvided.innerRef}
                                    {...draggableProvided.draggableProps}
                                >
                                    <DraggableListItem item={item} index={index} draggableSnapshot={draggableSnapshot} dragHandleProps={draggableProvided.dragHandleProps} />
                                </Box>
                            }
                        </Draggable>
                    )}
                    {placeholder}
                </DroppableContainer>
            }
        </DroppableWrapper >
    );
}

const DroppableWrapper = ({ droppableId, children, isDropDisabled }) => {
    return (
        <Droppable
            droppableId={droppableId}
            isDropDisabled={isDropDisabled}
        >
            {(droppableProvided, snapshot) =>
                <Box
                    width="100%"
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                >
                    {children(snapshot.isDraggingOver, droppableProvided.placeholder)}
                </Box>
            }
        </Droppable>
    )
};
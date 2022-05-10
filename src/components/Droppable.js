import { Box } from "@chakra-ui/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export function DroppableContext({ setIsDragging, children }) {
    return (
        <DragDropContext onDragEnd={() => setIsDragging(false)} onBeforeCapture={() => setIsDragging(true)}>
            {children}
        </DragDropContext>
    );
}

export function DroppableList({ DraggableListItem, listItems = [], droppableId, DroppableHeader, isDropDisabled, getDroppableStyle, getId }) {
    return (
        < DroppableWrapper
            droppableId={droppableId}
            isDropDisabled={isDropDisabled || false}
        >
            {(isDraggingOver, placeholder) =>
                <Box style={getDroppableStyle(isDraggingOver)}>
                    {DroppableHeader && <DroppableHeader isDraggingOver={isDraggingOver} listItems={listItems} />}
                    {listItems.map((item, index) =>
                        <Draggable
                            key={getId(item)}
                            draggableId={`${droppableId}${getId(item)}`}
                            index={index}
                        >
                            {(draggableProvided) =>
                                <Box
                                    key={getId(item)}
                                    ref={draggableProvided.innerRef}
                                    {...draggableProvided.draggableProps}
                                    {...draggableProvided.dragHandleProps}
                                >
                                    <DraggableListItem item={item} index={index} />
                                </Box>
                            }
                        </Draggable>
                    )}
                    {placeholder}
                </Box>
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
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                >
                    {children(snapshot.isDraggingOver, droppableProvided.placeholder)}
                </Box>
            }
        </Droppable>
    )
};

import React from "react";
import { Box, Button, useDisclosure } from "@chakra-ui/react";

import {
    AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from "@chakra-ui/react";

export default function AlertDialogWrapper
    ({ children, deleteHeading, onConfirm, confirmButtonText = "Delete", providedDisclosure }) {
    const cancelRef = React.useRef();

    const disclosure = useDisclosure();
    const { isOpen, onOpen, onClose } = {
        ...disclosure,
        ...(providedDisclosure || {}),
    };

    const onDelete = () => {
        onClose();
        onConfirm();
    }

    return (
        <>
            <Box onClick={() => providedDisclosure || onOpen()}>
                {children}
            </Box>
            <>
                <AlertDialog
                    isOpen={isOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={onClose}
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                                {deleteHeading}
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                Are you sure? This action cannot be undone.
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button colorScheme='red' onClick={onDelete} ml={3}>
                                    {confirmButtonText}
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            </>
        </>
    )
}

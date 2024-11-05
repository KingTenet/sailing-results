import React, { useEffect, useRef } from "react";
import { Box, Button, Portal, useDisclosure } from "@chakra-ui/react";
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";

const ContainedAlertDialog = ({
  children,
  deleteHeading,
  onConfirm,
  confirmButtonText = "Delete",
  confirmColorScheme = "red",
  warningText = "Are you sure? This action cannot be undone.",
  providedDisclosure,
}) => {
  const cancelRef = useRef();
  const containerRef = useRef();

  // Find the tablet screen container on mount
  useEffect(() => {
    containerRef.current = document.querySelector(".tablet-screen-container");
  }, []);

  const disclosure = useDisclosure();
  const { isOpen, onOpen, onClose } = {
    ...disclosure,
    ...(providedDisclosure || {}),
  };

  const onDelete = () => {
    onClose();
    onConfirm();
  };

  return (
    <>
      <Box width="100%" onClick={() => providedDisclosure || onOpen()}>
        {children}
      </Box>
      <Portal containerRef={containerRef}>
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent
              mx={4}
              my="auto"
              maxW="90%"
              position="relative"
              top="auto"
              transform="none"
            >
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                {deleteHeading}
              </AlertDialogHeader>

              <AlertDialogBody>{warningText}</AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme={confirmColorScheme}
                  onClick={onDelete}
                  ml={3}
                >
                  {confirmButtonText}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Portal>
    </>
  );
};

export default ContainedAlertDialog;

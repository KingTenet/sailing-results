import React, { useState } from 'react'
import { useCombobox } from 'downshift'

import {
    Alert,
    AlertIcon,
    AlertTitle,
    Flex,
    Box,
    Text,
    Heading,
    Input,
    Button,
    InputGroup,
    InputRightElement,
    Spacer,
    Collapse,
} from '@chakra-ui/react'

import { CheckCircleIcon } from '@chakra-ui/icons'

function CollapseEx({ children, isOpen }) {
    return (
        <>
            <Collapse in={isOpen} animateOpacity>
                <Box
                    p='40px'
                    color='white'
                    mt='4'
                    bg='teal.500'
                    rounded='md'
                    shadow='md'
                >
                    {children}
                </Box>
            </Collapse>
        </>
    )
}

export default function ({ data, itemToString, filterData, heading, placeholder, handleSelectedItemChange, createNewMessage, getInvalidItemString }) {
    const [inputItems, setInputItems] = useState(data);
    const [partialMatch, setPartialMatch] = useState();
    const exactMatch = partialMatch === undefined ? undefined : partialMatch === false;

    const addToIndex = () => console.log("blah");

    const {
        isOpen,
        getToggleButtonProps,
        getLabelProps,
        getMenuProps,
        getInputProps,
        getComboboxProps,
        highlightedIndex,
        getItemProps,
    } = useCombobox({
        items: inputItems,
        itemToString,
        onSelectedItemChange: ({ selectedItem }) => {
            console.log(`In onSelectedItemChange with ${itemToString(selectedItem)}`)
            setPartialMatch(false);
            handleSelectedItemChange(selectedItem);
        },
        onInputValueChange: ({ inputValue }) => {
            console.log(`In onInputValueChange with ${inputValue}`)
            let exactMatch = data.find((item) => itemToString(item).toLowerCase() === inputValue.toLowerCase());
            if (exactMatch) {
                setPartialMatch(false);
                setInputItems([]);
                handleSelectedItemChange(exactMatch);
            }
            else {
                setPartialMatch(inputValue);
                setInputItems(filterData(inputValue));
                handleSelectedItemChange();
            }
        }
    });

    console.log(`Rendering with isOpen:${isOpen} partialMatch:${partialMatch}`)
    return (
        <>
            <Box borderRadius={"12px"} borderWidth="1px" padding="20px">
                <Flex direction={"column"}>
                    <Text fontSize={"lg"}>{heading}</Text>
                    <Spacer />
                    <Box {...getComboboxProps()}>
                        <InputGroup>
                            <>
                                {!exactMatch &&
                                    <Input {...getInputProps()} autoFocus placeholder={placeholder} />
                                }
                                {exactMatch &&
                                    <>
                                        <Input {...getInputProps()} placeholder={placeholder} readOnly={true} onFocus="this.blur()" tabIndex="-1" />
                                        <InputRightElement children={<CheckCircleIcon color='green.500' />} />
                                    </>
                                }
                            </>
                        </InputGroup>
                    </Box>
                    <Spacer />
                    <CollapseEx isOpen={isOpen && inputItems.length && exactMatch === false}>
                        <ul {...getMenuProps()}>
                            {inputItems.slice(0, 4).map((item, index) => (
                                <Box
                                    margin="5px"
                                    padding="10px"
                                    borderWidth="1px"
                                    borderRadius="base"
                                    backgroundColor={highlightedIndex === index ? "red.500" : ""}
                                    key={`${itemToString(item)}${index}`}
                                    {...getItemProps({ item, index })}
                                >
                                    <Heading fontSize={"lg"}>{itemToString(item)}</Heading>
                                </Box>
                            )
                            )}
                        </ul>
                    </CollapseEx>
                    {exactMatch === false && partialMatch &&
                        <>
                            <Spacer />
                            <Button
                                backgroundColor="green.500"
                                onClick={() => addToIndex()}
                                width="100%">
                                <Text fontSize={"lg"}>{createNewMessage}</Text></Button>
                        </>
                    }
                    {exactMatch === false && !isOpen &&
                        <>
                            <Spacer />
                            <Alert status='error'>
                                <AlertIcon />
                                <AlertTitle mr={2}>{getInvalidItemString(partialMatch)}</AlertTitle>
                            </Alert>
                        </>
                    }
                    <Spacer />
                </Flex>
            </Box>
        </>
    )
}
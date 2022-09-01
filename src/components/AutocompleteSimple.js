import React, { useEffect, useState } from 'react'
import { useCombobox } from 'downshift'

import {
    Flex,
    Box,
    Text,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Spacer,
    Collapse,
    Alert,
    AlertIcon,
    AlertTitle,
} from '@chakra-ui/react'

import { CheckCircleIcon } from '@chakra-ui/icons'

function CollapseEx({ children, isOpen }) {
    return (
        <>
            <Collapse in={isOpen} animateOpacity>
                <Box>
                    {children}
                </Box>
            </Collapse>
        </>
    )
}

function getMenuItems(inputItems, initialItems) {
    if (inputItems.length) {
        return inputItems;
    }
    return initialItems;
}

export default function ({ customClassName = "input-container-1 input-container", sortFn, data, itemToString, filterData, heading, placeholder, handleSelectedItemChange, openOnFocus = true, type = "text", triggerExactMatchOnBlur = false, forceBlurOnExactMatch, handleOnBlur, getPartialMatchErrorMsg }) {
    const [inputItems, setInputItems] = useState(data);
    const [partialMatch, setPartialMatch] = useState();
    const [errorMessage, setErrorMessage] = useState();
    const exactMatch = partialMatch === undefined
        ? undefined
        : partialMatch === false

    const setExactMatch = (value) => {
        setPartialMatch(false);
        setInputItems([]);
        handleSelectedItemChange(value);
    };

    const setPartiaValue = (value) => {
        setPartialMatch(value);
        setInputItems(filterData(value));
        if (value && getPartialMatchErrorMsg && errorMessage) {
            setErrorMessage(getPartialMatchErrorMsg(value));
        }
    };

    const {
        isOpen,
        getMenuProps,
        getInputProps,
        getComboboxProps,
        highlightedIndex,
        getItemProps,
    } = useCombobox({
        items: inputItems,
        itemToString,
        onSelectedItemChange: ({ selectedItem }) => {
            setExactMatch(selectedItem);
        },
        onInputValueChange: ({ inputValue }) => {
            let exactMatch = data.find((item) => itemToString(item).toLowerCase() === inputValue.toLowerCase());
            if (forceBlurOnExactMatch && exactMatch) {
                setExactMatch(exactMatch);
            }
            else {
                setPartiaValue(inputValue);
            }
        }
    });

    const menuIsOpen = () => {
        if (exactMatch) {
            return false;
        }

        if (isOpen && inputItems.length) {
            return true;
        }

        if (partialMatch === undefined && openOnFocus && data.length) {
            return true;
        }
    }

    useEffect(() => {
        if (triggerExactMatchOnBlur && partialMatch !== undefined && partialMatch !== false && !isOpen) {
            setExactMatch(partialMatch);
        }
        if (handleOnBlur && partialMatch !== undefined && partialMatch !== false && !isOpen) {
            handleOnBlur(partialMatch);
        }
        if (getPartialMatchErrorMsg && partialMatch) {
            setErrorMessage(getPartialMatchErrorMsg(partialMatch));
        }
    }, [isOpen]);

    return (
        <>
            {/* {exactMatch &&
                <Box borderRadius={"12px"} borderWidth="1px" width="100%" style={{ padding: "8px 15px 8px 15px" }} className={customClassName}>
                    <Flex direction={"row"}>
                        <Box minWidth="110px" paddingTop="5px">
                            <Text fontSize={"lg"}>{heading}</Text>
                        </Box>
                        <Box {...getComboboxProps()} width="100%">
                            <InputGroup>
                                <Input bgColor="white" {...getInputProps()} readOnly={true} width="100%" onFocus="this.blur()" tabIndex="-1" />
                                <InputRightElement children={<CheckCircleIcon color='green.500' />} />
                            </InputGroup>
                        </Box>
                    </Flex>
                </Box>
            } */}

            <Box borderRadius={"12px"} borderWidth="1px" width="100%" style={{ padding: "8px 15px 8px 15px" }} className={customClassName}>
                <Flex direction={"column"}>
                    <Flex direction={"row"} className={"autocomplete-input"}>
                        <Box minWidth="110px" paddingTop="5px">
                            <Text fontSize={"lg"}>{heading}</Text>
                        </Box>
                        <Box {...getComboboxProps()} width="100%">
                            <InputGroup>
                                <Input bgColor="white" {...getInputProps()} autoFocus placeholder={placeholder} type={type} />
                            </InputGroup>
                        </Box>
                    </Flex>
                    {!exactMatch && errorMessage &&
                        <Box className={"autocomplete-error"}>
                            <Alert status='error'>
                                <AlertIcon />
                                <AlertTitle mr={2}>{errorMessage}</AlertTitle>
                            </Alert>
                        </Box>
                    }
                    <Spacer />
                    <CollapseEx isOpen={menuIsOpen()}>
                        <ul {...getMenuProps()}>
                            {getMenuItems(inputItems, data)
                                .slice(0, 8)
                                .map((item, index) => [item, index])
                                .sort(([itemA, indexA], [itemB, indexB]) => sortFn && !partialMatch ? sortFn(itemA, itemB) : indexA - indexB)
                                .map(([item, index]) => (
                                    <Box
                                        shadow='md'
                                        marginTop="8px"
                                        marginBottom="5px"
                                        padding={highlightedIndex === index ? "11px" : "12px"}
                                        borderWidth={highlightedIndex === index ? "2px" : "1px"}
                                        borderColor="gray"
                                        borderRadius="base"
                                        backgroundColor="white"
                                        key={`${itemToString(item)}${index}`}
                                        {...getItemProps({ item, index })}
                                    >
                                        <Heading fontSize={"lg"}>{itemToString(item)}</Heading>
                                    </Box>
                                ))}
                        </ul>
                    </CollapseEx>
                    <Spacer />
                </Flex>
            </Box>
        </>
    )
}
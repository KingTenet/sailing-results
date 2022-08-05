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
} from '@chakra-ui/react'

import { CheckCircleIcon } from '@chakra-ui/icons'

function CollapseEx({ children, isOpen }) {
    return (
        <>
            <Collapse in={isOpen} animateOpacity>
                <Box
                // p='5px'
                // color='white'
                // mt='4'
                // bg='teal.500'
                // rounded='md'
                // shadow='md'
                >
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

export default function ({ customClassName = "input-container-1 input-container", sortFn, data, itemToString, filterData, heading, placeholder, handleSelectedItemChange, openOnFocus = true, type = "text", triggerExactMatchOnBlur = false }) {
    const [inputItems, setInputItems] = useState(data);
    const [partialMatch, setPartialMatch] = useState();
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
            if (exactMatch) {
                // Re-enable to automatically force blur on any match (which is annoying due to subsets being valid)
                // setExactMatch(exactMatch);
            }
            setPartiaValue(inputValue);
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
    }, [isOpen]);

    return (
        <>
            {exactMatch &&
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
            }
            {!exactMatch &&
                <Box borderRadius={"12px"} borderWidth="1px" width="100%" style={{ padding: "8px 15px 8px 15px" }} className={customClassName}>
                    <Flex direction={"column"}>
                        <Flex direction={"row"} >
                            <Box minWidth="110px" paddingTop="5px">
                                <Text fontSize={"lg"}>{heading}</Text>
                            </Box>
                            <Box {...getComboboxProps()} width="100%">
                                <InputGroup>
                                    <>
                                        {!exactMatch &&
                                            <Input bgColor="white" {...getInputProps()} autoFocus placeholder={placeholder} type={type} />
                                        }
                                        {exactMatch &&
                                            <>
                                                <Input bgColor="white" {...getInputProps()} readOnly={true} width="100%" onFocus="this.blur()" tabIndex="-1" />
                                                <InputRightElement children={<CheckCircleIcon color='green.500' />} />
                                            </>
                                        }
                                    </>
                                </InputGroup>
                            </Box>
                        </Flex>
                        <Spacer />
                        <CollapseEx isOpen={menuIsOpen()}>
                            <ul {...getMenuProps()}>
                                {getMenuItems(inputItems, data)
                                    .slice(0, 6)
                                    .map((item, index) => [item, index])
                                    .sort(([itemA, indexA], [itemB, indexB]) => sortFn && !partialMatch ? sortFn(itemA, itemB) : indexA - indexB)
                                    .map(([item, index]) => (
                                        <Box
                                            shadow='md'
                                            marginTop="8px"
                                            marginBottom="5px"
                                            padding="12px"
                                            borderWidth="1px"
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
            }
        </>
    )
}
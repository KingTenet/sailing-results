import React, { useEffect, useState } from "react";
import { useCombobox } from "downshift";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { ShadCNWrapper } from "@/components/ShadCNWrapper";
import { cn } from "@/lib/utils";

function CollapseEx({ children, isOpen }) {
    if (!isOpen) return null;
    return <div className="mt-1">{children}</div>;
}

export default function Autocomplete({
    sortFn,
    data,
    itemToString,
    filterData,
    heading,
    placeholder,
    handleSelectedItemChange,
    openOnFocus = true,
    type = "text",
    triggerExactMatchOnBlur = false,
    triggerExactMatchOnBlurIfValid = false,
    forceBlurOnExactMatch,
    handleOnBlur,
    getPartialMatchErrorMsg,
}) {
    const [inputItems, setInputItems] = useState(data);
    const [partialMatch, setPartialMatch] = useState();
    const [errorMessage, setErrorMessage] = useState();
    const [canShowErrors, setCanShowErrors] = useState();
    const [exactMatch, setWrappedExactMatch] = useState();
    const [blurEventCount, setBlurEventCount] = useState(0);

    const setExactMatch = (value) => {
        setWrappedExactMatch(value);
        setInputItems([]);
        handleSelectedItemChange(value);
    };

    const resetExactMatch = () => {
        setWrappedExactMatch();
        setInputItems(filterData(partialMatch));
        handleSelectedItemChange();
    };

    const handleErrorMessage = (value) => {
        if (getPartialMatchErrorMsg) {
            setErrorMessage(getPartialMatchErrorMsg(value));
        }
    };

    const {
        isOpen,
        getMenuProps,
        getInputProps,
        highlightedIndex,
        getItemProps,
    } = useCombobox({
        items: inputItems,
        itemToString,
        onSelectedItemChange: ({ selectedItem }) => {
            setExactMatch(selectedItem);
        },
        onInputValueChange: ({ inputValue }) => {
            setPartialMatch(inputValue);
        },
    });

    useEffect(() => {
        if (partialMatch === undefined) {
            return;
        }

        setInputItems(filterData(partialMatch));
        handleErrorMessage(partialMatch);

        if (exactMatch === undefined && forceBlurOnExactMatch) {
            let exactMatch = data.find(
                (item) =>
                    itemToString(item).toLowerCase() ===
                    partialMatch.toLowerCase(),
            );
            if (exactMatch) {
                setExactMatch(exactMatch);
            }
        }
    }, [partialMatch]);

    useEffect(() => {
        if (exactMatch) {
            setPartialMatch(itemToString(exactMatch));
        }
    }, [exactMatch]);

    useEffect(() => {
        if (isOpen) {
            resetExactMatch();
            setCanShowErrors(false);
            return;
        }
        setTimeout(() => setBlurEventCount(blurEventCount + 1), 0);
    }, [isOpen]);

    useEffect(() => {
        if (exactMatch === undefined && partialMatch !== undefined) {
            const exactMatch = data.find(
                (item) =>
                    itemToString(item).toLowerCase() ===
                    partialMatch.toLowerCase(),
            );
            if (exactMatch && triggerExactMatchOnBlurIfValid) {
                setExactMatch(exactMatch);
            } else if (triggerExactMatchOnBlur) {
                setExactMatch(partialMatch);
            }
            if (handleOnBlur) {
                handleOnBlur(partialMatch);
            }
        }
        setCanShowErrors(true);
    }, [blurEventCount]);

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
    };

    return (
        <ShadCNWrapper>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="min-w-[110px]">
                        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {heading}
                        </span>
                    </div>
                    <div className="flex-1">
                        <Input
                            {...getInputProps()}
                            placeholder={placeholder}
                            type={type}
                        />
                    </div>
                </div>

                {!exactMatch && errorMessage && canShowErrors && (
                    <Alert variant="destructive">
                        <AlertTitle>{errorMessage}</AlertTitle>
                    </Alert>
                )}

                <CollapseEx isOpen={menuIsOpen()}>
                    <ul {...getMenuProps()} className="mt-2 space-y-1">
                        {getMenuItems(inputItems, data)
                            .slice(0, 6)
                            .map((item, index) => [item, index])
                            .sort(([itemA, indexA], [itemB, indexB]) =>
                                sortFn && !partialMatch
                                    ? sortFn(itemA, itemB)
                                    : indexA - indexB,
                            )
                            .map(([item, index]) => (
                                <li
                                    key={`${itemToString(item)}${index}`}
                                    {...getItemProps({ item, index })}
                                >
                                    <Card
                                        className={cn(
                                            "transition-colors",
                                            highlightedIndex === index &&
                                                "bg-accent",
                                        )}
                                    >
                                        <CardContent className="p-3">
                                            <span className="text-sm font-medium">
                                                {itemToString(item)}
                                            </span>
                                        </CardContent>
                                    </Card>
                                </li>
                            ))}
                    </ul>
                </CollapseEx>
            </div>
        </ShadCNWrapper>
    );
}

function getMenuItems(inputItems, initialItems) {
    if (inputItems.length) {
        return inputItems;
    }
    return initialItems;
}

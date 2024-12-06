import React, { useEffect, useState } from "react";
import { useCombobox } from "downshift";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { ShadCNWrapper } from "@/components/shadcn/ShadCNWrapper";
import { cn } from "@/lib/utils";
import { cx } from "class-variance-authority";

function CollapseEx({ children, isOpen }) {
    if (!isOpen) return null;
    return (
        <div className="relative z-10 mt-2 w-full">
            <Card className="absolute w-full">
                <CardContent className="mt-6">{children}</CardContent>
            </Card>
        </div>
    );
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
        selectedItem,
        getToggleButtonProps,
        getLabelProps,
    } = useCombobox({
        items: inputItems,
        itemToString,
        onSelectedItemChange: ({ selectedItem }) => {
            console.log("In onSelectedItemChange");
            setExactMatch(selectedItem);
        },
        onInputValueChange: ({ inputValue }) => {
            console.log("In onInputValueChange");
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

    const menuIsOpen = () => {
        return isOpen;
    };

    return (
        <ShadCNWrapper>
            <div className="m-6 mx-0">
                <div className="flex items-center gap-2">
                    <div className="min-w-[110px]">
                        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {heading}
                        </span>
                    </div>

                    <Input
                        {...getInputProps()}
                        placeholder={placeholder}
                        type={type}
                        autoFocus={true}
                    />
                    {/* <button
                        aria-label="toggle menu"
                        className="px-2"
                        type="button"
                        {...getToggleButtonProps()}
                    >
                        {isOpen ? <>&#8593;</> : <>&#8595;</>}
                    </button> */}
                </div>
            </div>
            <div>
                <div className="flex w-72 flex-col gap-1">
                    <div className="flex gap-0.5 bg-white shadow-sm"></div>
                </div>
                <ul
                    className={`absolute z-10 mt-1 max-h-80 w-72 overflow-scroll bg-white p-0 shadow-md ${
                        !(isOpen && data.length) && "hidden"
                    }`}
                    {...getMenuProps()}
                >
                    {isOpen &&
                        inputItems.slice(0, 6).map((item, index) => (
                            <li
                                className={cx(
                                    highlightedIndex === index && "bg-blue-300",
                                    selectedItem === item && "font-bold",
                                    "flex flex-col px-3 py-2 shadow-sm",
                                )}
                                key={itemToString(item)}
                                {...getItemProps({ item, index })}
                            >
                                <span className="text-sm text-gray-700">
                                    {itemToString(item)}
                                </span>
                            </li>
                        ))}
                </ul>
            </div>
        </ShadCNWrapper>
    );

    return (
        <ShadCNWrapper>
            <div>
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
                            autoFocus={true}
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

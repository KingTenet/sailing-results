import React, { useState, useEffect } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAppState, useServices } from "@/useAppState";
import { cleanName } from "@/common";
import AutocompleteShadcn from "../AutocompleteShadcn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShadCNWrapper } from "../ShadCNWrapper";
import { X } from "lucide-react";

export default function HelmComparisonPage() {
    const navigateTo = useNavigate();
    const [selectedHelm, setSelectedHelm] = useState(null);
    const [helmsIndex, setHelmsIndex] = useState(null);
    const services = useServices();
    const [appState, updateAppState] = useAppState();

    useEffect(() => {
        services.indexes.updateFromResults(appState.results);
        if (!selectedHelm) {
            setHelmsIndex(
                services.indexes.getHelmsIndex([], appState.newHelms),
            );
        }
    }, [appState.results]);

    const handleSelectedHelm = (selectedHelm) => {
        if (!selectedHelm) return;

        // Check if helm is already selected
        if (
            appState.selectedHelms?.some(
                (helm) => helm.getName() === selectedHelm.getName(),
            )
        ) {
            return;
        }

        setSelectedHelm(selectedHelm);
        updateAppState((state) => ({
            ...state,
            selectedHelms: state.selectedHelms
                ? [...state.selectedHelms, selectedHelm]
                : [selectedHelm],
        }));
    };

    const handleRemoveHelm = (helmToRemove) => {
        updateAppState((state) => ({
            ...state,
            selectedHelms: state.selectedHelms.filter(
                (helm) => helm.getName() !== helmToRemove.getName(),
            ),
        }));
    };

    const getHelmNameErrorMessage = (partialMatch) => {
        try {
            cleanName(partialMatch);
            return;
        } catch (err) {
            return err.message;
        }
    };

    return (
        <Flex
            direction="column"
            width="100%"
            className="device-height"
            alignItems="center"
            p={4}
        >
            <Box width="100%" maxW="600px">
                <ShadCNWrapper>
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Compare Helms</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AutocompleteShadcn
                                heading="Select Helm"
                                data={helmsIndex?.data || []}
                                itemToString={(helm) =>
                                    helm ? helm.getName() : ""
                                }
                                filterData={(inputValue) =>
                                    helmsIndex?.search(inputValue) || []
                                }
                                handleSelectedItemChange={handleSelectedHelm}
                                sortFn={(helmA, helmB) =>
                                    helmA.getName() > helmB.getName() ? 1 : -1
                                }
                                placeholder="Enter helm name..."
                                forceBlurOnExactMatch={true}
                                getPartialMatchErrorMsg={
                                    getHelmNameErrorMessage
                                }
                            />
                        </CardContent>
                    </Card>

                    {appState.selectedHelms?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Selected Helms</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {appState.selectedHelms.map((helm) => (
                                        <div
                                            key={helm.getName()}
                                            className="flex items-center justify-between rounded-lg bg-secondary p-3"
                                        >
                                            <span className="text-sm font-medium">
                                                {helm.getName()}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleRemoveHelm(helm)
                                                }
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {appState.selectedHelms.length >= 2 && (
                                        <Button
                                            className="mt-4 w-full"
                                            onClick={() =>
                                                navigateTo("/compare")
                                            }
                                        >
                                            Compare Selected Helms
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </ShadCNWrapper>
            </Box>
        </Flex>
    );
}

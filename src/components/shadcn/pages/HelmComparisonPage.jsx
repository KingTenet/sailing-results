import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState, useServices } from "@/useAppState";
import { cleanName } from "@/common";
import AutocompleteShadcn from "../AutocompleteShadcn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShadCNWrapper } from "../ShadCNWrapper";
import { X } from "lucide-react";
import Helm from "@/store/types/Helm";
import Race from "@/store/types/Race";
import { Chart } from "../HelmComparisonChart";

const COLORS = [
    "#d00000ff",
    "#ffba08ff",
    "#3f88c5ff",
    "#032b43ff",
    "#136f63ff",
];

const MS_IN_WEEK = 1000 * 3600 * 24 * 7;

export default function HelmComparisonPage() {
    const navigateTo = useNavigate();
    const [helmsIndex, setHelmsIndex] = useState(null);
    const [helmsIndexId, setHelmsIndexId] = useState("index0");
    const services = useServices();
    const [appState, updateAppState] = useAppState();
    const resultsByHelm = services.getResultsByHelm();
    const [chartData, updateChartData] = useState();

    useEffect(() => {
        const endDate = new Date();
        endDate.setUTCHours(0, 0, 0, 0);
        let startDate = endDate.getTime() - MS_IN_WEEK * 400; // 12 weeks ago
        let race = new Race(new Date(startDate), 1);

        let helmPBs = !appState?.selectedHelms
            ? [...resultsByHelm]
                  .filter(([, results]) => results.length > 10)
                  .map(([, results]) => [
                      results[0].getHelm(),
                      results
                          .slice(10) // Ignore first 10 results as the average for the rolling PI is statistically questionable
                          .filter((result) => race.isBefore(result.getRace()))
                          .sort(
                              (resultA, resultB) =>
                                  resultA.rollingOverallPIAfterRace -
                                  resultB.rollingOverallPIAfterRace,
                          ),
                  ])
                  .filter(([, results]) => results.length)
                  .sort(
                      ([, resultsA], [, resultsB]) =>
                          resultsA[0].rollingOverallPIAfterRace -
                          resultsB[0].rollingOverallPIAfterRace,
                  )
            : [];

        const helms =
            appState?.selectedHelms ||
            helmPBs.slice(0, COLORS.length).map(([helm]) => helm);

        if (!helms?.length) {
            return;
        }

        const newChartData = [];
        while (startDate < endDate.getTime()) {
            race = new Race(new Date(startDate), 1);
            newChartData.push({
                date: new Date(startDate).toISOString(),
                ...helms.reduce((acc, helm) => {
                    const helmResults = resultsByHelm.get(helm.getName());
                    return {
                        ...acc,
                        [helm.getName()]: helmResults
                            .at(-1)
                            .getRollingHandicapsAtRace(race)[1],
                    };
                }, {}),
            });

            startDate = startDate + MS_IN_WEEK * 6;
        }

        const newChartConfig = helms.reduce(
            (acc, helm, index) => ({
                ...acc,
                [helm.getName()]: {
                    label: helm.getName(),
                    color: COLORS[index],
                },
            }),
            {},
        );

        updateChartData([newChartData, newChartConfig]);
    }, [appState]);

    useEffect(() => {
        setHelmsIndex(
            services.indexes.getHelmsIndex(appState.selectedHelms || [], []),
        );
        if (appState.selectedHelms) {
            setHelmsIndexId(appState.selectedHelms.map(Helm.getId).join(":"));
        }
    }, [services.indexes, appState.selectedHelms]);

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
        <ShadCNWrapper>
            <Card>
                <CardContent className="flex w-full space-x-6 bg-slate-400 p-10">
                    <Card className="w-[30vw]">
                        <CardHeader>
                            <CardTitle>Compare Helms</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {helmsIndex && (
                                <AutocompleteShadcn
                                    key={helmsIndexId}
                                    heading="Select Helm"
                                    data={helmsIndex?.data || []}
                                    itemToString={(helm) =>
                                        helm ? helm.getName() : ""
                                    }
                                    filterData={(inputValue) => {
                                        const results =
                                            helmsIndex?.search(inputValue);
                                        return results.filter(
                                            (helm) => helm instanceof Helm,
                                        );
                                    }}
                                    handleSelectedItemChange={
                                        handleSelectedHelm
                                    }
                                    sortFn={(helmA, helmB) =>
                                        helmA.getName() > helmB.getName()
                                            ? 1
                                            : -1
                                    }
                                    placeholder="Enter helm name..."
                                    forceBlurOnExactMatch={true}
                                    getPartialMatchErrorMsg={
                                        getHelmNameErrorMessage
                                    }
                                />
                            )}
                        </CardContent>

                        {appState.selectedHelms?.length > 0 && (
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
                                    {/* 
                                    {appState.selectedHelms.length >= 2 && (
                                        <Button
                                            className="mt-4 w-full"
                                            onClick={() =>
                                                navigateTo("/compare")
                                            }
                                        >
                                            Compare Selected Helms
                                        </Button>
                                    )} */}
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Personal Handicap over time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {chartData && (
                                <div className="h-[70vh]">
                                    <Chart
                                        chartConfig={chartData[1]}
                                        chartData={chartData[0]}
                                        helms={Object.keys(chartData[1])}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </ShadCNWrapper>
    );
}

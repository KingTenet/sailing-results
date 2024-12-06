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
import { DatePicker } from "../DatePicker";

const COLORS = [
    "#d00000ff",
    "#ffba08ff",
    "#3f88c5ff",
    "#032b43ff",
    "#136f63ff",
];

const MS_IN_WEEK = 1000 * 3600 * 24 * 7;
const CHART_DATAPOINTS = 30;

function getHelmPBs(resultsByHelm, race) {
    return [...resultsByHelm]
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
        );
}

export default function HelmComparisonPage() {
    const [helmsIndex, setHelmsIndex] = useState(null);
    const [helmsIndexId, setHelmsIndexId] = useState("index0");
    const services = useServices();
    const [appState, updateAppState] = useAppState();
    const resultsByHelm = services.getResultsByHelm();
    const [chartData, updateChartData] = useState();
    const [helmPBs, setHelmPBs] = useState();

    const [endDate, setEndDate] = React.useState(new Date());
    const [startDate, setStartDateState] = React.useState(
        new Date(new Date().getTime() - MS_IN_WEEK * 10),
    );

    const setStartDate = (date) => {
        console.log("Setting new start date");
        setStartDateState(date);
    };

    // useEffect(() => {
    //     if (appState?.selectedHelms?.length) {
    //         return;
    //     }

    //     let race = new Race(new Date(startDate), 1);

    //     const helmPBs = getHelmPBs(resultsByHelm, race);

    //     updateAppState((state) => ({
    //         ...state,
    //         selectedHelms: helmPBs
    //             .slice(0, COLORS.length)
    //             .map(([helm]) => helm),
    //     }));
    // }, [appState, resultsByHelm, updateAppState, startDate]);

    useEffect(() => {
        const tmpEndDate = endDate > startDate ? endDate : startDate;
        let tmpStartDate = endDate > startDate ? startDate : endDate;
        tmpEndDate.setUTCHours(0, 0, 0, 0);
        tmpStartDate.setUTCHours(0, 0, 0, 0);

        let race = new Race(new Date(tmpStartDate), 1);

        const helms =
            appState?.selectedHelms ||
            getHelmPBs(resultsByHelm, race)
                .slice(0, COLORS.length)
                .map(([helm]) => helm);

        if (!helms?.length) {
            return;
        }

        const newChartData = [];
        while (tmpEndDate >= tmpStartDate) {
            race = new Race(new Date(tmpStartDate), 1);
            newChartData.push({
                date: new Date(tmpStartDate).toISOString(),
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

            tmpStartDate = new Date(tmpStartDate).getTime() + MS_IN_WEEK;
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
    }, [appState, startDate, endDate, helmPBs, resultsByHelm]);

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

    console.log("Rendering Comparison page");
    return (
        <ShadCNWrapper>
            <Card className="min-h-screen w-screen bg-slate-600/0">
                <CardContent className="mx-auto flex flex-col justify-end bg-pink-300/0 lg:max-w-screen-xl">
                    <DatePicker
                        date={startDate}
                        setDate={setStartDate}
                        // disabled={(date) =>
                        //     date >
                        //         new Date(
                        //             endDate.getTime() - 3 * MS_IN_WEEK,
                        //         ) || date < new Date("2016-01-01")
                        // }
                    />
                    <div className="my-1" />
                    {/* <DatePicker
                        date={endDate}
                        setDate={setEndDate}
                        disabled={(date) =>
                            date <
                                new Date(
                                    startDate.getTime() +
                                        3 * MS_IN_WEEK,
                                ) || date > new Date()
                        }
                    /> */}
                    {/* {helmsIndex && (
                        <>
                            <AutocompleteShadcn
                                key={helmsIndexId}
                                heading="Select Helms"
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
                        </>
                    )} */}
                    {/* {chartData && (
                        <div className="h-full w-full bg-yellow-400/0">
                            <div className="flex flex-row"></div>
                            <div className="mt-4 h-[50vh] bg-blue-800/0">
                                <Chart
                                    chartConfig={chartData[1]}
                                    chartData={chartData[0]}
                                    helms={Object.keys(chartData[1])}
                                />
                            </div>
                        </div>
                    )} */}
                    {/* {appState.selectedHelms?.length > 0 &&
                        appState.selectedHelms.map((helm) => (
                            <div
                                key={helm.getName()}
                                className="my-1 flex items-center justify-between rounded-lg bg-secondary pl-3 pr-0"
                            >
                                <span className="text-sm font-medium">
                                    {helm.getName()}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveHelm(helm)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))} */}
                </CardContent>
            </Card>
        </ShadCNWrapper>
    );
}

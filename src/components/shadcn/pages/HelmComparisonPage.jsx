import React, { useState, useEffect } from "react";
import { useAppState, useServices } from "@/useAppState";
import { cleanName } from "@/common";
import AutocompleteShadcn from "../AutocompleteShadcn";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShadCNWrapper } from "../ShadCNWrapper";
import { X } from "lucide-react";
import Helm from "@/store/types/Helm";
import Race from "@/store/types/Race";
import { Chart } from "../HelmComparisonChart";
import { DatePicker } from "../DatePicker";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const COLORS = [
    "#d00000ff",
    "#ffba08ff",
    "#3f88c5ff",
    "#032b43ff",
    "#136f63ff",
    "#72389fff",
    "#8b6300ff",
    "#5a1a1aff",
];

const colorVariants = cva("bg-black text-white", {
    variants: {
        color: {
            "#d00000ff": "bg-[#d00000ff] text-white",
            "#ffba08ff": "bg-[#ffba08ff] text-black",
            "#3f88c5ff": "bg-[#3f88c5ff] text-white",
            "#032b43ff": "bg-[#032b43ff] text-white",
            "#136f63ff": "bg-[#136f63ff] text-white",
            "#72389fff": "bg-[#72389fff] text-white",
            "#8b6300ff": "bg-[#8b6300ff] text-white",
            "#5a1a1aff": "bg-[#5a1a1aff] text-white",
        },
    },
});

const MS_IN_WEEK = 1000 * 3600 * 24 * 7;

function getHelmPBs(resultsByHelm, startDate, endDate) {
    let startRace = new Race(new Date(startDate), 1);
    let endRace = new Race(new Date(endDate), 1);

    return [...resultsByHelm]
        .filter(([, results]) => results.length > 10)
        .map(([, results]) => [
            results[0].getHelm(),
            results
                .slice(10) // Ignore first 10 results as the average for the rolling PI is statistically questionable
                .filter((result) => startRace.isBefore(result.getRace()))
                .filter((result) => result.getRace().isBefore(endRace))
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

function SelectedHelms({ title, appState, getHelmColor, handleRemoveHelm }) {
    // const appState = useAppState();
    return (
        <div className="w-full">
            {appState.selectedHelms?.length > 0 && (
                <h1 className="mx-auto mb-2 w-full text-center">{title}</h1>
            )}

            {appState.selectedHelms?.length > 0 &&
                appState.selectedHelms.map((helm) => (
                    <div
                        key={helm.getName()}
                        className={cn(
                            "my-2 mt-0 flex items-center justify-between rounded-lg bg-secondary pl-3 pr-0 lg:ml-2",
                            colorVariants({
                                color: getHelmColor(helm),
                            }),
                        )}
                    >
                        <span>{helm.getName()}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveHelm(helm)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
        </div>
    );
}

export default function HelmComparisonPage() {
    const [helmsIndex, setHelmsIndex] = useState(null);
    const [helmsIndexId, setHelmsIndexId] = useState("index0");
    const services = useServices();
    const [appState, updateAppState] = useAppState();
    const [resultsByHelm] = useState(() => services.getResultsByHelm());
    const [helmsWereSelected, updateHelmsWereSelected] = useState(false);

    const NOW = new Date();
    const [endDate, setEndDateState] = React.useState(NOW);

    const [startDate, setStartDateState] = React.useState(
        // new Date(NOW.getFullYear(), NOW.getMonth() - 3, NOW.getDate()),
        new Date(new Date().getTime() - MS_IN_WEEK * 16),
    );

    const setEndDate = (date) => {
        if (date) {
            setEndDateState(date);
        }
    };

    const setStartDate = (date) => {
        if (date) {
            setStartDateState(date);
        }
    };

    useEffect(() => {
        if (helmsWereSelected) {
            return;
        }

        const helmPBs = getHelmPBs(resultsByHelm, startDate, endDate);
        updateAppState((state) => ({
            ...state,
            selectedHelms: helmPBs.slice(0, 3).map(([helm]) => helm),
        }));
    }, [startDate, endDate, updateAppState, helmsWereSelected, resultsByHelm]);

    const tmpEndDate =
        endDate > startDate ? new Date(endDate) : new Date(startDate);
    let tmpStartDate =
        endDate > startDate ? new Date(startDate) : new Date(endDate);
    tmpEndDate.setUTCHours(0, 0, 0, 0);
    tmpStartDate.setUTCHours(0, 0, 0, 0);

    let race = new Race(new Date(tmpStartDate), 1);

    const helms =
        appState?.selectedHelms ||
        getHelmPBs(resultsByHelm, race)
            .slice(0, COLORS.length)
            .map(([helm]) => helm);

    const chartData = [];
    while (tmpEndDate >= tmpStartDate) {
        race = new Race(new Date(tmpStartDate), 1);
        chartData.push({
            date: new Date(tmpStartDate).toISOString(),
            ...helms.reduce((acc, helm) => {
                const helmResults = resultsByHelm.get(helm.getName());
                return helmResults?.length
                    ? {
                          ...acc,
                          [helm.getName()]: helmResults
                              .at(-1)
                              .getRollingHandicapsAtRace(race)[1],
                      }
                    : acc;
            }, {}),
        });

        tmpStartDate = new Date(tmpStartDate).getTime() + MS_IN_WEEK;
    }

    const chartConfig = helms.reduce(
        (acc, helm, index) => ({
            ...acc,
            [helm.getName()]: {
                label: helm.getName(),
                color: COLORS[index],
            },
        }),
        {},
    );

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

        updateHelmsWereSelected(true);

        updateAppState((state) => ({
            ...state,
            selectedHelms: state.selectedHelms
                ? [...state.selectedHelms, selectedHelm]
                : [selectedHelm],
        }));
    };

    const handleRemoveHelm = (helmToRemove) => {
        updateHelmsWereSelected(true);
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

    const getHelmColor = (helm) => chartConfig[helm.getName()].color;

    return (
        <ShadCNWrapper>
            <Card className="mt-0 min-h-screen w-screen flex-col bg-white pt-0">
                <CardTitle className="ml-6 flex flex-row lg:justify-around">
                    <span className="mt-4 text-xl lg:mx-auto">
                        <h1>Helm performance</h1>
                    </span>
                </CardTitle>
                <CardContent className="mx-auto flex flex-col justify-end bg-pink-300/0 pt-0 lg:max-w-screen-xl lg:flex-row">
                    {helmsIndex && (
                        <div className="flex flex-col bg-pink-300/0 pt-0 lg:h-full lg:max-w-screen-xl">
                            <div className="my-3">
                                {/* <span className="mr-5 hidden translate-y-6 text-sm font-medium leading-none lg:block">
                                    {"Helms"}
                                </span> */}
                                <AutocompleteShadcn
                                    key={helmsIndexId}
                                    heading="Helms"
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
                                    placeholder="Insert name..."
                                    forceBlurOnExactMatch={true}
                                    getPartialMatchErrorMsg={
                                        getHelmNameErrorMessage
                                    }
                                />
                            </div>
                            <div className="flex w-full justify-between">
                                <span className="mr-5 hidden translate-y-2 text-sm font-medium leading-none lg:block">
                                    {"Start"}
                                </span>
                                <DatePicker
                                    date={startDate}
                                    setDate={setStartDate}
                                    disabled={(date) =>
                                        date >
                                            new Date(
                                                endDate.getTime() -
                                                    3 * MS_IN_WEEK,
                                            ) || date < new Date("2016-01-01")
                                    }
                                />
                            </div>
                            <div className="mt-1 flex w-full justify-between">
                                <span className="mr-5 hidden translate-y-2 text-sm font-medium leading-none lg:block">
                                    {"End"}
                                </span>
                                <DatePicker
                                    date={endDate}
                                    setDate={setEndDate}
                                    disabled={(date) =>
                                        date <
                                            new Date(
                                                startDate.getTime() +
                                                    3 * MS_IN_WEEK,
                                            ) || date > new Date()
                                    }
                                />
                            </div>
                            <div className="hidden lg:mt-10 lg:block">
                                <SelectedHelms
                                    appState={appState}
                                    getHelmColor={getHelmColor}
                                    handleRemoveHelm={handleRemoveHelm}
                                    title={
                                        helmsWereSelected
                                            ? "Selected Helms"
                                            : "Top 3 Helms"
                                    }
                                />
                            </div>
                        </div>
                    )}
                    {chartData && (
                        <div className="mt-4 h-full w-full bg-yellow-400/0">
                            <div className="mt-4 h-[45vh] w-full bg-blue-800/0 lg:h-[80vh]">
                                <Chart
                                    chartConfig={chartConfig}
                                    chartData={chartData}
                                    helms={Object.keys(chartConfig)}
                                />
                            </div>
                        </div>
                    )}
                    <div className="lg:hidden">
                        <SelectedHelms
                            appState={appState}
                            getHelmColor={getHelmColor}
                            handleRemoveHelm={handleRemoveHelm}
                            title={
                                helmsWereSelected
                                    ? "Selected Helms"
                                    : "Top 3 Helms"
                            }
                        />
                    </div>
                </CardContent>
            </Card>
        </ShadCNWrapper>
    );
}

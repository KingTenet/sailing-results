"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    XAxis,
    YAxis,
} from "recharts";

import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

const COLORS = [
    "#d00000ff",
    "#ffba08ff",
    "#3f88c5ff",
    "#032b43ff",
    "#136f63ff",
];

export function Chart({
    helms,
    chartData,
    chartConfig,
}: {
    helms: string[];
    chartData: object[];
    chartConfig: ChartConfig;
}) {
    return (
        <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={true}
                    tickMargin={20}
                    axisLine={true}
                    tickFormatter={(value) => value.slice(0, 8)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <CartesianGrid strokeDasharray="3 3" />
                {/* <XAxis dataKey="name" /> */}
                <YAxis />
                {/* <Tooltip /> */}
                {/* <Legend /> */}
                {helms &&
                    helms.map((helm, index) => (
                        <>
                            <Line
                                type="monotone"
                                dot={false}
                                dataKey={helm}
                                stroke={COLORS[index]}
                            />
                        </>
                    ))}
            </LineChart>
        </ChartContainer>
    );
}

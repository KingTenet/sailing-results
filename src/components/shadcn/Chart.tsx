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

const chartData = [
    {
        name: "Page A",
        uv: 4000,
        pv: 1000,
        amt: 1000,
    },
    {
        name: "Page B",
        uv: 3000,
        pv: 1398,
        amt: 2210,
    },
    {
        name: "Page C",
        uv: 2000,
        pv: 9800,
        amt: 2290,
    },
    {
        name: "Page D",
        uv: 2780,
        pv: 3908,
        amt: 2000,
    },
    {
        name: "Page E",
        uv: 1890,
        pv: 4800,
        amt: 2181,
    },
    {
        name: "Page F",
        uv: 2390,
        pv: 3800,
        amt: 2500,
    },
    {
        name: "Page G",
        uv: 3490,
        pv: 4300,
        amt: 2100,
    },
];

const chartConfig = {
    uv: {
        label: "UV",
        color: "#2563eb",
    },
    pv: {
        label: "PV",
        color: "#60a5fa",
    },
    amt: {
        label: "AMT",
        color: "#60a50a",
    },
} satisfies ChartConfig;

export function Chart() {
    return (
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 8)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />

                <CartesianGrid strokeDasharray="3 3" />
                {/* <XAxis dataKey="name" /> */}
                <YAxis />
                {/* <Tooltip /> */}
                {/* <Legend /> */}
                <Line
                    type="monotone"
                    dataKey="pv"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                />
                <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
            </LineChart>
        </ChartContainer>
    );
}

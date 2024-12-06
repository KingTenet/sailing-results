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
import { PureComponent } from "react";

const COLORS = [
    "#d00000ff",
    "#ffba08ff",
    "#3f88c5ff",
    "#032b43ff",
    "#136f63ff",
];

class CustomizedAxisTick extends PureComponent {
    render() {
        const { x, y, payload, stroke } = this.props;
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="end"
                    fill="#666"
                    transform="rotate(-80) translate(0 -12) scale(0.8)"
                >
                    {payload.value.slice(0, 10)}
                </text>
            </g>
        );
    }
}

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
        <ChartContainer
            config={chartConfig}
            className="h-full w-[110%] -translate-x-10 lg:w-[50%] lg:translate-x-0"
        >
            <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                    top: 0,
                    right: 10,
                    left: 10,
                    bottom: 60,
                }}
            >
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={true}
                    tickMargin={5}
                    axisLine={true}
                    tickFormatter={(value) => value.slice(0, 2)}
                    tickCount={10}
                    tick={<CustomizedAxisTick />}
                />
                {/* <ChartTooltip content={<ChartTooltipContent />} /> */}
                {/* <ChartLegend content={<ChartLegendContent />} /> */}
                {/* <CartesianGrid strokeDasharray="3 3" /> */}
                {/* <XAxis dataKey="name" /> */}
                <YAxis />
                {/* <Tooltip /> */}
                {/* <Legend /> */}
                {helms &&
                    helms.map((helm, index) => (
                        <Line
                            key={`line-${index}`}
                            type="monotone"
                            dot={false}
                            dataKey={helm}
                            stroke={COLORS[index]}
                        />
                    ))}
            </LineChart>
        </ChartContainer>
    );
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Award, TrendingUp, Sailboat, Medal } from "lucide-react";
import { useServices } from "@/useAppState";
import Result from "@/store/types/Result";
import CorrectedResult from "@/store/types/CorrectedResult";
import Helm from "@/store/types/Helm";
// import Race from "@/store/types/Race";

export function HelmSummaryPage() {
    const services = useServices();
    const resultsByHelm = services.getResultsByHelm() as Map<Helm, Result[]>;

    const getStatsForPeriod = (results: Result[], months: number) => {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);

        return results
            .filter((result) => result.getRace().getDate() > cutoffDate)
            .sort((a, b) => b.getRace().getDate() - a.getRace().getDate());
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <h1 className="mb-8 font-serif text-4xl font-bold tracking-tight text-slate-900">
                    Helm Performance Analytics
                </h1>

                {[...resultsByHelm].map(([helmName, results]) => {
                    const last3MonthsResults = getStatsForPeriod(results, 3);
                    const bestFinish = last3MonthsResults.reduce(
                        (best, curr) =>
                            Math.min(
                                best,
                                curr.finishCode.validFinish()
                                    ? curr.raceFinish
                                          .getClassCorrectedPointsByResult()
                                          .find(
                                              ([r]) =>
                                                  Result.getHelmId(r) ===
                                                  helmName,
                                          )?.[1] || Infinity
                                    : Infinity,
                            ),
                        Infinity,
                    );

                    const boatClasses = [
                        ...new Set<string>(
                            results.map((r: Result) =>
                                r.getBoatClass().getClassName(),
                            ),
                        ),
                    ];

                    const avgFinishPosition =
                        last3MonthsResults
                            .filter((r) => r.finishCode.validFinish())
                            .reduce(
                                (sum, curr) =>
                                    sum +
                                    (curr.raceFinish
                                        .getClassCorrectedPointsByResult()
                                        .find(
                                            ([r]) =>
                                                Result.getHelmId(r) ===
                                                helmName,
                                        )?.[1] || 0),
                                0,
                            ) /
                        last3MonthsResults.filter((r) =>
                            r.finishCode.validFinish(),
                        ).length;

                    return (
                        <Card
                            key={helmName}
                            className="overflow-hidden border-0 bg-white shadow-lg"
                        >
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <Sailboat className="h-6 w-6" />
                                    {helmName}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-6">
                                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <StatCard
                                        icon={
                                            <Award className="h-5 w-5 text-yellow-500" />
                                        }
                                        title="Best Finish"
                                        value={
                                            bestFinish === Infinity
                                                ? "N/A"
                                                : `${bestFinish}${getOrdinal(bestFinish)} Place`
                                        }
                                    />
                                    <StatCard
                                        icon={
                                            <TrendingUp className="h-5 w-5 text-green-500" />
                                        }
                                        title="Recent Races"
                                        value={`${last3MonthsResults.length} races`}
                                    />
                                    <StatCard
                                        icon={
                                            <Sailboat className="h-5 w-5 text-blue-500" />
                                        }
                                        title="Boats Sailed"
                                        value={`${boatClasses.length} classes`}
                                    />
                                    <StatCard
                                        icon={
                                            <Medal className="h-5 w-5 text-purple-500" />
                                        }
                                        title="Avg Position"
                                        value={
                                            isNaN(avgFinishPosition)
                                                ? "N/A"
                                                : avgFinishPosition.toFixed(1)
                                        }
                                    />
                                </div>

                                <div className="overflow-hidden rounded-lg border bg-white">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    Boat Class
                                                </TableHead>
                                                <TableHead>PN</TableHead>
                                                <TableHead>
                                                    Races Sailed
                                                </TableHead>
                                                <TableHead>
                                                    Best Finish
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {boatClasses.map(
                                                (className: string) => {
                                                    const classResults =
                                                        results.filter(
                                                            (r: Result) =>
                                                                r
                                                                    .getBoatClass()
                                                                    .getClassName() ===
                                                                className,
                                                        );
                                                    const bestClassFinish =
                                                        classResults.reduce(
                                                            (
                                                                best: number,
                                                                curr: CorrectedResult,
                                                            ) =>
                                                                Math.min(
                                                                    best,
                                                                    curr.finishCode.validFinish()
                                                                        ? curr.raceFinish
                                                                              .getClassCorrectedPointsByResult()
                                                                              .find(
                                                                                  ([
                                                                                      r,
                                                                                  ]) =>
                                                                                      Result.getHelmId(
                                                                                          r,
                                                                                      ) ===
                                                                                      helmName,
                                                                              )?.[1] ||
                                                                              Infinity
                                                                        : Infinity,
                                                                ),
                                                            Infinity,
                                                        );

                                                    return (
                                                        <TableRow
                                                            key={className}
                                                        >
                                                            <TableCell className="font-medium">
                                                                {className}
                                                            </TableCell>
                                                            <TableCell>
                                                                {classResults[0]
                                                                    .getBoatClass()
                                                                    .getPY()}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    classResults.length
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {bestClassFinish ===
                                                                Infinity
                                                                    ? "N/A"
                                                                    : `${bestClassFinish}${getOrdinal(bestClassFinish)}`}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                },
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function StatCard({ icon, title, value }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-1 flex items-center gap-2">
                {icon}
                <div className="text-sm font-medium text-slate-600">
                    {title}
                </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
        </div>
    );
}

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

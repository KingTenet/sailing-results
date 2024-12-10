import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function YearNavigation({
    month,
    setMonth,
}: {
    month: Date;
    setMonth: (date: Date) => void;
}) {
    return (
        <>
            <div className="relative m-3 mb-0 flex items-center justify-center">
                <div
                    className="text-sm font-medium"
                    aria-live="polite"
                    role="presentation"
                    id="react-day-picker-1"
                >
                    {month.getUTCFullYear()}
                </div>
                <div className="flex items-center space-x-1">
                    <Button
                        variant={"outline"}
                        className={cn(
                            "justify-start text-left font-normal",
                            "rdp-button_reset rdp-button absolute left-1 inline-flex h-7 w-7 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-transparent p-0 text-sm font-medium opacity-50 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                            // !date && "text-muted-foreground",
                        )}
                        onClick={() =>
                            setMonth(
                                new Date(
                                    month?.getUTCFullYear() - 1,
                                    month?.getUTCMonth(),
                                ),
                            )
                        }
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "justify-start text-left font-normal",
                            "rdp-button_reset rdp-button absolute right-1 inline-flex h-7 w-7 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-transparent p-0 text-sm font-medium opacity-50 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                            // !date && "text-muted-foreground",
                        )}
                        onClick={() =>
                            setMonth(
                                new Date(
                                    month?.getUTCFullYear() + 1,
                                    month?.getUTCMonth(),
                                ),
                            )
                        }
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </>
    );
}

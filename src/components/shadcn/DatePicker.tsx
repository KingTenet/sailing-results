"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
    date,
    disabled,
    setDate,
}: {
    date: Date | undefined;
    disabled: (date: Date) => boolean;
    setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
}) {
    const [isOpen, setIsOpen] = React.useState<boolean | undefined>();

    const [allDisabled, setAllDisabled] = React.useState<boolean | undefined>();
    const isDisabledFn = allDisabled ? () => true : disabled;

    const onDateSelected = (date: Date | undefined) => {
        setDate(date);
        setIsOpen(false);
        // setAllDisabled(true);
        // setTimeout(() => setIsOpen(false), 2000);
    };

    console.log("Rendering date picker");

    return (
        <>
            <Popover
                open={isOpen}
                onOpenChange={(prevIsOpen) => {
                    setIsOpen(prevIsOpen);
                    setAllDisabled(false);
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                        )}
                    >
                        <CalendarIcon />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        // className="w-screen"
                        showOutsideDays={false}
                        captionLayout="buttons"
                        mode="single"
                        selected={date}
                        onSelect={onDateSelected}
                        initialFocus
                        defaultMonth={date}
                        disabled={isDisabledFn}
                    />
                </PopoverContent>
            </Popover>
        </>
    );
}

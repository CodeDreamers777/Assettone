"use client";
import React from "react";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  value?: DateRange;
  onChange?: (date: DateRange) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  value,
  onChange,
}: DateRangePickerProps) {
  // Initialize state based on either value prop or start/end dates
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (value) {
      return value;
    }
    if (startDate && endDate) {
      try {
        return {
          from: new Date(startDate),
          to: new Date(endDate),
        };
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  });

  // Handle date changes
  const handleSelect = (newDate: DateRange | undefined) => {
    setDate(newDate);
    // Call onChange prop if it exists
    if (onChange && newDate) {
      onChange(newDate);
    }
  };

  return (
    <div className="mb-4 flex items-center justify-end">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

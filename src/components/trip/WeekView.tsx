"use client";

import { cn } from "@/lib/utils";
import type { Activity } from "@/lib/types";
import { formatDate } from "@/lib/types";

interface WeekViewProps {
  days: string[];
  activities: Activity[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function WeekView({
  days,
  activities,
  selectedDate,
  onSelectDate,
}: WeekViewProps) {
  const activitiesByDate = activities.reduce<Record<string, Activity[]>>(
    (acc, act) => {
      if (!acc[act.date]) acc[act.date] = [];
      acc[act.date].push(act);
      return acc;
    },
    {}
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((date) => {
        const dayActivities = activitiesByDate[date] || [];
        const isSelected = date === selectedDate;
        const isToday = date === today;

        return (
          <button
            key={date}
            onClick={() => onSelectDate(date)}
            className={cn(
              "flex flex-col items-center rounded-lg border p-3 transition-all hover:shadow-sm",
              isSelected
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-gray-200 hover:border-gray-300",
              isToday && !isSelected && "border-blue-300 bg-blue-50/50"
            )}
          >
            <span className="text-xs text-muted-foreground">
              {formatDate(date).split(",")[0]}
            </span>
            <span
              className={cn(
                "text-lg font-semibold mt-0.5",
                isSelected && "text-primary"
              )}
            >
              {new Date(date + "T00:00:00").getDate()}
            </span>
            {dayActivities.length > 0 && (
              <span className="mt-1 text-xs text-muted-foreground">
                {dayActivities.length} act.
              </span>
            )}
            {dayActivities.length > 0 && (
              <div className="flex gap-0.5 mt-1">
                {dayActivities.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      a.category === "food" && "bg-orange-400",
                      a.category === "activity" && "bg-green-400",
                      a.category === "transport" && "bg-blue-400",
                      a.category === "accommodation" && "bg-purple-400",
                      a.category === "free" && "bg-gray-400",
                      !a.category && "bg-gray-300"
                    )}
                  />
                ))}
                {dayActivities.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{dayActivities.length - 4}
                  </span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

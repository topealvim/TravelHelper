"use client"

import { UtensilsCrossed, Car, Compass, Bed, Coffee } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Activity, Trip } from "@/lib/types"
import { getTripDates } from "@/lib/mock-data"

const CATEGORY_ICONS = {
  food: UtensilsCrossed,
  transport: Car,
  activity: Compass,
  accommodation: Bed,
  free: Coffee,
}

interface WeekViewProps {
  trip: Trip
  activities: Activity[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function WeekView({ trip, activities, selectedDate, onSelectDate }: WeekViewProps) {
  const dates = getTripDates(trip)

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
      {dates.map((date) => {
        const dayActivities = activities.filter((a) => a.date === date)
        const dayDate = new Date(date + "T00:00:00")
        const dayName = DAY_NAMES[dayDate.getDay()]
        const dayNum = dayDate.getDate()
        const isSelected = selectedDate === date

        // Get unique categories for this day
        const categories = [...new Set(dayActivities.map((a) => a.category))]

        return (
          <button
            key={date}
            onClick={() => onSelectDate(date)}
            className={cn(
              "flex flex-col items-center rounded-xl border p-3 transition-all hover:shadow-sm hover:border-primary/30 shrink-0 snap-start",
              "w-[100px] sm:w-[110px] lg:w-auto lg:flex-1",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "bg-white"
            )}
          >
            <span className="text-xs font-medium text-muted-foreground">{dayName}</span>
            <span className={cn(
              "mt-0.5 text-xl font-bold",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {dayNum}
            </span>

            <div className="mt-2 flex flex-col items-center gap-1">
              <span className={cn(
                "text-xs font-medium",
                dayActivities.length > 0 ? "text-foreground" : "text-muted-foreground"
              )}>
                {dayActivities.length} {dayActivities.length === 1 ? "act" : "acts"}
              </span>
              {categories.length > 0 && (
                <div className="flex gap-1">
                  {categories.slice(0, 4).map((cat) => {
                    const Icon = CATEGORY_ICONS[cat]
                    return <Icon key={cat} className="size-3 text-muted-foreground" />
                  })}
                </div>
              )}
            </div>

            {dayActivities.some((a) => a.cost && a.cost > 0) && (
              <span className="mt-1 text-[10px] text-muted-foreground">
                ~€{dayActivities.reduce((sum, a) => sum + (a.cost || 0), 0)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

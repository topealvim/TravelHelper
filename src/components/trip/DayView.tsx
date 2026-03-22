"use client"

import { useState } from "react"
import { Plus, Sun, Cloud, Moon, Building2, Home, House, BedDouble, MapPin, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivityCard } from "./ActivityCard"
import type { Activity, Accommodation, ViewMode } from "@/lib/types"
import { cn } from "@/lib/utils"

const ACCOMMODATION_ICONS = {
  hotel: Building2,
  airbnb: Home,
  house: House,
  hostel: BedDouble,
  other: MapPin,
}

interface DayViewProps {
  date: string
  activities: Activity[]
  accommodation?: Accommodation | null
  selectedActivityId?: string | null
  onSelectActivity?: (id: string) => void
}

const BLOCKS = [
  { key: "morning" as const, label: "Morning", icon: Sun, emoji: "☀️" },
  { key: "afternoon" as const, label: "Afternoon", icon: Cloud, emoji: "🌤️" },
  { key: "evening" as const, label: "Evening", icon: Moon, emoji: "🌙" },
]

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 8 // 08:00 to 22:00
  return `${String(hour).padStart(2, "0")}:00`
})

function AccommodationBanner({ accommodation, position }: { accommodation: Accommodation; position: "start" | "end" }) {
  const Icon = ACCOMMODATION_ICONS[accommodation.type]
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-2.5">
      <div className="flex size-8 items-center justify-center rounded-md bg-stone-200">
        <Icon className="size-4 text-stone-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-stone-500">
          {position === "start" ? "Starting from" : "Returning to"}
        </p>
        <p className="text-sm font-medium text-stone-700 truncate">{accommodation.name}</p>
      </div>
      {accommodation.address && (
        <p className="hidden sm:block text-[11px] text-stone-400 truncate max-w-[140px]">
          {accommodation.address}
        </p>
      )}
    </div>
  )
}

export function DayView({ date, activities, accommodation, selectedActivityId, onSelectActivity }: DayViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("blocks")

  const dayDate = new Date(date + "T00:00:00")
  const formatted = dayDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const totalCost = activities.reduce((sum, a) => sum + (a.cost || 0), 0)

  return (
    <div>
      {/* Day header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{formatted}</h2>
          <p className="text-sm text-muted-foreground">
            {activities.length} {activities.length === 1 ? "activity" : "activities"}
            {totalCost > 0 && ` · ~€${totalCost} estimated`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="blocks" className="text-xs px-3 h-6">
                Blocks
              </TabsTrigger>
              <TabsTrigger value="hourly" className="text-xs px-3 h-6">
                Hourly
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Block view */}
      {viewMode === "blocks" && (
        <div className="space-y-4">
          {/* Start point banner */}
          {accommodation && (
            <AccommodationBanner accommodation={accommodation} position="start" />
          )}

          {BLOCKS.map((block) => {
            const blockActivities = activities.filter((a) => a.block === block.key)
            return (
              <div key={block.key}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base">{block.emoji}</span>
                  <h3 className="text-sm font-medium text-muted-foreground">{block.label}</h3>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {blockActivities.length > 0 ? (
                  <div className="space-y-2 pl-7">
                    {blockActivities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        selected={selectedActivityId === activity.id}
                        onClick={() => onSelectActivity?.(activity.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="ml-7 rounded-lg border border-dashed p-4 text-center">
                    <p className="text-xs text-muted-foreground">No activities yet</p>
                    <Button variant="ghost" size="sm" className="mt-1 text-xs">
                      <Plus className="size-3" />
                      Add activity
                    </Button>
                  </div>
                )}
              </div>
            )
          })}

          {/* End point banner */}
          {accommodation && (
            <AccommodationBanner accommodation={accommodation} position="end" />
          )}
        </div>
      )}

      {/* Hourly view */}
      {viewMode === "hourly" && (
        <div className="space-y-0">
          {/* Start point banner */}
          {accommodation && (
            <div className="mb-2">
              <AccommodationBanner accommodation={accommodation} position="start" />
            </div>
          )}

          {HOURS.map((hour) => {
            const hourActivities = activities.filter((a) => a.start_time === hour)
            return (
              <div
                key={hour}
                className={cn(
                  "flex gap-3 border-t py-2",
                  hourActivities.length > 0 ? "bg-white" : "bg-transparent"
                )}
              >
                <span className="w-14 shrink-0 text-right text-xs font-mono text-muted-foreground pt-1">
                  {hour}
                </span>
                <div className="flex-1">
                  {hourActivities.length > 0 ? (
                    <div className="space-y-2">
                      {hourActivities.map((activity) => (
                        <ActivityCard
                          key={activity.id}
                          activity={activity}
                          selected={selectedActivityId === activity.id}
                          onClick={() => onSelectActivity?.(activity.id)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}

          {/* End point banner */}
          {accommodation && (
            <div className="mt-2">
              <AccommodationBanner accommodation={accommodation} position="end" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

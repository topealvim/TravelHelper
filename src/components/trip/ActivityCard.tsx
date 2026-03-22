"use client"

import {
  MapPin, Clock, Euro,
  UtensilsCrossed, Car, Compass, Bed, Coffee,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_CONFIG } from "@/lib/types"
import type { Activity } from "@/lib/types"
import { mockMembers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const CATEGORY_ICONS = {
  food: UtensilsCrossed,
  transport: Car,
  activity: Compass,
  accommodation: Bed,
  free: Coffee,
}

interface ActivityCardProps {
  activity: Activity
  onClick?: () => void
  selected?: boolean
}

export function ActivityCard({ activity, onClick, selected }: ActivityCardProps) {
  const cat = CATEGORY_CONFIG[activity.category]
  const Icon = CATEGORY_ICONS[activity.category]
  const creator = mockMembers.find((m) => m.id === activity.created_by)

  return (
    <div
      id={`activity-${activity.id}`}
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border bg-white p-3 transition-all hover:shadow-sm",
        selected && "ring-2 ring-primary shadow-md"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{activity.title}</h4>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              {cat.label}
            </Badge>
          </div>

          {activity.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {activity.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {activity.start_time && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {activity.start_time}
                {activity.end_time && ` - ${activity.end_time}`}
              </span>
            )}
            {activity.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                <span className="truncate max-w-[150px]">{activity.location}</span>
              </span>
            )}
            {activity.cost != null && activity.cost > 0 && (
              <span className="flex items-center gap-1">
                <Euro className="size-3" />
                {activity.cost}
              </span>
            )}
          </div>
        </div>

        {creator && (
          <div className="shrink-0">
            <Avatar className="size-5">
              <AvatarFallback className="bg-primary/10 text-[9px] font-medium">
                {creator.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  )
}

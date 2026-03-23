"use client";

import { cn } from "@/lib/utils";
import type { Activity, CATEGORY_COLORS } from "@/lib/types";
import { formatTime } from "@/lib/types";
import { MapPin, Clock, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityCardProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
  onDelete?: (id: string) => void;
}

const CATEGORY_STYLES: Record<string, string> = {
  food: "border-l-orange-400",
  transport: "border-l-blue-400",
  activity: "border-l-green-400",
  accommodation: "border-l-purple-400",
  free: "border-l-gray-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  transport: "Transport",
  activity: "Activity",
  accommodation: "Stay",
  free: "Free Time",
};

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 bg-white p-3 shadow-sm hover:shadow-md transition-shadow group",
        activity.category
          ? CATEGORY_STYLES[activity.category]
          : "border-l-gray-300"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{activity.title}</h4>
          {activity.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {activity.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {activity.start_time && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(activity.start_time)}
                {activity.end_time && ` - ${formatTime(activity.end_time)}`}
              </span>
            )}
            {activity.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {activity.location}
              </span>
            )}
            {activity.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {CATEGORY_LABELS[activity.category]}
              </span>
            )}
            {activity.cost != null && activity.cost > 0 && (
              <span className="text-xs text-muted-foreground">
                {activity.currency} {activity.cost}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(activity)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDelete(activity.id)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

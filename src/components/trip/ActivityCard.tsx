"use client";

import { cn } from "@/lib/utils";
import type { Activity, Profile } from "@/lib/types";
import { formatTime, CATEGORY_COLORS } from "@/lib/types";
import { MapPin, Clock, Trash2, Edit2, ThumbsUp, ThumbsDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityCardProps {
  activity: Activity;
  index?: number;
  onEdit?: (activity: Activity) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  votes?: { up: number; down: number; userVote: -1 | 1 | null };
  onVote?: (activityId: string, vote: 1 | -1) => void;
  creatorProfile?: Profile | null;
  dragHandleProps?: Record<string, unknown>;
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

export function ActivityCard({
  activity,
  index,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  votes,
  onVote,
  creatorProfile,
  dragHandleProps,
}: ActivityCardProps) {
  const letterLabel = index != null ? String.fromCharCode(65 + index) : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 bg-white p-3 shadow-sm hover:shadow-md transition-all group",
        activity.category
          ? CATEGORY_STYLES[activity.category]
          : "border-l-gray-300",
        isSelected && "ring-2 ring-primary/40 shadow-md"
      )}
      onClick={() => onSelect?.(activity.id)}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        {/* Map letter pin */}
        {letterLabel != null && (
          <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
            {letterLabel}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm truncate">{activity.title}</h4>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(activity);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(activity.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          </div>

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
                <span className="truncate max-w-[150px]">{activity.location}</span>
              </span>
            )}
            {activity.category && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full border",
                  CATEGORY_COLORS[activity.category]
                )}
              >
                {CATEGORY_LABELS[activity.category]}
              </span>
            )}
            {activity.cost != null && activity.cost > 0 && (
              <span className="text-xs text-muted-foreground">
                {activity.currency} {activity.cost}
              </span>
            )}
          </div>

          {/* Voting + Avatar row */}
          {(votes || creatorProfile) && (
            <div className="flex items-center gap-3 mt-2">
              {votes && onVote && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(activity.id, 1);
                    }}
                    className={cn(
                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-colors",
                      votes.userVote === 1
                        ? "bg-green-100 text-green-700"
                        : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                    )}
                  >
                    <ThumbsUp className="h-3 w-3" />
                    {votes.up > 0 && <span>{votes.up}</span>}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(activity.id, -1);
                    }}
                    className={cn(
                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs transition-colors",
                      votes.userVote === -1
                        ? "bg-red-100 text-red-700"
                        : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                    )}
                  >
                    <ThumbsDown className="h-3 w-3" />
                    {votes.down > 0 && <span>{votes.down}</span>}
                  </button>
                </div>
              )}
              {creatorProfile && (
                <div className="flex items-center gap-1 ml-auto">
                  {creatorProfile.avatar_url ? (
                    <img
                      src={creatorProfile.avatar_url}
                      alt={creatorProfile.display_name || ""}
                      className="h-5 w-5 rounded-full"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                      {(creatorProfile.display_name || "?")[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

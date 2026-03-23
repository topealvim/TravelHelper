"use client";

import { useState, useCallback } from "react";
import { useActivities } from "@/hooks/useActivities";
import { useVotes } from "@/hooks/useVotes";
import { useTripMembers } from "@/hooks/useTripMembers";
import { ActivityCard } from "./ActivityCard";
import { SortableActivityList } from "./SortableActivityList";
import { ActivityForm } from "./ActivityForm";
import { ActivityMap } from "@/components/maps/ActivityMap";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/types";
import type { Activity } from "@/lib/types";
import { Plus, ChevronLeft, Map, List } from "lucide-react";

interface DayViewProps {
  tripId: string;
  date: string;
  onBack: () => void;
}

type ViewMode = "blocks" | "hourly";

const BLOCKS = [
  { key: "morning", label: "Morning", emoji: "\u2600\ufe0f" },
  { key: "afternoon", label: "Afternoon", emoji: "\u26c5" },
  { key: "evening", label: "Evening", emoji: "\ud83c\udf19" },
] as const;

export function DayView({ tripId, date, onBack }: DayViewProps) {
  const { activities, loading, addActivity, updateActivity, deleteActivity } =
    useActivities(tripId, date);
  const { votes, vote } = useVotes(tripId, date);
  const { members } = useTripMembers(tripId);
  const [viewMode, setViewMode] = useState<ViewMode>("blocks");
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  );
  const [showMap, setShowMap] = useState(true);

  const geoActivities = activities.filter((a) => a.latitude && a.longitude);

  const activitiesByBlock = BLOCKS.map((block) => ({
    ...block,
    activities: activities
      .filter((a) => a.block === block.key)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  const unscheduled = activities
    .filter((a) => !a.block)
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleSubmit = async (data: Partial<Activity>) => {
    if (editingActivity) {
      await updateActivity(editingActivity.id, data);
    } else {
      await addActivity(data as Parameters<typeof addActivity>[0]);
    }
    setEditingActivity(null);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this activity?")) {
      await deleteActivity(id);
    }
  };

  const handleReorder = useCallback(
    async (activeId: string, overId: string) => {
      const oldIndex = activities.findIndex((a) => a.id === activeId);
      const newIndex = activities.findIndex((a) => a.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      // Update sort_order for the moved activity
      const targetOrder = activities[newIndex].sort_order;
      await updateActivity(activeId, { sort_order: targetOrder });
    },
    [activities, updateActivity]
  );

  const handleActivitySelectFromMap = (id: string) => {
    setSelectedActivityId(id === selectedActivityId ? null : id);
  };

  // Build a flat ordered list for map pin indexing
  const orderedForMap = [
    ...activitiesByBlock.flatMap((b) => b.activities),
    ...unscheduled,
  ].filter((a) => a.latitude && a.longitude);

  // Group activities by hour for hourly view
  const hourlyActivities = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7;
    const hourStr = hour.toString().padStart(2, "0");
    return {
      hour,
      label: `${hourStr}:00`,
      activities: activities.filter((a) => {
        if (!a.start_time) return false;
        const actHour = parseInt(a.start_time.split(":")[0]);
        return actHour === hour;
      }),
    };
  });

  // Compute index offset for each block (for map pin labels)
  let runningIndex = 0;
  const blockIndexOffsets: number[] = [];
  for (const block of activitiesByBlock) {
    blockIndexOffsets.push(runningIndex);
    runningIndex += block.activities.filter(
      (a) => a.latitude && a.longitude
    ).length;
  }

  const activityList = (
    <>
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border p-4">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : viewMode === "blocks" ? (
        <div className="space-y-6">
          {activitiesByBlock.map((block, blockIdx) => (
            <div key={block.key}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <span>{block.emoji}</span>
                {block.label}
                {block.activities.length > 0 && (
                  <span className="text-xs bg-gray-100 px-1.5 rounded-full">
                    {block.activities.length}
                  </span>
                )}
              </h3>
              {block.activities.length > 0 ? (
                <SortableActivityList
                  activities={block.activities}
                  onReorder={handleReorder}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  selectedActivityId={selectedActivityId}
                  onSelectActivity={handleActivitySelectFromMap}
                  votes={votes}
                  onVote={vote}
                  members={members}
                  indexOffset={blockIndexOffsets[blockIdx]}
                />
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No activities yet
                </div>
              )}
            </div>
          ))}

          {unscheduled.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Unscheduled
              </h3>
              <SortableActivityList
                activities={unscheduled}
                onReorder={handleReorder}
                onEdit={handleEdit}
                onDelete={handleDelete}
                selectedActivityId={selectedActivityId}
                onSelectActivity={handleActivitySelectFromMap}
                votes={votes}
                onVote={vote}
                members={members}
                indexOffset={runningIndex}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {hourlyActivities.map((slot) => (
            <div key={slot.hour} className="flex border-t py-2 min-h-[3rem]">
              <span className="w-16 text-xs text-muted-foreground pt-1 flex-shrink-0">
                {slot.label}
              </span>
              <div className="flex-1 space-y-1">
                {slot.activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isSelected={activity.id === selectedActivityId}
                    onSelect={handleActivitySelectFromMap}
                    votes={votes[activity.id]}
                    onVote={vote}
                    creatorProfile={
                      activity.created_by
                        ? members[activity.created_by] || null
                        : null
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div>
      {/* Header controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">{formatDate(date)}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setViewMode("blocks")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "blocks"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Blocks
            </button>
            <button
              onClick={() => setViewMode("hourly")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "hourly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Hourly
            </button>
          </div>

          {/* Map toggle (mobile) */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? (
              <List className="h-4 w-4" />
            ) : (
              <Map className="h-4 w-4" />
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingActivity(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Responsive layout: side-by-side on desktop, toggle on mobile */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Activities list — always visible on desktop, toggled on mobile */}
        <div
          className={`flex-1 min-w-0 ${
            showMap && geoActivities.length > 0 ? "hidden lg:block" : "block"
          }`}
        >
          {activityList}
        </div>

        {/* Map panel — always visible on desktop if geo activities exist, toggled on mobile */}
        {geoActivities.length > 0 && (
          <div
            className={`lg:w-[45%] lg:sticky lg:top-4 lg:self-start ${
              showMap ? "block" : "hidden lg:block"
            }`}
          >
            <div className="rounded-lg overflow-hidden border shadow-sm">
              <ActivityMap
                activities={orderedForMap}
                selectedActivityId={selectedActivityId}
                onActivitySelect={handleActivitySelectFromMap}
              />
            </div>

            {/* Travel segments summary */}
            {orderedForMap.length > 1 && (
              <div className="mt-3 rounded-lg border bg-white p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Route
                </h4>
                <div className="space-y-1.5">
                  {orderedForMap.map((act, i) => {
                    if (i === orderedForMap.length - 1) return null;
                    const next = orderedForMap[i + 1];
                    const dist = getDistanceKm(
                      act.latitude!,
                      act.longitude!,
                      next.latitude!,
                      next.longitude!
                    );
                    const walkMins = Math.round((dist / 5) * 60);
                    const driveMins = Math.max(1, Math.round((dist / 40) * 60));
                    return (
                      <div
                        key={`${act.id}-${next.id}`}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 border-t border-dashed" />
                        <span>
                          {dist < 1
                            ? `${Math.round(dist * 1000)}m`
                            : `${dist.toFixed(1)}km`}
                        </span>
                        <span className="text-muted-foreground">
                          ~{walkMins}min walk / ~{driveMins}min drive
                        </span>
                        <span className="flex-1 border-t border-dashed" />
                        <span className="font-medium text-foreground">
                          {String.fromCharCode(65 + i + 1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ActivityForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingActivity(null);
        }}
        onSubmit={handleSubmit}
        tripId={tripId}
        date={date}
        editActivity={editingActivity}
      />
    </div>
  );
}

// Haversine formula for straight-line distance
function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

"use client";

import { useState } from "react";
import { useActivities } from "@/hooks/useActivities";
import { ActivityCard } from "./ActivityCard";
import { ActivityForm } from "./ActivityForm";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/types";
import type { Activity } from "@/lib/types";
import { Plus, ChevronLeft } from "lucide-react";

interface DayViewProps {
  tripId: string;
  date: string;
  onBack: () => void;
}

type ViewMode = "blocks" | "hourly";

const BLOCKS = [
  { key: "morning", label: "Morning", icon: "sun" },
  { key: "afternoon", label: "Afternoon", icon: "cloud-sun" },
  { key: "evening", label: "Evening", icon: "moon" },
] as const;

export function DayView({ tripId, date, onBack }: DayViewProps) {
  const { activities, loading, addActivity, updateActivity, deleteActivity } =
    useActivities(tripId, date);
  const [viewMode, setViewMode] = useState<ViewMode>("blocks");
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const activitiesByBlock = BLOCKS.map((block) => ({
    ...block,
    activities: activities.filter((a) => a.block === block.key),
  }));

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

  // Group activities by hour for hourly view
  const hourlyActivities = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7; // 7 AM to 10 PM
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

  return (
    <div>
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
          {activitiesByBlock.map((block) => (
            <div key={block.key}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                {block.label}
              </h3>
              {block.activities.length > 0 ? (
                <div className="space-y-2">
                  {block.activities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No activities yet
                </div>
              )}
            </div>
          ))}

          {/* Activities without a block */}
          {activities.filter((a) => !a.block).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Unscheduled
              </h3>
              <div className="space-y-2">
                {activities
                  .filter((a) => !a.block)
                  .map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {hourlyActivities.map((slot) => (
            <div
              key={slot.hour}
              className="flex border-t py-2 min-h-[3rem]"
            >
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
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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

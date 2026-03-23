"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActivityCard } from "./ActivityCard";
import type { Activity, Profile } from "@/lib/types";

interface SortableActivityListProps {
  activities: Activity[];
  onReorder: (activeId: string, overId: string) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  selectedActivityId?: string | null;
  onSelectActivity?: (id: string) => void;
  votes?: Record<string, { up: number; down: number; userVote: -1 | 1 | null }>;
  onVote?: (activityId: string, vote: 1 | -1) => void;
  members?: Record<string, Profile>;
  indexOffset?: number;
}

function SortableItem({
  activity,
  index,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  votes,
  onVote,
  creatorProfile,
}: {
  activity: Activity;
  index: number;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  votes?: { up: number; down: number; userVote: -1 | 1 | null };
  onVote?: (activityId: string, vote: 1 | -1) => void;
  creatorProfile?: Profile | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ActivityCard
        activity={activity}
        index={index}
        onEdit={onEdit}
        onDelete={onDelete}
        isSelected={isSelected}
        onSelect={onSelect}
        votes={votes}
        onVote={onVote}
        creatorProfile={creatorProfile}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export function SortableActivityList({
  activities,
  onReorder,
  onEdit,
  onDelete,
  selectedActivityId,
  onSelectActivity,
  votes,
  onVote,
  members,
  indexOffset = 0,
}: SortableActivityListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={activities.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {activities.map((activity, i) => (
            <SortableItem
              key={activity.id}
              activity={activity}
              index={indexOffset + i}
              onEdit={onEdit}
              onDelete={onDelete}
              isSelected={activity.id === selectedActivityId}
              onSelect={onSelectActivity}
              votes={votes?.[activity.id]}
              onVote={onVote}
              creatorProfile={
                activity.created_by && members
                  ? members[activity.created_by] || null
                  : null
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

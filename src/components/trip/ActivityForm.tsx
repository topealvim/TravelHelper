"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Activity, ActivityCategory } from "@/lib/types";

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Activity>) => Promise<void>;
  tripId: string;
  date: string;
  editActivity?: Activity | null;
}

const CATEGORIES: { value: ActivityCategory; label: string }[] = [
  { value: "activity", label: "Activity" },
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
  { value: "accommodation", label: "Accommodation" },
  { value: "free", label: "Free Time" },
];

export function ActivityForm({
  open,
  onOpenChange,
  onSubmit,
  tripId,
  date,
  editActivity,
}: ActivityFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ActivityCategory | "">("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [cost, setCost] = useState("");
  const [block, setBlock] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editActivity) {
      setTitle(editActivity.title);
      setDescription(editActivity.description || "");
      setCategory((editActivity.category as ActivityCategory) || "");
      setStartTime(editActivity.start_time || "");
      setEndTime(editActivity.end_time || "");
      setLocation(editActivity.location || "");
      setCost(editActivity.cost?.toString() || "");
      setBlock(editActivity.block || "");
    } else {
      setTitle("");
      setDescription("");
      setCategory("");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setCost("");
      setBlock("");
    }
  }, [editActivity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        trip_id: tripId,
        date,
        title,
        description: description || null,
        category: (category as ActivityCategory) || null,
        start_time: startTime || null,
        end_time: endTime || null,
        location: location || null,
        cost: cost ? parseFloat(cost) : null,
        block: (block as Activity["block"]) || null,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {editActivity ? "Edit Activity" : "Add Activity"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Visit La Sagrada Familia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Book tickets in advance..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setCategory(category === cat.value ? "" : cat.value)
                  }
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    category === cat.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Time of Day</Label>
            <div className="flex gap-2">
              {["morning", "afternoon", "evening"].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBlock(block === b ? "" : b)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    block === b
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {b.charAt(0).toUpperCase() + b.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="La Sagrada Familia, Barcelona"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost (optional)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              placeholder="26.00"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editActivity
                  ? "Save Changes"
                  : "Add Activity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

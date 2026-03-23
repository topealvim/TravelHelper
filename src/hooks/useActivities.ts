"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Activity } from "@/lib/types";

export function useActivities(tripId: string, date?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchActivities = useCallback(async () => {
    let query = supabase
      .from("activities")
      .select("*")
      .eq("trip_id", tripId)
      .order("sort_order", { ascending: true })
      .order("start_time", { ascending: true });

    if (date) {
      query = query.eq("date", date);
    }

    const { data } = await query;
    setActivities(data || []);
    setLoading(false);
  }, [tripId, date, supabase]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`activities-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, supabase, fetchActivities]);

  const addActivity = async (
    data: Omit<Activity, "id" | "created_at" | "updated_at" | "created_by" | "currency">
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("activities").insert({
      ...data,
      created_by: user?.id || null,
    });
    if (error) throw error;
  };

  const updateActivity = async (id: string, data: Partial<Activity>) => {
    const { error } = await supabase
      .from("activities")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  };

  const deleteActivity = async (id: string) => {
    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", id);
    if (error) throw error;
  };

  return {
    activities,
    loading,
    addActivity,
    updateActivity,
    deleteActivity,
    refetch: fetchActivities,
  };
}

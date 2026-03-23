"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Trip, TripWithMembers } from "@/lib/types";

export function useTrips() {
  const [trips, setTrips] = useState<TripWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTrips = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get trips where user is a member
    const { data: memberRows } = await supabase
      .from("trip_members")
      .select("trip_id")
      .eq("user_id", user.id);

    if (!memberRows || memberRows.length === 0) {
      setTrips([]);
      setLoading(false);
      return;
    }

    const tripIds = memberRows.map((r) => r.trip_id);

    const { data: tripsData } = await supabase
      .from("trips")
      .select("*")
      .in("id", tripIds)
      .order("start_date", { ascending: true });

    if (!tripsData) {
      setTrips([]);
      setLoading(false);
      return;
    }

    // Get members and activity counts for each trip
    const tripsWithDetails: TripWithMembers[] = await Promise.all(
      tripsData.map(async (trip) => {
        const { data: members } = await supabase
          .from("trip_members")
          .select("*, profile:profiles(*)")
          .eq("trip_id", trip.id);

        const { count } = await supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("trip_id", trip.id);

        return {
          ...trip,
          members: members || [],
          activity_count: count || 0,
        };
      })
    );

    setTrips(tripsWithDetails);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const createTrip = async (data: {
    name: string;
    destination: string;
    start_date: string;
    end_date: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        name: data.name,
        destination: data.destination,
        start_date: data.start_date,
        end_date: data.end_date,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as owner
    await supabase.from("trip_members").insert({
      trip_id: trip.id,
      user_id: user.id,
      role: "owner",
    });

    await fetchTrips();
    return trip as Trip;
  };

  const deleteTrip = async (tripId: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", tripId);
    if (error) throw error;
    await fetchTrips();
  };

  return { trips, loading, createTrip, deleteTrip, refetch: fetchTrips };
}

export function useTripDetail(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      setTrip(data);
      setLoading(false);
    }
    fetch();
  }, [tripId, supabase]);

  return { trip, loading };
}

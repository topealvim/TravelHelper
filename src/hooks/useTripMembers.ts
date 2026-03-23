"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function useTripMembers(tripId: string) {
  const [members, setMembers] = useState<
    Record<string, Profile>
  >({});
  const supabase = createClient();

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("trip_members")
      .select("user_id, profiles:user_id(id, display_name, avatar_url)")
      .eq("trip_id", tripId);

    if (!data) return;

    const map: Record<string, Profile> = {};
    for (const row of data as unknown as Array<{ user_id: string; profiles: Profile | Profile[] }>) {
      if (row.profiles) {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        if (profile) map[row.user_id] = profile;
      }
    }
    setMembers(map);
  }, [tripId, supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members };
}

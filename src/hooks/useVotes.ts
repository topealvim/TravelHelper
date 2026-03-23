"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActivityVote } from "@/lib/types";

export function useVotes(tripId: string, date?: string) {
  const [votes, setVotes] = useState<Record<string, { up: number; down: number; userVote: -1 | 1 | null }>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, [supabase]);

  const fetchVotes = useCallback(async () => {
    // Get all activity IDs for this trip/date
    let actQuery = supabase
      .from("activities")
      .select("id")
      .eq("trip_id", tripId);
    if (date) actQuery = actQuery.eq("date", date);
    const { data: activityRows } = await actQuery;
    if (!activityRows) return;

    const activityIds = activityRows.map((a) => a.id);
    if (activityIds.length === 0) {
      setVotes({});
      return;
    }

    const { data: voteRows } = await supabase
      .from("activity_votes")
      .select("*")
      .in("activity_id", activityIds);

    const result: typeof votes = {};
    for (const id of activityIds) {
      result[id] = { up: 0, down: 0, userVote: null };
    }
    for (const v of (voteRows || []) as ActivityVote[]) {
      if (!result[v.activity_id]) {
        result[v.activity_id] = { up: 0, down: 0, userVote: null };
      }
      if (v.vote === 1) result[v.activity_id].up++;
      else result[v.activity_id].down++;
      if (v.user_id === userId) {
        result[v.activity_id].userVote = v.vote;
      }
    }
    setVotes(result);
  }, [tripId, date, userId, supabase]);

  useEffect(() => {
    if (userId !== null) fetchVotes();
  }, [fetchVotes, userId]);

  const vote = useCallback(
    async (activityId: string, voteValue: 1 | -1) => {
      if (!userId) return;
      const current = votes[activityId]?.userVote;

      if (current === voteValue) {
        // Remove vote
        await supabase
          .from("activity_votes")
          .delete()
          .eq("activity_id", activityId)
          .eq("user_id", userId);
      } else {
        // Upsert vote
        await supabase.from("activity_votes").upsert(
          {
            activity_id: activityId,
            user_id: userId,
            vote: voteValue,
          },
          { onConflict: "activity_id,user_id" }
        );
      }
      await fetchVotes();
    },
    [userId, votes, supabase, fetchVotes]
  );

  return { votes, vote, refetch: fetchVotes };
}

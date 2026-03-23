export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string;
  end_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TripMember = {
  trip_id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  joined_at: string;
  profile?: Profile;
};

export type ActivityCategory =
  | "food"
  | "transport"
  | "activity"
  | "accommodation"
  | "free";

export type Activity = {
  id: string;
  trip_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  block: "morning" | "afternoon" | "evening" | null;
  title: string;
  description: string | null;
  category: ActivityCategory | null;
  location: string | null;
  location_url: string | null;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  cost: number | null;
  currency: string;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityVote = {
  activity_id: string;
  user_id: string;
  vote: -1 | 1;
  created_at: string;
};

export type AuditEntry = {
  id: string;
  trip_id: string;
  user_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  description: string | null;
  created_at: string;
};

export type ActivityWithVotes = Activity & {
  votes_up: number;
  votes_down: number;
  user_vote: -1 | 1 | null;
};

export type TripWithMembers = Trip & {
  members: TripMember[];
  activity_count: number;
};

// Helper to get days between two dates
export function getTripDays(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  food: "bg-orange-100 text-orange-800 border-orange-200",
  transport: "bg-blue-100 text-blue-800 border-blue-200",
  activity: "bg-green-100 text-green-800 border-green-200",
  accommodation: "bg-purple-100 text-purple-800 border-purple-200",
  free: "bg-gray-100 text-gray-800 border-gray-200",
};

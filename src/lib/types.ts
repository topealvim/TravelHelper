export interface Profile {
  id: string
  display_name: string
  avatar_url: string
}

export interface Trip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface TripMember {
  trip_id: string
  user_id: string
  role: "owner" | "editor" | "viewer"
  profile: Profile
}

export interface Activity {
  id: string
  trip_id: string
  date: string
  start_time: string | null
  end_time: string | null
  block: "morning" | "afternoon" | "evening" | null
  title: string
  description: string | null
  category: "food" | "transport" | "activity" | "accommodation" | "free"
  location: string | null
  location_url: string | null
  place_id: string | null
  latitude: number | null
  longitude: number | null
  cost: number | null
  currency: string
  sort_order: number
  created_by: string
  votes: { up: number; down: number; userVote: -1 | 0 | 1 }
}

export interface Accommodation {
  id: string
  trip_id: string
  name: string
  type: "hotel" | "airbnb" | "house" | "hostel" | "other"
  check_in: string // YYYY-MM-DD
  check_out: string // YYYY-MM-DD
  address: string | null
  latitude: number | null
  longitude: number | null
  booking_url: string | null
  cost_per_night: number | null
  currency: string
  notes: string | null
}

export const ACCOMMODATION_CONFIG: Record<
  Accommodation["type"],
  { label: string; icon: string }
> = {
  hotel: { label: "Hotel", icon: "Building2" },
  airbnb: { label: "Airbnb", icon: "Home" },
  house: { label: "House", icon: "House" },
  hostel: { label: "Hostel", icon: "BedDouble" },
  other: { label: "Other", icon: "MapPin" },
}

export interface AuditEntry {
  id: string
  trip_id: string
  actor_name: string
  action: "create" | "update" | "delete" | "move" | "vote"
  entity_type: "activity" | "trip" | "member"
  description: string
  created_at: string
}

export type ViewMode = "blocks" | "hourly"

export const CATEGORY_CONFIG: Record<
  Activity["category"],
  { label: string; icon: string }
> = {
  food: { label: "Food", icon: "UtensilsCrossed" },
  transport: { label: "Transport", icon: "Car" },
  activity: { label: "Activity", icon: "Compass" },
  accommodation: { label: "Accommodation", icon: "Bed" },
  free: { label: "Free Time", icon: "Coffee" },
}

"use client"

import { MapPin, Settings, Users, Clock, ChevronRight, Building2, Home, House, BedDouble, Calendar } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Trip, TripMember, AuditEntry, Accommodation } from "@/lib/types"
import { cn } from "@/lib/utils"

const ACCOMMODATION_ICONS = {
  hotel: Building2,
  airbnb: Home,
  house: House,
  hostel: BedDouble,
  other: MapPin,
}

interface SidebarProps {
  trips: Trip[]
  currentTripId?: string
  members?: TripMember[]
  accommodations?: Accommodation[]
  auditLog?: AuditEntry[]
  onSelectTrip: (tripId: string) => void
  open: boolean
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function Sidebar({ trips, currentTripId, members = [], accommodations = [], auditLog = [], onSelectTrip, open }: SidebarProps) {
  if (!open) return null

  return (
    <aside className="fixed inset-y-14 left-0 z-40 flex w-72 flex-col border-r bg-white shadow-lg lg:static lg:inset-auto lg:z-auto lg:shadow-none">
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Trip list */}
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trips
          </h2>
          <div className="space-y-1">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => onSelectTrip(trip.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  currentTripId === trip.id && "bg-muted font-medium"
                )}
              >
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{trip.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{trip.destination}</p>
                </div>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>

          {/* Members */}
          {members.length > 0 && (
            <>
              <Separator className="my-4" />
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Members
              </h2>
              <div className="space-y-1">
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-2 px-3 py-1.5">
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-medium">
                        {m.profile.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{m.profile.display_name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{m.role}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Accommodations */}
          {accommodations.length > 0 && (
            <>
              <Separator className="my-4" />
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Accommodations
              </h2>
              <div className="space-y-2">
                {accommodations.map((acc) => {
                  const Icon = ACCOMMODATION_ICONS[acc.type]
                  const checkIn = new Date(acc.check_in + "T00:00:00")
                  const checkOut = new Date(acc.check_out + "T00:00:00")
                  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
                  return (
                    <div
                      key={acc.id}
                      className="rounded-lg border border-stone-200 bg-stone-50 p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-stone-200">
                          <Icon className="size-3.5 text-stone-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{acc.name}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{acc.type}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>
                          {checkIn.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" → "}
                          {checkOut.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-stone-400">·</span>
                        <span>{nights} {nights === 1 ? "night" : "nights"}</span>
                      </div>
                      {acc.cost_per_night && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          €{acc.cost_per_night}/night · ~€{acc.cost_per_night * nights} total
                        </p>
                      )}
                      {acc.notes && (
                        <p className="mt-1.5 text-[11px] text-stone-400 italic truncate">
                          {acc.notes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Activity Feed */}
          {auditLog.length > 0 && (
            <>
              <Separator className="my-4" />
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Activity Feed
              </h2>
              <div className="space-y-2">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="flex gap-2 px-3 py-1">
                    <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs leading-relaxed">
                        <span className="font-medium">{entry.actor_name}</span>{" "}
                        {entry.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(entry.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}

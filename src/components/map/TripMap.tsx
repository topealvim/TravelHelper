"use client"

import { useState } from "react"
import { MapPin, Navigation, Footprints, Train } from "lucide-react"
import type { Activity } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TripMapProps {
  activities: Activity[]
  selectedActivityId?: string | null
  onSelectActivity?: (id: string) => void
}

// Mock map: positions activities on a relative grid based on their lat/lng
function normalizePositions(activities: Activity[]) {
  const withCoords = activities.filter((a) => a.latitude && a.longitude)
  if (withCoords.length === 0) return []

  const lats = withCoords.map((a) => a.latitude!)
  const lngs = withCoords.map((a) => a.longitude!)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const latRange = maxLat - minLat || 0.01
  const lngRange = maxLng - minLng || 0.01

  // Add padding
  const padding = 60
  const mapW = 100 // percentage
  const mapH = 100

  return withCoords.map((a, i) => ({
    activity: a,
    x: padding / 2 + ((a.longitude! - minLng) / lngRange) * (mapW - padding),
    y: padding / 2 + ((maxLat - a.latitude!) / latRange) * (mapH - padding),
    label: String.fromCharCode(65 + i),
  }))
}

// Fake travel segments between consecutive activities
const TRAVEL_MODES = [
  { icon: Footprints, label: "walk", duration: "15 min", distance: "1.2 km" },
  { icon: Train, label: "metro", duration: "12 min", distance: "3.4 km" },
  { icon: Footprints, label: "walk", duration: "8 min", distance: "0.6 km" },
  { icon: Navigation, label: "drive", duration: "10 min", distance: "4.1 km" },
]

export function TripMap({ activities, selectedActivityId, onSelectActivity }: TripMapProps) {
  const positions = normalizePositions(activities)

  if (positions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 p-8">
        <p className="text-sm text-muted-foreground">No locations to display</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Map area */}
      <div className="relative h-[350px] overflow-hidden rounded-xl border bg-[#f8f9fa]">
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* "Streets" - decorative lines */}
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Horizontal roads */}
          <line x1="0" y1="30" x2="100" y2="30" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="0" y1="55" x2="100" y2="55" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.5" />
          {/* Vertical roads */}
          <line x1="25" y1="0" x2="25" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="78" y1="0" x2="78" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />
        </svg>

        {/* Route line connecting pins */}
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={positions.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="0.4"
            strokeDasharray="1.5,1"
          />
        </svg>

        {/* Activity pins */}
        {positions.map((pos) => {
          const isSelected = selectedActivityId === pos.activity.id
          return (
            <button
              key={pos.activity.id}
              onClick={() => onSelectActivity?.(pos.activity.id)}
              className="absolute -translate-x-1/2 -translate-y-full transition-all"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {/* Pin shape */}
              <div className={cn(
                "relative flex flex-col items-center",
                isSelected && "scale-125 z-10"
              )}>
                <div className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold shadow-sm transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white bg-foreground text-background"
                )}>
                  {pos.label}
                </div>
                {/* Pin tail */}
                <div className={cn(
                  "size-1.5 -mt-0.5 rotate-45 border-b-2 border-r-2",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-foreground bg-foreground"
                )} />
                {/* Label */}
                <span className={cn(
                  "mt-1 max-w-[100px] truncate whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium shadow-sm",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-foreground"
                )}>
                  {pos.activity.title}
                </span>
              </div>
            </button>
          )
        })}

        {/* Map attribution mock */}
        <div className="absolute bottom-2 right-2 rounded bg-white/80 px-2 py-0.5 text-[9px] text-muted-foreground">
          Google Maps (preview)
        </div>
      </div>

      {/* Travel segments between activities */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Route</h4>
        {positions.map((pos, i) => {
          if (i === positions.length - 1) return null
          const next = positions[i + 1]
          const travel = TRAVEL_MODES[i % TRAVEL_MODES.length]
          const TravelIcon = travel.icon

          return (
            <div key={pos.activity.id} className="flex items-center gap-2 text-xs">
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
                {pos.label}
              </span>
              <span className="text-muted-foreground">{pos.activity.title}</span>
              <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                <TravelIcon className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">{travel.duration}</span>
                <span className="text-muted-foreground/60">·</span>
                <span className="text-muted-foreground/60">{travel.distance}</span>
              </div>
              <div className="h-px flex-1 bg-border" />
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
                {next.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

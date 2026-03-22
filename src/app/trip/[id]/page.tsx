"use client"

import { useState } from "react"
import { Map, X, Building2, Home, House, BedDouble, MapPin, Plus } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { WeekView } from "@/components/trip/WeekView"
import { DayView } from "@/components/trip/DayView"
import { TripMap } from "@/components/map/TripMap"
import { ActivityDetail } from "@/components/trip/ActivityDetail"
import { AccommodationModal } from "@/components/trip/AccommodationModal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  mockTrips,
  mockActivities,
  mockTripMembers,
  mockAuditLog,
  mockMembers,
  mockAccommodations,
  getActivitiesByDate,
  getAccommodationForDate,
} from "@/lib/mock-data"
import type { Accommodation } from "@/lib/types"

const ACC_ICONS: Record<Accommodation["type"], typeof Building2> = {
  hotel: Building2,
  airbnb: Home,
  house: House,
  hostel: BedDouble,
  other: MapPin,
}

function AccommodationChips({
  accommodations,
  onClickAccommodation,
  onClickAdd,
}: {
  accommodations: Accommodation[]
  onClickAccommodation: (acc: Accommodation) => void
  onClickAdd: () => void
}) {
  return (
    <div className="mb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
      {accommodations.map((acc) => {
        const Icon = ACC_ICONS[acc.type]
        const checkIn = new Date(acc.check_in + "T00:00:00")
        const checkOut = new Date(acc.check_out + "T00:00:00")
        const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
        const dateLabel = `${checkIn.toLocaleDateString("en-US", { month: "short", day: "numeric" })} → ${checkOut.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`

        return (
          <button
            key={acc.id}
            onClick={() => onClickAccommodation(acc)}
            className="group flex items-center gap-2 shrink-0 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs transition-all hover:border-stone-400 hover:shadow-sm active:scale-95"
          >
            <Icon className="size-3.5 text-stone-500" />
            <span className="font-medium text-stone-700 truncate max-w-[120px] sm:max-w-none">{acc.name}</span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-500 whitespace-nowrap">{dateLabel}</span>
            <span className="text-stone-400 hidden sm:inline">· {nights}n</span>
          </button>
        )
      })}
      <button
        onClick={onClickAdd}
        className="flex items-center gap-1.5 shrink-0 rounded-full border border-dashed border-stone-300 px-3 py-1.5 text-xs text-stone-400 transition-all hover:border-stone-400 hover:text-stone-600 active:scale-95"
      >
        <Plus className="size-3" />
        Add stay
      </button>
    </div>
  )
}

export default function TripPage() {
  const trip = mockTrips[0]
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(trip.start_date)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [showMobileMap, setShowMobileMap] = useState(false)
  const [showActivityDetail, setShowActivityDetail] = useState(false)
  const [accommodations, setAccommodations] = useState<Accommodation[]>(mockAccommodations)
  const [accModalOpen, setAccModalOpen] = useState(false)
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null)

  const dayActivities = selectedDate ? getActivitiesByDate(selectedDate) : []
  const dayAccommodation = selectedDate ? getAccommodationForDate(selectedDate) : null
  const selectedActivity = selectedActivityId
    ? mockActivities.find((a) => a.id === selectedActivityId) || null
    : null

  const handleSelectActivity = (id: string) => {
    setSelectedActivityId(id)
    setShowActivityDetail(true)
  }

  const handleCloseDetail = () => {
    setShowActivityDetail(false)
  }

  return (
    <div className="flex h-dvh flex-col">
      <Header
        tripName={trip.name}
        members={mockMembers}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onShare={() => {}}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          trips={mockTrips}
          currentTripId={trip.id}
          members={mockTripMembers}
          accommodations={accommodations}
          auditLog={mockAuditLog}
          onSelectTrip={() => {}}
          open={sidebarOpen}
        />

        <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
          {/* Week view header — hidden on mobile when detail is open */}
          <div className={cn(
            "shrink-0 border-b bg-white px-4 pt-3 pb-3 lg:px-6 lg:pt-4 lg:pb-4",
            showActivityDetail && "hidden lg:block"
          )}>
            <div className="mb-3 lg:mb-4">
              <h1 className="text-lg font-bold lg:text-xl">{trip.name}</h1>
              <p className="text-xs text-muted-foreground lg:text-sm">
                {trip.destination} ·{" "}
                {new Date(trip.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {" - "}
                {new Date(trip.end_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>

            {/* Accommodation chips */}
            <AccommodationChips
              accommodations={accommodations}
              onClickAccommodation={(acc) => { setEditingAccommodation(acc); setAccModalOpen(true) }}
              onClickAdd={() => { setEditingAccommodation(null); setAccModalOpen(true) }}
            />

            <div className="-mx-4 px-4 lg:mx-0 lg:px-0">
              <WeekView
                trip={trip}
                activities={mockActivities}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>
          </div>

          {/* Content area */}
          {selectedDate && (
            <div className="flex min-h-0 flex-1">
              {/* Activities panel */}
              {!(showMobileMap && dayActivities.length > 0) && !showActivityDetail && (
                <div className="flex-1 overflow-y-auto p-4 pb-20 lg:border-r lg:p-6 lg:pb-6">
                  <DayView
                    date={selectedDate}
                    activities={dayActivities}
                    accommodation={dayAccommodation}
                    selectedActivityId={selectedActivityId}
                    onSelectActivity={handleSelectActivity}
                  />
                </div>
              )}

              {/* Mobile: Activity detail (fullscreen) */}
              {showActivityDetail && selectedActivity && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white lg:hidden">
                  <ActivityDetail
                    activity={selectedActivity}
                    onClose={handleCloseDetail}
                  />
                </div>
              )}

              {/* Mobile map view */}
              {showMobileMap && dayActivities.length > 0 && !showActivityDetail && (
                <div className="flex-1 overflow-y-auto p-4 lg:hidden">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Map</h3>
                    <Button variant="outline" size="sm" onClick={() => setShowMobileMap(false)}>
                      Show activities
                    </Button>
                  </div>
                  <TripMap
                    activities={dayActivities}
                    selectedActivityId={selectedActivityId}
                    onSelectActivity={(id) => {
                      setSelectedActivityId(id)
                      setShowMobileMap(false)
                    }}
                  />
                </div>
              )}

              {/* Desktop: right panel — activity detail or map */}
              <div className="hidden lg:flex w-[45%] shrink-0 flex-col overflow-hidden border-l">
                {showActivityDetail && selectedActivity ? (
                  <ActivityDetail
                    activity={selectedActivity}
                    onClose={handleCloseDetail}
                  />
                ) : dayActivities.length > 0 ? (
                  <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
                    <TripMap
                      activities={dayActivities}
                      selectedActivityId={selectedActivityId}
                      onSelectActivity={handleSelectActivity}
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-50/50">
                    <p className="text-sm text-muted-foreground">Add activities to see them on the map</p>
                  </div>
                )}
              </div>

              {/* Desktop: activities panel when detail is open */}
              {showActivityDetail && (
                <div className="hidden lg:block flex-1 overflow-y-auto p-6 border-r">
                  <DayView
                    date={selectedDate}
                    activities={dayActivities}
                    accommodation={dayAccommodation}
                    selectedActivityId={selectedActivityId}
                    onSelectActivity={handleSelectActivity}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating map button (mobile only) */}
      {selectedDate && dayActivities.length > 0 && !showMobileMap && !showActivityDetail && (
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <Button
            onClick={() => setShowMobileMap(true)}
            className="rounded-full shadow-lg h-12 px-5 gap-2"
          >
            <Map className="size-4" />
            Map
          </Button>
        </div>
      )}

      {/* Accommodation modal */}
      <AccommodationModal
        accommodation={editingAccommodation}
        open={accModalOpen}
        onOpenChange={setAccModalOpen}
        onSave={(updated) => {
          setAccommodations((prev) => {
            const existing = prev.findIndex((a) => a.id === updated.id)
            if (existing >= 0) {
              const next = [...prev]
              next[existing] = updated
              return next
            }
            return [...prev, updated]
          })
        }}
        onDelete={(id) => {
          setAccommodations((prev) => prev.filter((a) => a.id !== id))
        }}
      />
    </div>
  )
}

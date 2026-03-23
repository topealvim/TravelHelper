"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { WeekView } from "@/components/trip/WeekView";
import { DayView } from "@/components/trip/DayView";
import { useTripDetail } from "@/hooks/useTrip";
import { useActivities } from "@/hooks/useActivities";
import { getTripDays, formatDate } from "@/lib/types";
import { MapPin, Calendar } from "lucide-react";

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  const { trip, loading: tripLoading } = useTripDetail(id);
  const { activities, loading: activitiesLoading } = useActivities(id);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-1/4 mb-8" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Trip not found</h1>
          <p className="text-muted-foreground mt-2">
            This trip may have been deleted or you don&apos;t have access.
          </p>
        </main>
      </div>
    );
  }

  const days = getTripDays(trip.start_date, trip.end_date);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Trip header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{trip.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            {trip.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {trip.destination}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </span>
          </div>
        </div>

        {selectedDate ? (
          <DayView
            tripId={id}
            date={selectedDate}
            onBack={() => setSelectedDate(null)}
          />
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Week Overview</h2>
            <WeekView
              days={days}
              activities={activities}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* Quick summary */}
            {!activitiesLoading && activities.length > 0 && (
              <div className="mt-6 rounded-lg border bg-white p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Trip Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{days.length}</div>
                    <div className="text-xs text-muted-foreground">Days</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activities.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Activities
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activities.filter((a) => a.location).length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Locations
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activities.reduce(
                        (sum, a) => sum + (a.cost || 0),
                        0
                      ).toFixed(0) !== "0"
                        ? `$${activities.reduce((sum, a) => sum + (a.cost || 0), 0).toFixed(0)}`
                        : "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Est. Cost
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

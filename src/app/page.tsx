"use client"

import { useState } from "react"
import { MapPin, Plus, Calendar, ChevronRight, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { mockTrips, mockMembers } from "@/lib/mock-data"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b bg-white px-6">
        <div className="flex items-center gap-2">
          <Plane className="size-5 text-primary" />
          <span className="text-lg font-semibold">TravelHelper</span>
        </div>
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            Y
          </AvatarFallback>
        </Avatar>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Your Trips</h1>
          <p className="text-muted-foreground">Plan and organize your travel adventures.</p>
        </div>

        {/* Create new trip */}
        <Button className="mb-6" size="lg">
          <Plus className="size-4" />
          New Trip
        </Button>

        {/* Trip list */}
        <div className="grid gap-4 sm:grid-cols-2">
          {mockTrips.map((trip) => {
            const startDate = new Date(trip.start_date + "T00:00:00")
            const endDate = new Date(trip.end_date + "T00:00:00")
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1
            const members = mockMembers.filter((_, i) => i < (trip.id === "trip-1" ? 4 : 2))

            return (
              <Link key={trip.id} href={`/trip/${trip.id}`}>
                <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 py-0 overflow-hidden">
                  {/* Color banner */}
                  <div className="h-2 bg-gradient-to-r from-primary/80 to-primary/40" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{trip.name}</h3>
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {trip.destination}
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground mt-1" />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span>
                          {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" - "}
                          {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-muted-foreground/60">· {days} days</span>
                      </div>

                      <div className="flex -space-x-1.5">
                        {members.slice(0, 3).map((m) => (
                          <Avatar key={m.id} className="size-6 border-2 border-white">
                            <AvatarFallback className="bg-primary/10 text-[9px] font-medium">
                              {m.display_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {members.length > 3 && (
                          <Avatar className="size-6 border-2 border-white">
                            <AvatarFallback className="bg-muted text-[9px]">
                              +{members.length - 3}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}

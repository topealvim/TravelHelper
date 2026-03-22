"use client"

import { useState, useEffect } from "react"
import {
  Building2, Home, House, BedDouble, MapPin, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import type { Accommodation } from "@/lib/types"
import { cn } from "@/lib/utils"

const ACC_TYPES: { value: Accommodation["type"]; label: string; icon: typeof Building2 }[] = [
  { value: "hotel", label: "Hotel", icon: Building2 },
  { value: "airbnb", label: "Airbnb", icon: Home },
  { value: "house", label: "House", icon: House },
  { value: "hostel", label: "Hostel", icon: BedDouble },
  { value: "other", label: "Other", icon: MapPin },
]

interface AccommodationModalProps {
  accommodation?: Accommodation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Accommodation) => void
  onDelete?: (id: string) => void
}

export function AccommodationModal({
  accommodation,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: AccommodationModalProps) {
  const isEditing = !!accommodation

  const [form, setForm] = useState<{
    name: string
    type: Accommodation["type"]
    check_in: string
    check_out: string
    address: string
    cost_per_night: string
    currency: string
    notes: string
  }>({
    name: accommodation?.name || "",
    type: accommodation?.type || "hotel",
    check_in: accommodation?.check_in || "",
    check_out: accommodation?.check_out || "",
    address: accommodation?.address || "",
    cost_per_night: accommodation?.cost_per_night?.toString() || "",
    currency: accommodation?.currency || "EUR",
    notes: accommodation?.notes || "",
  })

  // Sync form when modal opens or accommodation changes
  useEffect(() => {
    if (open) {
      setForm({
        name: accommodation?.name || "",
        type: accommodation?.type || "hotel",
        check_in: accommodation?.check_in || "",
        check_out: accommodation?.check_out || "",
        address: accommodation?.address || "",
        cost_per_night: accommodation?.cost_per_night?.toString() || "",
        currency: accommodation?.currency || "EUR",
        notes: accommodation?.notes || "",
      })
    }
  }, [open, accommodation])

  const handleSave = () => {
    const checkIn = new Date(form.check_in + "T00:00:00")
    const checkOut = new Date(form.check_out + "T00:00:00")
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)

    onSave({
      id: accommodation?.id || `acc-new-${Date.now()}`,
      trip_id: accommodation?.trip_id || "trip-1",
      name: form.name,
      type: form.type,
      check_in: form.check_in,
      check_out: form.check_out,
      address: form.address || null,
      latitude: accommodation?.latitude || null,
      longitude: accommodation?.longitude || null,
      booking_url: accommodation?.booking_url || null,
      cost_per_night: form.cost_per_night ? parseFloat(form.cost_per_night) : null,
      currency: form.currency,
      notes: form.notes || null,
    })
    onOpenChange(false)
  }

  const canSave = form.name.trim() && form.check_in && form.check_out && form.check_out > form.check_in

  // Compute nights for display
  const nights = (() => {
    if (!form.check_in || !form.check_out) return 0
    const checkIn = new Date(form.check_in + "T00:00:00")
    const checkOut = new Date(form.check_out + "T00:00:00")
    return Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000))
  })()

  const totalCost = nights > 0 && form.cost_per_night ? nights * parseFloat(form.cost_per_night) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Stay" : "Add Stay"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your accommodation details" : "Where are you staying?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Hotel Arts Barcelona"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Type
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ACC_TYPES.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.value}
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                      form.type === t.value
                        ? "border-primary bg-primary/5 font-medium"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Check-in
              </label>
              <input
                type="date"
                value={form.check_in}
                onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Check-out
              </label>
              <input
                type="date"
                value={form.check_out}
                onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Nights display */}
          {nights > 0 && (
            <p className="text-xs text-muted-foreground -mt-2">
              {nights} {nights === 1 ? "night" : "nights"}
              {totalCost > 0 && ` · ~€${totalCost} total`}
            </p>
          )}

          {/* Address */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Address
            </label>
            <div className="mt-1 flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Search for address..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Cost per night */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Cost per night
              </label>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-sm text-muted-foreground">€</span>
                <input
                  type="number"
                  value={form.cost_per_night}
                  onChange={(e) => setForm({ ...form, cost_per_night: e.target.value })}
                  placeholder="0"
                  min={0}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Sea view room, breakfast included"
              rows={2}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <DialogFooter>
          {isEditing && onDelete && (
            <Button
              variant="ghost"
              onClick={() => { onDelete(accommodation.id); onOpenChange(false) }}
              className="text-destructive hover:text-destructive sm:mr-auto"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!canSave}
          >
            {isEditing ? "Save changes" : "Add stay"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

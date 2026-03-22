"use client"

import { useState, useEffect } from "react"
import {
  X, MapPin, Clock, Euro, Send, Lightbulb,
  UtensilsCrossed, Car, Compass, Bed, Coffee, MessageCircle,
  ThumbsUp, AlertTriangle, Ticket, Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_CONFIG } from "@/lib/types"
import type { Activity } from "@/lib/types"
import { mockMembers } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { VoteButtons } from "./VoteButtons"

const CATEGORY_ICONS = {
  food: UtensilsCrossed,
  transport: Car,
  activity: Compass,
  accommodation: Bed,
  free: Coffee,
}

const CATEGORIES = ["food", "transport", "activity", "accommodation", "free"] as const

interface Comment {
  id: string
  author: string
  text: string
  created_at: string
}

interface Tip {
  id: string
  icon: "lightbulb" | "thumbsUp" | "alert" | "ticket"
  title: string
  text: string
  source: string
}

// Mock comments per activity
const MOCK_COMMENTS: Record<string, Comment[]> = {
  "act-1": [
    { id: "c1", author: "Maria", text: "I booked tickets for 9am slot. Confirmation email forwarded!", created_at: "2026-03-21T10:00:00Z" },
    { id: "c2", author: "Dad", text: "Can we do the tower visit too? It's €36 instead of €26 but worth it", created_at: "2026-03-21T14:00:00Z" },
    { id: "c3", author: "You", text: "Tower visit booked! Updated the cost.", created_at: "2026-03-21T15:30:00Z" },
  ],
  "act-2": [
    { id: "c4", author: "Mom", text: "Bring water bottles, there's not much shade!", created_at: "2026-03-21T11:00:00Z" },
  ],
  "act-3": [
    { id: "c5", author: "Dad", text: "Let's try the jamón ibérico stand on the right side of the market", created_at: "2026-03-22T09:00:00Z" },
  ],
  "act-5": [
    { id: "c6", author: "Maria", text: "I'll make a reservation. How many tapas plates should I ask for?", created_at: "2026-03-22T10:00:00Z" },
  ],
  "act-15": [
    { id: "c7", author: "You", text: "Free entry on first Sunday of the month, but our dates don't match", created_at: "2026-03-22T16:00:00Z" },
    { id: "c8", author: "Maria", text: "The temporary exhibition on Blue Period looks amazing!", created_at: "2026-03-22T17:00:00Z" },
  ],
  "act-19": [
    { id: "c9", author: "Dad", text: "The Sant Joan trail is 2.5h round trip. Should we do the shorter Sant Miquel instead?", created_at: "2026-03-22T12:00:00Z" },
    { id: "c10", author: "Mom", text: "Shorter one please! My knees won't survive 2.5h of hiking", created_at: "2026-03-22T13:00:00Z" },
  ],
}

// Mock tips per activity
const MOCK_TIPS: Record<string, Tip[]> = {
  "act-1": [
    { id: "t1", icon: "ticket", title: "Book tickets early", text: "Tickets sell out 2-3 weeks in advance, especially morning slots. Book online at sagradafamilia.org for guaranteed entry.", source: "Lonely Planet" },
    { id: "t2", icon: "lightbulb", title: "Best time to visit", text: "Morning light (9-11am) creates stunning colors through the east-facing stained glass windows. Afternoon light hits the west side.", source: "Lonely Planet" },
    { id: "t3", icon: "thumbsUp", title: "Tower access", text: "The Nativity Facade tower has better views and an easier descent. Passion Facade tower is less crowded.", source: "TripAdvisor" },
    { id: "t4", icon: "alert", title: "Pickpockets", text: "Be aware of pickpockets around the entrance area. Keep valuables in front pockets or a crossbody bag.", source: "Travel Advisory" },
  ],
  "act-2": [
    { id: "t5", icon: "ticket", title: "Monumental Zone ticket", text: "The paid Monumental Zone has the famous mosaic benches and best views. Free areas are also beautiful but less iconic.", source: "Lonely Planet" },
    { id: "t6", icon: "lightbulb", title: "Arrive early", text: "Get there right at opening (9:30am) to avoid crowds. The park gets very busy after 10:30am.", source: "Lonely Planet" },
    { id: "t7", icon: "thumbsUp", title: "Photo tip", text: "Best Instagram spot is the terrace with the mosaic salamander (El Drac) — go down the main staircase.", source: "Travel Blog" },
  ],
  "act-3": [
    { id: "t8", icon: "lightbulb", title: "Skip the tourist traps", text: "Avoid the restaurants at the front of the market. Head to the back and sides for more authentic, affordable stalls.", source: "Lonely Planet" },
    { id: "t9", icon: "thumbsUp", title: "Must-try", text: "Try the fresh fruit smoothies (€2-3), jamón ibérico, and the seafood counter El Quim de la Boqueria.", source: "Food Guide" },
    { id: "t10", icon: "alert", title: "Closed Sundays", text: "La Boqueria is closed on Sundays and public holidays. Monday mornings can also be quiet.", source: "Official Website" },
  ],
  "act-15": [
    { id: "t11", icon: "lightbulb", title: "Free entry times", text: "Free entry every first Sunday of the month and Thursday evenings from 5pm. Book free tickets online as they run out quickly.", source: "Lonely Planet" },
    { id: "t12", icon: "thumbsUp", title: "Audio guide", text: "The audio guide (€5) is excellent and covers the key works in about 90 minutes. Available in 7 languages.", source: "Museum Guide" },
    { id: "t13", icon: "ticket", title: "Combined tickets", text: "Consider the Articket BCN (€35) if visiting multiple museums — covers 6 major museums.", source: "Barcelona Tourism" },
  ],
  "act-19": [
    { id: "t14", icon: "lightbulb", title: "Tot Montserrat ticket", text: "The Tot Montserrat package (€45) includes train, cable car, museum entry, and a meal. Best value for day trips.", source: "Lonely Planet" },
    { id: "t15", icon: "thumbsUp", title: "Boys' Choir", text: "The Escolania boys' choir sings daily at 1pm (Mon-Fri) in the basilica. Arrive 15 min early for a seat.", source: "Lonely Planet" },
    { id: "t16", icon: "alert", title: "Weather dependent", text: "Montserrat can be significantly cooler and windier than Barcelona. Bring a jacket even in summer.", source: "Travel Advisory" },
  ],
}

const TIP_ICONS = {
  lightbulb: Lightbulb,
  thumbsUp: ThumbsUp,
  alert: AlertTriangle,
  ticket: Ticket,
}

interface ActivityDetailProps {
  activity: Activity
  onClose: () => void
}

export function ActivityDetail({ activity, onClose }: ActivityDetailProps) {
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "tips">("details")
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS[activity.id] || [])

  // Editable fields
  const initialDuration = (() => {
    if (!activity.start_time || !activity.end_time) return 60
    const [sh, sm] = activity.start_time.split(":").map(Number)
    const [eh, em] = activity.end_time.split(":").map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  })()

  const [editData, setEditData] = useState({
    title: activity.title,
    description: activity.description || "",
    start_time: activity.start_time || "09:00",
    duration: initialDuration > 0 ? initialDuration : 60,
    location: activity.location || "",
    cost: activity.cost ?? 0,
    category: activity.category,
  })

  // Reset when activity changes
  useEffect(() => {
    setComments(MOCK_COMMENTS[activity.id] || [])
    setEditData({
      title: activity.title,
      description: activity.description || "",
      start_time: activity.start_time || "09:00",
      duration: initialDuration > 0 ? initialDuration : 60,
      location: activity.location || "",
      cost: activity.cost ?? 0,
      category: activity.category,
    })
  }, [activity.id])

  const computedEndTime = (() => {
    const [h, m] = editData.start_time.split(":").map(Number)
    const totalMins = h * 60 + m + editData.duration
    const endH = Math.floor(totalMins / 60) % 24
    const endM = totalMins % 60
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
  })()

  const cat = CATEGORY_CONFIG[editData.category]
  const Icon = CATEGORY_ICONS[editData.category]
  const creator = mockMembers.find((m) => m.id === activity.created_by)
  const tips = MOCK_TIPS[activity.id] || []

  const handleSendComment = () => {
    if (!newComment.trim()) return
    setComments([
      ...comments,
      {
        id: `c-new-${Date.now()}`,
        author: "You",
        text: newComment.trim(),
        created_at: new Date().toISOString(),
      },
    ])
    setNewComment("")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact header */}
      <div className="shrink-0 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{editData.title || activity.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {cat.label}
                </Badge>
                {creator && (
                  <span className="text-[10px] text-muted-foreground">
                    by {creator.display_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <VoteButtons up={activity.votes.up} down={activity.votes.down} userVote={activity.votes.userVote} />
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3-tab switcher */}
      <div className="shrink-0 flex mx-4 mt-2 mb-0 bg-muted rounded-lg p-0.5 h-8">
        <button
          onClick={() => setActiveTab("details")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors",
            activeTab === "details" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Pencil className="size-3" />
          Details
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors",
            activeTab === "notes" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="size-3" />
          Notes ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab("tips")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors",
            activeTab === "tips" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Lightbulb className="size-3" />
          Tips {tips.length > 0 && `(${tips.length})`}
        </button>
      </div>

      {/* ===== Details tab (editable form) ===== */}
      {activeTab === "details" && (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Title</label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Add a description..."
                rows={2}
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Category</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => {
                  const CatIcon = CATEGORY_ICONS[c]
                  const catConfig = CATEGORY_CONFIG[c]
                  return (
                    <button
                      key={c}
                      onClick={() => setEditData({ ...editData, category: c })}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                        editData.category === c
                          ? "border-primary bg-primary/5 font-medium"
                          : "hover:bg-muted"
                      )}
                    >
                      <CatIcon className="size-3" />
                      {catConfig.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Start</label>
                <select
                  value={editData.start_time}
                  onChange={(e) => setEditData({ ...editData, start_time: e.target.value })}
                  className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Array.from({ length: 48 }, (_, i) => {
                    const h = Math.floor(i / 2)
                    const m = (i % 2) * 30
                    const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
                    return <option key={val} value={val}>{val}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Duration</label>
                <select
                  value={editData.duration}
                  onChange={(e) => setEditData({ ...editData, duration: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {[30, 60, 90, 120, 150, 180, 240, 300, 360].map((mins) => {
                    const label = mins >= 60
                      ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? `${mins % 60}m` : ""}`
                      : `${mins}m`
                    return <option key={mins} value={mins}>{label}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">End</label>
                <div className="mt-1 rounded-md border bg-muted/50 px-2 py-2 text-xs text-muted-foreground">
                  {computedEndTime}
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Location</label>
              <div className="mt-1 flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Search for a place..."
                />
              </div>
            </div>

            {/* Cost */}
            <div className="w-1/2">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cost (€)</label>
              <input
                type="number"
                value={editData.cost}
                onChange={(e) => setEditData({ ...editData, cost: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                min={0}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== Notes tab ===== */}
      {activeTab === "notes" && (
        <div className="flex-1 flex flex-col min-h-0 px-4">
          <div className="flex-1 overflow-y-auto py-3">
            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="size-6 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-primary/10 text-[9px] font-medium">
                        {comment.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium">{comment.author}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5 leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageCircle className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No notes yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Add a note or comment for your travel group
                </p>
              </div>
            )}
          </div>

          {/* Comment input */}
          <div className="shrink-0 border-t py-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                placeholder="Add a note..."
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                size="sm"
                onClick={handleSendComment}
                disabled={!newComment.trim()}
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Tips tab ===== */}
      {activeTab === "tips" && (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {tips.length > 0 ? (
            <div className="space-y-3">
              {tips.map((tip) => {
                const TipIcon = TIP_ICONS[tip.icon]
                return (
                  <div
                    key={tip.id}
                    className={cn(
                      "rounded-lg border p-3",
                      tip.icon === "alert"
                        ? "border-amber-200 bg-amber-50"
                        : "border-stone-200 bg-stone-50"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <TipIcon
                        className={cn(
                          "size-4 shrink-0 mt-0.5",
                          tip.icon === "alert" ? "text-amber-600" : "text-stone-500"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{tip.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {tip.text}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                          Source: {tip.source}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Lightbulb className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No tips available</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Tips from travel guides will appear here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

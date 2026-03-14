# TravelHelper - Implementation Plan

## Overview
A collaborative trip planning web app where family members can view, edit, and vote on itineraries. The AI brain lives in **Claude Desktop via MCP** — you chat with Claude naturally, and it reads/writes trip data directly to the database. The web app is a real-time visual dashboard with full editing capabilities and a complete audit trail of all changes.

```
┌─────────────────────┐        ┌──────────────┐        ┌──────────────────┐
│   Claude Desktop    │◄─MCP──►│  MCP Server  │◄──────►│    Supabase      │
│   (you chat here)   │        │  (Node.js)   │        │   (PostgreSQL)   │
└─────────────────────┘        └──────────────┘        └────────┬─────────┘
                                                                │
                                                         Realtime sync
                                                                │
                                                       ┌────────▼─────────┐
                                                       │    Web App       │
                                                       │  (Next.js on     │
                                                       │   Vercel)        │
                                                       │                  │
                                                       │  - Week/Day view │
                                                       │  - Edit/add      │
                                                       │  - Audit trail   │
                                                       │  - Vote/react    │
                                                       │  - Invite family │
                                                       └──────────────────┘
```

**Key insight:** Claude (via your subscription) is the AI planner. The web app is the shared visual workspace. Zero AI API costs.

---

## 1. UI Design

### Layout (responsive)
```
+-------------------------------------------------------------+
| HEADER: Trip name | Members avatars | Share button | History |
+-------------------------------------------------------------+
|  SIDEBAR (collapsible)  |        MAIN CONTENT               |
|                         |                                    |
|  - Trip list            |   WEEK VIEW (default)              |
|  - Trip settings        |   +---+---+---+---+---+---+---+   |
|  - Members              |   |Mon|Tue|Wed|Thu|Fri|Sat|Sun|   |
|  - Activity feed /      |   |   |   |   |   |   |   |   |   |
|    audit trail          |   | 3 | 2 | 5 | 1 | 4 | 3 | 2 |   |
|                         |   |act|act|act|act|act|act|act|   |
|                         |   +---+---+---+---+---+---+---+   |
|                         |                                    |
|                         |   Click a day -> DAY VIEW          |
+-------------------------------------------------------------+
```

### Day View (togglable detail level)
```
Toggle: [ Blocks ] [ Hourly ]

BLOCKS MODE:                    HOURLY MODE:
+-----------------------+       +-----------------------+
| ☀ Morning              |       | 08:00  Breakfast      |
|  - Breakfast at hotel  |       | 09:00  Museum visit   |
|  - Museum visit   👍3  |       | 10:00  ...            |
+-----------------------+       | 11:00  ...            |
| 🌤 Afternoon            |       | 12:00  Lunch at...    |
|  - Lunch at...         |       | 13:00  Free time     |
|  - Beach          👍5  |       | ...                   |
+-----------------------+       | 19:00  Dinner         |
| 🌙 Evening              |       | 20:00  Night walk     |
|  - Dinner              |       +-----------------------+
|  - Night walk          |
+-----------------------+
```

### Day View with Map (responsive)
```
DESKTOP (side-by-side):
+------------------------------+-------------------------------+
| ACTIVITIES                   | GOOGLE MAP                    |
|                              |                               |
| ☀ Morning                     |     [Interactive Map]          |
| 📍 La Sagrada Familia         |                               |
|    9:00 - 11:00              |     A ── 15min walk ── B      |
|                              |     │                  │      |
|  🚶 15 min walk · 1.2 km     |     │    12min metro   │      |
|  🚇 12 min metro (L4→L3)     |     │        ↓         │      |
|                              |     C ◄────────────────┘      |
| 📍 Park Güell                 |                               |
|    11:30 - 13:00             |     Pins: A, B, C             |
|                              |     Route line connecting all |
| 🌤 Afternoon                   |                               |
| 📍 La Boqueria Market         |     Click activity → map      |
|    13:30 - 15:00             |     pans + highlights pin     |
+------------------------------+-------------------------------+

MOBILE (toggle overlay):
+---------------------------+
| [📍 Show Map]              |
|                           |
| ☀ Morning                  |
| 📍 La Sagrada Familia      |
|    9:00 - 11:00           |
|  🚶 15 min · 🚇 12 min     |
| 📍 Park Güell              |
|    11:30 - 13:00          |
|                           |
| (tap Show Map → full      |
|  screen map overlay with  |
|  all pins + route)        |
+---------------------------+
```

### Key UI Interactions
- **Drag & drop** activities between time slots
- **Inline editing** — click any activity to edit details (location, notes, links, cost)
- **Location autocomplete** — Google Places autocomplete when adding/editing activities
- **Interactive map** — numbered pins (A→B→C) for day activities, connected route line
- **Travel segments** — between each activity, shows distance + duration for walk/transit/drive
- **Click activity ↔ map sync** — click an activity to highlight its pin; click a pin to scroll to the activity
- **Color-coded categories** — food, transport, activity, accommodation, free time
- **Member indicators** — small avatar on activities to show who added it
- **Voting** — thumbs up/down on activities so family can express preferences
- **Activity feed / Audit trail** — sidebar showing "Maria added 'Beach day' to Tuesday", "Dad moved 'Museum' from morning to afternoon", "Claude generated 3 activities for Wednesday"

### Pages
1. **Home/Dashboard** — list of trips, create new trip
2. **Trip View** — the main planning interface (week + day views + map)
3. **Trip History** — full audit trail with ability to revert changes
4. **Invite page** — shareable link to join a trip

---

## 2. Architecture

### Tech Stack
| Layer          | Technology              | Why                                    | Cost     |
|----------------|------------------------|----------------------------------------|----------|
| Framework      | **Next.js 14 (App Router)** | Full-stack, SSR, API routes, Vercel-native | Free |
| UI             | **React + Tailwind CSS + shadcn/ui** | Fast to build, beautiful components | Free |
| Database       | **Supabase (PostgreSQL)** | Free tier, real-time, RLS, auth | Free |
| Auth           | **Supabase Auth (Google OAuth)** | Integrated with DB, handles Google sign-in | Free |
| AI Integration | **MCP Server → Claude Desktop** | Uses your existing Claude subscription | Free |
| Maps           | **Google Maps JS API + Directions + Places** | 10K free req/mo each — family use is ~1-5% | Free |
| Hosting        | **Vercel**              | Free tier, auto-deploy from GitHub | Free |
| Real-time      | **Supabase Realtime**   | Built-in, no extra infra | Free |
| **Total**      |                        |                                        | **$0/mo** |

### MCP Server
The MCP server is a small Node.js/TypeScript process that runs locally alongside Claude Desktop. It exposes these tools to Claude:

```
MCP Tools:
├── list_trips()                    → Show all your trips
├── get_trip(trip_id)               → Get trip details + all activities
├── create_trip(name, dest, dates)  → Create a new trip
├── add_activity(trip_id, day, ...) → Add an activity to a day
├── edit_activity(id, ...)          → Modify an existing activity
├── remove_activity(id)             → Delete an activity
├── move_activity(id, new_day, ...) → Move activity to different day/time
├── get_day(trip_id, date)          → Get all activities for a specific day
├── generate_itinerary(trip_id)     → AI reads trip context, fills in activities
└── get_history(trip_id, limit)     → View recent changes (audit trail)
```

**Usage example in Claude Desktop:**
> You: "We're going to Barcelona for 5 days starting March 20. Set up the trip and suggest a first day."
> Claude: *calls create_trip, then add_activity multiple times* "Done! I've created the trip and added Day 1: morning at La Sagrada Familia, lunch at La Boqueria market, afternoon stroll through Gothic Quarter, dinner at a tapas place in El Born."
> *Your family immediately sees it appear in the web app in real-time*

### Database Schema (Supabase/PostgreSQL)
```sql
-- Users (managed by Supabase Auth, extended with profile)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Trips
CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trip members (who can collaborate)
CREATE TABLE trip_members (
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  role text DEFAULT 'editor',  -- 'owner' | 'editor' | 'viewer'
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);

-- Activities (the core planning data)
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,           -- null in block mode
  end_time time,             -- null in block mode
  block text,                -- 'morning' | 'afternoon' | 'evening' (null in hourly)
  title text NOT NULL,
  description text,
  category text,             -- 'food' | 'transport' | 'activity' | 'accommodation' | 'free'
  location text,
  location_url text,         -- Google Maps link, etc.
  place_id text,             -- Google Places ID (for precise map pin)
  latitude decimal,          -- GPS coordinates
  longitude decimal,         -- GPS coordinates
  cost decimal,
  currency text DEFAULT 'USD',
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Votes on activities
CREATE TABLE activity_votes (
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),  -- -1 = down, 1 = up
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (activity_id, user_id)
);

-- Audit trail (every change is logged)
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid,              -- null if done by MCP/Claude
  actor_name text,           -- 'Maria', 'Claude', etc.
  action text NOT NULL,      -- 'create' | 'update' | 'delete' | 'move' | 'vote'
  entity_type text NOT NULL, -- 'activity' | 'trip' | 'member'
  entity_id uuid,
  old_values jsonb,          -- previous state (for undo)
  new_values jsonb,          -- new state
  description text,          -- human-readable: "Added 'Museum visit' to Tuesday morning"
  created_at timestamptz DEFAULT now()
);

-- Invite links
CREATE TABLE trip_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Database trigger: auto-log changes to audit_log
-- (implemented via Supabase database functions/triggers)
```

### Audit Trail Implementation
Changes are captured at **two levels**:
1. **Database triggers** — automatically log INSERT/UPDATE/DELETE on `activities` table to `audit_log`, capturing old/new values
2. **Application-level descriptions** — the MCP server and web app write human-readable descriptions ("Claude added 'Beach day' to Wednesday afternoon")

This enables:
- **Activity feed** in the sidebar showing recent changes
- **Revert** any change by restoring `old_values` from the audit log
- **Filter by person** — see what Claude suggested vs what family edited

### Project Structure
```
TravelHelper/
├── src/                          # Next.js web app
│   ├── app/
│   │   ├── page.tsx              # Landing/dashboard
│   │   ├── layout.tsx            # Root layout + providers
│   │   ├── login/page.tsx        # Google sign-in page
│   │   ├── trip/[id]/
│   │   │   ├── page.tsx          # Main trip planning view
│   │   │   ├── history/page.tsx  # Full audit trail
│   │   │   └── invite/page.tsx   # Accept invite page
│   │   └── api/
│   │       └── invite/route.ts   # Create/validate invites
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── trip/
│   │   │   ├── WeekView.tsx      # Weekly calendar grid
│   │   │   ├── DayView.tsx       # Day detail (blocks + hourly toggle)
│   │   │   ├── ActivityCard.tsx  # Draggable activity card
│   │   │   ├── ActivityForm.tsx  # Add/edit activity modal (with Places autocomplete)
│   │   │   ├── VoteButtons.tsx   # Thumbs up/down
│   │   │   └── MemberAvatars.tsx
│   │   ├── map/
│   │   │   ├── TripMap.tsx       # Google Maps with activity pins + route
│   │   │   ├── TravelSegment.tsx # Distance/duration card between activities
│   │   │   └── PlaceAutocomplete.tsx # Google Places autocomplete input
│   │   ├── history/
│   │   │   ├── AuditFeed.tsx     # Activity feed sidebar
│   │   │   └── AuditEntry.tsx    # Single audit log entry
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   └── middleware.ts     # Auth middleware
│   │   ├── audit.ts              # Audit trail helpers
│   │   ├── google-maps.ts        # Maps API loader + helpers
│   │   └── types.ts              # TypeScript types
│   └── hooks/
│       ├── useTrip.ts            # Trip data + real-time subscription
│       ├── useActivities.ts      # Activities CRUD + real-time
│       ├── useAuditFeed.ts       # Audit trail real-time feed
│       └── useVotes.ts           # Voting state
├── mcp-server/                   # MCP server for Claude Desktop
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts              # MCP server entry point
│   │   ├── tools/
│   │   │   ├── trips.ts          # Trip CRUD tools
│   │   │   ├── activities.ts     # Activity CRUD tools
│   │   │   └── history.ts        # Audit trail tools
│   │   └── lib/
│   │       └── supabase.ts       # Supabase client for MCP
│   └── README.md                 # Setup instructions for Claude Desktop
├── supabase/
│   └── migrations/               # SQL migration files
│       ├── 001_initial_schema.sql
│       └── 002_audit_triggers.sql
├── public/
├── package.json
├── tailwind.config.ts
├── next.config.js
└── .env.local.example            # Template for env vars
```

### Real-time Collaboration
- Supabase Realtime subscriptions on `activities` and `audit_log` tables
- When anyone (web app user OR Claude via MCP) changes data, all connected browsers update instantly
- Audit feed updates live in the sidebar

---

## 3. Cost Breakdown

| Service          | Free Tier                            | Cost   |
|------------------|--------------------------------------|--------|
| Vercel           | 100GB bandwidth, serverless fns      | $0     |
| Supabase         | 500MB DB, 1GB storage, 50K MAU       | $0     |
| Google OAuth     | Free                                 | $0     |
| Claude Desktop   | Your existing subscription           | $0*    |
| MCP Server       | Runs locally on your machine         | $0     |
| **Total**        |                                      | **$0** |

*You're already paying for Claude — MCP is included with your subscription.

---

## 4. Implementation Phases

### Phase 1 — Foundation
- [ ] Next.js project setup with Tailwind + shadcn/ui
- [ ] Supabase schema + RLS policies + audit triggers
- [ ] Google OAuth login flow
- [ ] Dashboard: list trips, create trip
- [ ] Basic trip view (week grid, click to see day)

### Phase 2 — Planning Interface + Maps
- [ ] Day view with block/hourly toggle
- [ ] Activity CRUD (add, edit, delete, reorder)
- [ ] Google Places autocomplete for location input
- [ ] Embedded Google Map with numbered activity pins (A→B→C)
- [ ] Travel segments between activities (distance + walk/transit/drive options)
- [ ] Click-to-sync between activity list and map pins
- [ ] Responsive: side-by-side on desktop, toggle overlay on mobile
- [ ] Drag & drop between slots
- [ ] Category color coding
- [ ] Member avatars on activities
- [ ] Voting (thumbs up/down) on activities

### Phase 3 — Audit Trail & Collaboration
- [ ] Database triggers for automatic audit logging
- [ ] Activity feed sidebar (real-time)
- [ ] Change revert functionality
- [ ] Invite link generation + acceptance flow
- [ ] Real-time sync via Supabase Realtime
- [ ] Member management (roles)

### Phase 4 — MCP Server (Claude Integration)
- [ ] MCP server project setup
- [ ] Trip CRUD tools
- [ ] Activity CRUD tools (with audit trail entries)
- [ ] History/audit tools
- [ ] Claude Desktop configuration + setup docs
- [ ] Test end-to-end: chat with Claude → data appears in web app

### Phase 5 — Polish
- [ ] Mobile responsive design
- [ ] Cost tracker per day/trip
- [ ] Export itinerary (PDF/share link)
- [ ] Dark mode

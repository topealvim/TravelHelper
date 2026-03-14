# TravelHelper - Implementation Plan

## Overview
A collaborative trip planning web app where family members can co-create itineraries with AI assistance. Visual weekly/daily views with togglable detail levels (time blocks vs hourly), real-time collaboration, and an integrated Claude AI chat assistant.

---

## 1. UI Design

### Layout (3-panel responsive design)
```
+-------------------------------------------------------------+
| HEADER: Trip name | Members avatars | Share button | Settings|
+-------------------------------------------------------------+
|  SIDEBAR (collapsible)  |        MAIN CONTENT               |
|                         |                                    |
|  - Trip list            |   WEEK VIEW (default)              |
|  - Trip settings        |   +---+---+---+---+---+---+---+   |
|  - Members              |   |Mon|Tue|Wed|Thu|Fri|Sat|Sun|   |
|  - AI Chat panel        |   |   |   |   |   |   |   |   |   |
|    (expandable)         |   | 3 | 2 | 5 | 1 | 4 | 3 | 2 |   |
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
| Morning               |       | 08:00  Breakfast      |
|  - Breakfast at hotel  |       | 09:00  Museum visit   |
|  - Museum visit        |       | 10:00  ...            |
+-----------------------+       | 11:00  ...            |
| Afternoon             |       | 12:00  Lunch at...    |
|  - Lunch at...         |       | 13:00  Free time     |
|  - Beach               |       | ...                   |
+-----------------------+       | 19:00  Dinner         |
| Evening               |       | 20:00  Night walk     |
|  - Dinner              |       +-----------------------+
|  - Night walk          |
+-----------------------+
```

### Key UI Interactions
- **Drag & drop** activities between time slots
- **Inline editing** — click any activity to edit details (location, notes, links, cost)
- **Color-coded categories** — food, transport, activity, accommodation, free time
- **Member indicators** — small avatar on activities to show who added/is interested
- **AI button** on each day/slot — "Suggest something here" contextual AI
- **Chat panel** — slide-out sidebar for free-form AI conversation about the trip

### Pages
1. **Home/Dashboard** — list of trips, create new trip
2. **Trip View** — the main planning interface (week + day views)
3. **Invite page** — shareable link to join a trip

---

## 2. Architecture

### Tech Stack
| Layer          | Technology              | Why                                    |
|----------------|------------------------|----------------------------------------|
| Framework      | **Next.js 14 (App Router)** | Full-stack, SSR, API routes, Vercel-native |
| UI             | **React + Tailwind CSS + shadcn/ui** | Fast to build, beautiful components |
| Database       | **Supabase (PostgreSQL)** | Free tier, real-time subscriptions, row-level security |
| Auth           | **Supabase Auth (Google OAuth)** | Integrated with DB, free, handles Google sign-in |
| AI             | **Claude API (Anthropic)** | Via Next.js API routes as proxy |
| Hosting        | **Vercel**              | Free tier, auto-deploy from GitHub |
| Real-time      | **Supabase Realtime**   | Built-in, no extra cost |

### Database Schema (Supabase/PostgreSQL)
```sql
-- Users (managed by Supabase Auth, extended with profile)
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  display_name text,
  avatar_url text
)

-- Trips
trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
)

-- Trip members (who can collaborate)
trip_members (
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  role text DEFAULT 'editor',  -- 'owner' | 'editor' | 'viewer'
  PRIMARY KEY (trip_id, user_id)
)

-- Activities (the core planning data)
activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,           -- null in block mode
  end_time time,             -- null in block mode
  block text,                -- 'morning' | 'afternoon' | 'evening' (null in hourly mode)
  title text NOT NULL,
  description text,
  category text,             -- 'food' | 'transport' | 'activity' | 'accommodation' | 'free'
  location text,
  cost decimal,
  currency text DEFAULT 'USD',
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
)

-- AI chat history per trip
chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  role text NOT NULL,        -- 'user' | 'assistant'
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
)

-- Invite links
trip_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
)
```

### Project Structure
```
TravelHelper/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing/dashboard
│   │   ├── layout.tsx          # Root layout + providers
│   │   ├── login/page.tsx      # Google sign-in page
│   │   ├── trip/[id]/
│   │   │   ├── page.tsx        # Main trip planning view
│   │   │   └── invite/page.tsx # Accept invite page
│   │   └── api/
│   │       ├── ai/
│   │       │   ├── suggest/route.ts    # Activity suggestions
│   │       │   ├── generate/route.ts   # Full itinerary generation
│   │       │   └── chat/route.ts       # Chat streaming endpoint
│   │       └── invite/route.ts         # Create/validate invites
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── trip/
│   │   │   ├── WeekView.tsx    # Weekly calendar grid
│   │   │   ├── DayView.tsx     # Day detail (blocks + hourly toggle)
│   │   │   ├── ActivityCard.tsx # Draggable activity card
│   │   │   ├── ActivityForm.tsx # Add/edit activity modal
│   │   │   └── MemberAvatars.tsx
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx   # Slide-out AI chat
│   │   │   └── ChatMessage.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── ai.ts               # Claude API helper
│   │   └── types.ts            # TypeScript types
│   └── hooks/
│       ├── useTrip.ts          # Trip data + real-time subscription
│       ├── useActivities.ts    # Activities CRUD + real-time
│       └── useChat.ts          # AI chat state
├── supabase/
│   └── migrations/             # SQL migration files
├── public/
├── package.json
├── tailwind.config.ts
├── next.config.js
└── .env.local.example          # Template for env vars
```

### API Routes (AI Integration)
- `POST /api/ai/suggest` — Given a day + destination + existing activities, suggest activities
- `POST /api/ai/generate` — Given trip dates + destination + preferences, generate full itinerary
- `POST /api/ai/chat` — Streaming chat about the trip (context-aware: knows the itinerary)

### Real-time Collaboration
- Supabase Realtime subscriptions on `activities` table
- When any member adds/edits/deletes an activity, all connected clients see it instantly
- No complex conflict resolution needed for 2-5 users

---

## 3. Cost Breakdown (Zero-Cost Target)

| Service        | Free Tier                          | Our Usage          |
|----------------|------------------------------------|--------------------|
| **Vercel**     | 100GB bandwidth, serverless functions | Well within limits |
| **Supabase**   | 500MB DB, 1GB storage, 50K MAU, real-time | Well within limits |
| **Google OAuth** | Free                            | Free               |
| **Claude API** | **Not free** — see note below      | ~$0.50-2/trip*     |

> *Claude API cost note:* The Claude API is not free. For a family project with light usage, costs would be very low ($1-5/month). Options to manage this:
> 1. Set a monthly spend cap on your Anthropic API key
> 2. Limit AI calls per trip (e.g., 20 suggestions + 5 generations per trip)
> 3. Alternative: use a free/open-source LLM via Ollama (self-hosted) — but quality will be lower

---

## 4. Implementation Phases

### Phase 1 — Foundation (Core App)
- [ ] Next.js project setup with Tailwind + shadcn/ui
- [ ] Supabase project setup (schema, RLS policies)
- [ ] Google OAuth login flow
- [ ] Dashboard: list trips, create trip
- [ ] Basic trip view (week grid, click to see day)

### Phase 2 — Planning Interface
- [ ] Day view with block/hourly toggle
- [ ] Activity CRUD (add, edit, delete, reorder)
- [ ] Drag & drop between slots
- [ ] Category color coding
- [ ] Member avatars on activities

### Phase 3 — Collaboration
- [ ] Invite link generation + acceptance flow
- [ ] Real-time sync via Supabase Realtime
- [ ] Member management (roles)

### Phase 4 — AI Integration
- [ ] Chat panel with Claude (streaming responses)
- [ ] "Suggest activity" contextual button
- [ ] "Generate itinerary" for empty trips
- [ ] AI context: trip details + existing activities sent with each request

### Phase 5 — Polish
- [ ] Mobile responsive design
- [ ] Cost tracker per day/trip
- [ ] Export itinerary (PDF/share link)
- [ ] Dark mode

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

## 3. Cost Constraint & Breakdown

> **HARD CONSTRAINT: $0/month.** This is a personal/family project. Every technology choice must stay within free tiers. If a free tier limit is ever at risk, we degrade gracefully — never upgrade to a paid plan.

| Service          | Free Tier                            | Our Usage Estimate         | Cost   |
|------------------|--------------------------------------|---------------------------|--------|
| Vercel           | 100GB bandwidth, serverless fns      | ~1-2GB/month              | $0     |
| Supabase         | 500MB DB, 1GB storage, 50K MAU       | ~5-10MB DB, <10 users     | $0     |
| Google OAuth     | Unlimited                            | <10 users                 | $0     |
| Google Maps APIs | $200/month free credit               | ~$5-10/month actual usage | $0     |
| Claude Desktop   | Your existing subscription           | Already paying            | $0*    |
| MCP Server       | Runs locally on your machine         | N/A                       | $0     |
| **Total**        |                                      |                           | **$0** |

*You're already paying for Claude — MCP is included with your subscription.

### Free Tier Guardrails

These rules apply throughout **all phases** of development:

1. **No paid npm packages** — only use open-source, free libraries
2. **No external AI API calls** — all AI goes through Claude Desktop via MCP (your existing subscription)
3. **Google Maps** — restrict API key, use `$200/month free credit`. For family use (~5-10 users), this covers thousands of requests. If somehow close to limit:
   - Cache Places/Directions results in Supabase to avoid repeat API calls
   - Show static map images as fallback (Static Maps API is also covered by the $200 credit)
4. **Supabase free tier limits** (500MB DB, 1GB file storage, 50K monthly active users, 2 million edge function invocations):
   - Family project = <10 users, nowhere near limits
   - If DB approaches 500MB: archive old audit_log entries (compress to JSON and store locally)
   - Realtime: free tier supports up to 200 concurrent connections — more than enough
5. **Vercel free tier** (100GB bandwidth, 100 hours serverless execution):
   - Family traffic won't approach this
   - Use ISR/static generation where possible to minimize serverless usage
6. **No paid services ever** — if a feature requires a paid service, find a free alternative or skip it. Examples:
   - Email notifications → skip (use web push or just check the app)
   - Image hosting → use Supabase Storage (1GB free)
   - PDF export → generate client-side with `jsPDF` (free, no server cost)
   - Analytics → skip or use Vercel Analytics (free tier: 2,500 events/month)

### Cost Monitoring Checklist (Phase Reviews)
During each phase review, verify:
- [ ] No new paid dependencies introduced
- [ ] Google Maps API usage within free credit (check Google Cloud Console billing)
- [ ] Supabase dashboard shows DB size well under 500MB
- [ ] Vercel dashboard shows bandwidth well under 100GB

---

## 4. Step-by-Step Guides (New Technologies)

These detailed guides cover the three technologies you're using for the first time. Each step is concrete and copy-pasteable.

---

### 4.1 Supabase — Complete Setup Guide

#### Step 1: Create the Supabase Project
1. Go to https://supabase.com and sign up / log in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `TravelHelper`
   - **Database Password**: generate a strong one and **save it somewhere safe** (you'll need it for the MCP server)
   - **Region**: pick the closest to you
4. Click **"Create new project"** — wait ~2 minutes for provisioning

#### Step 2: Get Your API Keys
1. In your Supabase dashboard, go to **Settings → API**
2. You'll see two keys — copy both:
   - **`anon` (public)** key — safe to use in the browser, restricted by RLS policies
   - **`service_role`** key — **NEVER expose in the browser**; used only server-side (MCP server)
3. Also copy the **Project URL** (looks like `https://xxxx.supabase.co`)
4. Add these to your Next.js app's `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # only for server-side
   ```

#### Step 3: Install the Supabase Client Libraries
```bash
# In your Next.js project
npm install @supabase/supabase-js @supabase/ssr
```

#### Step 4: Create the Supabase Client Files

**Browser client** (`src/lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server client** (`src/lib/supabase/server.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

#### Step 5: Set Up the Database Schema
1. In Supabase dashboard → **SQL Editor**
2. Click **"New query"**
3. Paste the full schema from Section 2 of this plan (the `CREATE TABLE` statements)
4. Click **"Run"** — all tables are created

#### Step 6: Set Up Row Level Security (RLS)
RLS is Supabase's way of ensuring users can only access their own data. **Every table must have RLS enabled.**

1. In SQL Editor, run:
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_invites ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trips: members can read
CREATE POLICY "trips_select" ON trips FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = trips.id AND user_id = auth.uid())
);
CREATE POLICY "trips_insert" ON trips FOR INSERT WITH CHECK (created_by = auth.uid());

-- Trip members: can see co-members of your trips
CREATE POLICY "trip_members_select" ON trip_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_members AS tm WHERE tm.trip_id = trip_members.trip_id AND tm.user_id = auth.uid())
);

-- Activities: trip members can CRUD
CREATE POLICY "activities_select" ON activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = activities.trip_id AND user_id = auth.uid())
);
CREATE POLICY "activities_insert" ON activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = activities.trip_id AND user_id = auth.uid())
);
CREATE POLICY "activities_update" ON activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = activities.trip_id AND user_id = auth.uid())
);
CREATE POLICY "activities_delete" ON activities FOR DELETE USING (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = activities.trip_id AND user_id = auth.uid())
);

-- Audit log: trip members can read
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = audit_log.trip_id AND user_id = auth.uid())
);
-- Audit log insert: allow insert for logged-in users (triggers + app code)
CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT WITH CHECK (true);

-- Votes: trip members can CRUD their own votes
CREATE POLICY "votes_select" ON activity_votes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM activities a
    JOIN trip_members tm ON tm.trip_id = a.trip_id
    WHERE a.id = activity_votes.activity_id AND tm.user_id = auth.uid()
  )
);
CREATE POLICY "votes_upsert" ON activity_votes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "votes_update" ON activity_votes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "votes_delete" ON activity_votes FOR DELETE USING (user_id = auth.uid());

-- Invites: anyone can read (to accept), members can create
CREATE POLICY "invites_select" ON trip_invites FOR SELECT USING (true);
CREATE POLICY "invites_insert" ON trip_invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = trip_invites.trip_id AND user_id = auth.uid())
);
```

#### Step 7: Set Up Google OAuth in Supabase
1. Go to **Google Cloud Console** → create a project (or use existing)
2. Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: add `https://xxxx.supabase.co/auth/v1/callback` (replace xxxx with your Supabase project ref)
   - Also add `http://localhost:3000/auth/callback` for local dev
3. Copy the **Client ID** and **Client Secret**
4. In Supabase dashboard → **Authentication → Providers → Google**
   - Toggle **ON**
   - Paste the Client ID and Client Secret
   - Click **Save**

#### Step 8: Auth Callback Route in Next.js
Create `src/app/auth/callback/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
```

#### Step 9: Login Button
```typescript
import { createClient } from '@/lib/supabase/client'

function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }
  return <button onClick={handleLogin}>Sign in with Google</button>
}
```

#### Step 10: Supabase Realtime (for live updates)
```typescript
// In a React hook — subscribe to activity changes
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

function useRealtimeActivities(tripId: string, onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'activities',
          filter: `trip_id=eq.${tripId}`,
        },
        () => onUpdate()  // re-fetch activities when anything changes
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId, onUpdate])
}
```

#### Key Supabase Concepts to Remember
- **`anon` key + RLS** = safe for the browser. RLS policies act as your security layer
- **`service_role` key** = bypasses RLS, only use server-side (MCP server uses this)
- **Realtime** = subscribe to table changes with `.on('postgres_changes', ...)`
- **Auth** = `supabase.auth.signInWithOAuth()` / `supabase.auth.getUser()`
- **Queries** = `supabase.from('table').select('*').eq('column', value)`

---

### 4.2 Google Maps JavaScript API — Complete Setup Guide

#### Step 1: Enable APIs in Google Cloud Console
1. Go to **Google Cloud Console** (https://console.cloud.google.com)
2. Select the project you created for OAuth (or create a new one)
3. Go to **APIs & Services → Library**
4. Search for and **enable** these three APIs:
   - **Maps JavaScript API** — renders the map
   - **Places API (New)** — autocomplete for location search
   - **Directions API** — travel times between activities
5. Go to **APIs & Services → Credentials → Create Credentials → API Key**
6. Copy the API key
7. **Restrict the key** (important for security):
   - Click the key → **Application restrictions** → **HTTP referrers**
   - Add: `http://localhost:3000/*` and your production domain
   - Under **API restrictions** → restrict to the 3 APIs above
8. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

#### Step 2: Install the Google Maps React Library
```bash
npm install @vis.gl/react-google-maps
```

This is Google's official React wrapper — it handles loading the API script and provides React components.

#### Step 3: Set Up the Map Provider
In your layout or a provider component:
```typescript
import { APIProvider } from '@vis.gl/react-google-maps'

export function MapProvider({ children }: { children: React.ReactNode }) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      {children}
    </APIProvider>
  )
}
```

#### Step 4: Render a Basic Map with Activity Pins
```typescript
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'

interface Activity {
  id: string
  title: string
  latitude: number
  longitude: number
}

function TripMap({ activities }: { activities: Activity[] }) {
  // Calculate center from activities, or use a default
  const center = activities.length > 0
    ? {
        lat: activities.reduce((sum, a) => sum + a.latitude, 0) / activities.length,
        lng: activities.reduce((sum, a) => sum + a.longitude, 0) / activities.length,
      }
    : { lat: 41.3874, lng: 2.1686 } // Barcelona default

  return (
    <Map
      defaultZoom={13}
      defaultCenter={center}
      mapId="trip-map"  // required for AdvancedMarker — create in Cloud Console → Maps → Map Management
      style={{ width: '100%', height: '500px' }}
    >
      {activities.map((activity, index) => (
        <AdvancedMarker
          key={activity.id}
          position={{ lat: activity.latitude, lng: activity.longitude }}
          title={activity.title}
        >
          <Pin
            background="#FF6B35"
            glyphColor="#fff"
            glyph={String.fromCharCode(65 + index)}  // A, B, C, D...
          />
        </AdvancedMarker>
      ))}
    </Map>
  )
}
```

**Note:** You need a **Map ID** for AdvancedMarker. Create one in Google Cloud Console → Google Maps Platform → Map Management → Create Map ID (choose "JavaScript" and "Vector").

#### Step 5: Google Places Autocomplete for Location Input
```typescript
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useEffect, useRef, useState } from 'react'

function PlaceAutocomplete({
  onPlaceSelect,
}: {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void
}) {
  const placesLib = useMapsLibrary('places')
  const inputRef = useRef<HTMLInputElement>(null)
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (!placesLib || !inputRef.current) return

    const ac = new placesLib.Autocomplete(inputRef.current, {
      fields: ['place_id', 'geometry', 'name', 'formatted_address'],
    })

    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (place.geometry) {
        onPlaceSelect(place)
      }
    })

    setAutocomplete(ac)
  }, [placesLib])

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search for a place..."
      className="w-full border rounded p-2"
    />
  )
}
```

**What `onPlaceSelect` gives you:**
```typescript
// When the user picks a place, you get:
{
  place_id: "ChIJ5TCOcR...",           // unique Google Place ID
  name: "La Sagrada Familia",           // place name
  formatted_address: "C/ de Mallorca, 401, Barcelona",
  geometry: {
    location: {
      lat: () => 41.4036,               // call .lat() to get number
      lng: () => 2.1744,                // call .lng() to get number
    }
  }
}
// Save place_id, latitude, longitude to your activities table
```

#### Step 6: Travel Segments (Distance/Duration Between Activities)
```typescript
import { useMapsLibrary } from '@vis.gl/react-google-maps'

function useTravelSegments() {
  const routesLib = useMapsLibrary('routes')

  async function getDirections(
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral,
    mode: google.maps.TravelMode  // WALKING, TRANSIT, DRIVING
  ) {
    if (!routesLib) return null

    const service = new routesLib.DirectionsService()
    const result = await service.route({
      origin,
      destination,
      travelMode: mode,
    })

    const leg = result.routes[0]?.legs[0]
    return {
      distance: leg?.distance?.text,   // "1.2 km"
      duration: leg?.duration?.text,   // "15 mins"
    }
  }

  return { getDirections }
}
```

#### Step 7: Click-to-Sync Between Activity List and Map
```typescript
// In your parent component, track selected activity
const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)

// Pass to both components:
// <ActivityList onSelect={setSelectedActivityId} selected={selectedActivityId} />
// <TripMap onPinClick={setSelectedActivityId} selected={selectedActivityId} />

// In TripMap, highlight the selected pin:
<AdvancedMarker
  onClick={() => onPinClick(activity.id)}
  zIndex={activity.id === selected ? 100 : 0}
>
  <Pin
    background={activity.id === selected ? '#FF0000' : '#FF6B35'}
    scale={activity.id === selected ? 1.3 : 1}
    glyph={String.fromCharCode(65 + index)}
  />
</AdvancedMarker>

// In ActivityList, scroll to and highlight the selected activity:
useEffect(() => {
  if (selected) {
    document.getElementById(`activity-${selected}`)?.scrollIntoView({ behavior: 'smooth' })
  }
}, [selected])
```

#### Google Maps Free Tier Limits (More Than Enough for Family Use)
| API | Free Monthly Credit | ~Requests | Family Use Estimate |
|-----|-------------------|-----------|-------------------|
| Maps JavaScript | $200 credit | ~28,500 map loads | ~50-100/month |
| Places Autocomplete | $200 credit | ~11,500 requests | ~200-500/month |
| Directions | $200 credit | ~40,000 requests | ~100-300/month |

You get **$200/month free credit** across all Maps APIs. Family trip planning will use <5% of this.

---

### 4.3 MCP Server — Complete Setup Guide

#### What Is MCP?
MCP (Model Context Protocol) lets Claude Desktop call custom tools you define. You write a small server that exposes functions (like `create_trip`, `add_activity`), and Claude can call them during conversation. It's like giving Claude hands to interact with your database.

#### Step 1: Create the MCP Server Project
```bash
# From your TravelHelper root
mkdir mcp-server
cd mcp-server
npm init -y
npm install @modelcontextprotocol/sdk @supabase/supabase-js zod
npm install -D typescript @types/node tsx
npx tsc --init
```

Update `mcp-server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

Update `mcp-server/package.json` — add:
```json
{
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

#### Step 2: Create the Supabase Client for MCP
`mcp-server/src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

// MCP server uses the service_role key (bypasses RLS)
// because Claude acts on behalf of the user
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

**Why `service_role` key?** The MCP server runs locally on your machine and is trusted. It needs full access to create/edit trips without being blocked by RLS policies (which require a logged-in browser session). This is safe because the MCP server only runs on your computer.

#### Step 3: Create the MCP Server Entry Point
`mcp-server/src/index.ts`:
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { supabase } from './lib/supabase.js'

const server = new McpServer({
  name: 'TravelHelper',
  version: '1.0.0',
})

// ── TOOL: List all trips ──────────────────────────────
server.tool(
  'list_trips',
  'List all trips with their dates and destinations',
  {},  // no parameters needed
  async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('id, name, destination, start_date, end_date')
      .order('start_date', { ascending: false })

    if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2),
      }],
    }
  }
)

// ── TOOL: Create a trip ───────────────────────────────
server.tool(
  'create_trip',
  'Create a new trip with name, destination, and dates',
  {
    name: z.string().describe('Trip name, e.g. "Barcelona Family Vacation"'),
    destination: z.string().describe('Main destination'),
    start_date: z.string().describe('Start date (YYYY-MM-DD)'),
    end_date: z.string().describe('End date (YYYY-MM-DD)'),
  },
  async ({ name, destination, start_date, end_date }) => {
    const { data, error } = await supabase
      .from('trips')
      .insert({ name, destination, start_date, end_date })
      .select()
      .single()

    if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] }

    // Also add the creator as an owner in trip_members
    // (you'll need a user_id — for now, use a fixed one or pass it as config)

    return {
      content: [{
        type: 'text',
        text: `Created trip "${data.name}" (${data.start_date} → ${data.end_date}). ID: ${data.id}`,
      }],
    }
  }
)

// ── TOOL: Add an activity ─────────────────────────────
server.tool(
  'add_activity',
  'Add an activity to a specific day of a trip',
  {
    trip_id: z.string().describe('Trip ID (UUID)'),
    date: z.string().describe('Date for this activity (YYYY-MM-DD)'),
    title: z.string().describe('Activity title, e.g. "Visit La Sagrada Familia"'),
    description: z.string().optional().describe('Optional details'),
    category: z.enum(['food', 'transport', 'activity', 'accommodation', 'free']).optional(),
    block: z.enum(['morning', 'afternoon', 'evening']).optional().describe('Time block'),
    start_time: z.string().optional().describe('Start time (HH:MM) — use instead of block for hourly mode'),
    end_time: z.string().optional().describe('End time (HH:MM)'),
    location: z.string().optional().describe('Location name'),
    cost: z.number().optional().describe('Estimated cost'),
    currency: z.string().optional().default('USD'),
  },
  async (params) => {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        trip_id: params.trip_id,
        date: params.date,
        title: params.title,
        description: params.description,
        category: params.category,
        block: params.block,
        start_time: params.start_time,
        end_time: params.end_time,
        location: params.location,
        cost: params.cost,
        currency: params.currency,
      })
      .select()
      .single()

    if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] }

    // Log to audit trail
    await supabase.from('audit_log').insert({
      trip_id: params.trip_id,
      actor_name: 'Claude',
      action: 'create',
      entity_type: 'activity',
      entity_id: data.id,
      new_values: data,
      description: `Claude added "${params.title}" to ${params.date} ${params.block || ''}`.trim(),
    })

    return {
      content: [{
        type: 'text',
        text: `Added "${data.title}" to ${data.date}. ID: ${data.id}`,
      }],
    }
  }
)

// ── TOOL: Get day activities ──────────────────────────
server.tool(
  'get_day',
  'Get all activities for a specific day of a trip',
  {
    trip_id: z.string().describe('Trip ID'),
    date: z.string().describe('Date (YYYY-MM-DD)'),
  },
  async ({ trip_id, date }) => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', trip_id)
      .eq('date', date)
      .order('sort_order')

    if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] }

    return {
      content: [{
        type: 'text',
        text: data.length > 0
          ? JSON.stringify(data, null, 2)
          : `No activities planned for ${date} yet.`,
      }],
    }
  }
)

// ── TOOL: Get trip history ────────────────────────────
server.tool(
  'get_history',
  'View recent changes to a trip (audit trail)',
  {
    trip_id: z.string().describe('Trip ID'),
    limit: z.number().optional().default(20).describe('Number of entries to return'),
  },
  async ({ trip_id, limit }) => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('trip_id', trip_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] }

    const summary = data.map(entry =>
      `[${new Date(entry.created_at).toLocaleString()}] ${entry.actor_name}: ${entry.description}`
    ).join('\n')

    return {
      content: [{ type: 'text', text: summary || 'No history yet.' }],
    }
  }
)

// ── Start the server ──────────────────────────────────
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('TravelHelper MCP server running')
}

main().catch(console.error)
```

#### Step 4: Build the MCP Server
```bash
cd mcp-server
npx tsc
```

This compiles TypeScript → JavaScript in the `dist/` folder.

#### Step 5: Configure Claude Desktop to Use Your MCP Server
1. Open Claude Desktop
2. Go to **Settings → Developer → Edit Config** (or find the config file):
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
3. Add your MCP server:
```json
{
  "mcpServers": {
    "travel-helper": {
      "command": "node",
      "args": ["C:/ClaudeCode/TravelHelper/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://xxxx.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOi..."
      }
    }
  }
}
```
4. **Restart Claude Desktop** completely (quit and reopen)

#### Step 6: Verify It Works
1. Open Claude Desktop — you should see a 🔨 tools icon indicating MCP tools are loaded
2. Click the tools icon — you should see `list_trips`, `create_trip`, `add_activity`, `get_day`, `get_history`
3. Try: *"List my trips"* — Claude should call `list_trips` and show results
4. Try: *"Create a test trip to Barcelona from March 20 to March 25"* — should create in Supabase

#### Step 7: Test End-to-End
1. In Claude Desktop: *"Add a morning activity to the Barcelona trip — breakfast at Hotel Arts at 8am"*
2. Open your web app → navigate to the trip → the activity should appear in real-time
3. In the web app, add an activity manually → go back to Claude and ask *"What's on the agenda for March 20?"* → it should show both activities

#### MCP Debugging Tips
- **Logs**: MCP servers print to `stderr` — Claude Desktop shows these in developer tools
- **Test standalone**: You can test the server without Claude Desktop:
  ```bash
  echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node dist/index.js
  ```
- **Common errors**:
  - "Server not found" → check the `command` path in config, restart Claude Desktop
  - "SUPABASE_URL undefined" → check `env` in the config JSON
  - "Permission denied" → ensure the `dist/index.js` file exists (run `npx tsc` first)

---

## 5. Implementation Phases

### Phase 1 — Foundation
- [ ] Next.js project setup with Tailwind + shadcn/ui
- [ ] Supabase schema + RLS policies + audit triggers
- [ ] Google OAuth login flow
- [ ] Dashboard: list trips, create trip
- [ ] Basic trip view (week grid, click to see day)

### Phase 1 Review — Quality Attributes
- [ ] **Maintainability**: Verify folder structure, naming conventions, component decomposition, and separation of concerns
- [ ] **Performance**: Baseline Lighthouse audit; ensure no unnecessary re-renders, lazy-load routes
- [ ] **Usability**: Review auth flow UX, dashboard layout clarity, mobile-friendliness of foundation components

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

### Phase 2 Review — Quality Attributes
- [ ] **Maintainability**: Review map/activity component coupling, reusable hooks, state management complexity
- [ ] **Performance**: Map rendering performance, API call batching (Places/Directions), bundle size check
- [ ] **Usability**: Drag & drop intuitiveness, map interaction on mobile, color contrast for categories

### Phase 3 — Audit Trail & Collaboration
- [ ] Database triggers for automatic audit logging
- [ ] Activity feed sidebar (real-time)
- [ ] Change revert functionality
- [ ] Invite link generation + acceptance flow
- [ ] Real-time sync via Supabase Realtime
- [ ] Member management (roles)

### Phase 3 Review — Quality Attributes
- [ ] **Maintainability**: Audit trigger maintainability, real-time subscription cleanup, role/permission model clarity
- [ ] **Performance**: Real-time subscription efficiency, audit log query performance, pagination for activity feed
- [ ] **Usability**: Clarity of change history, invite flow simplicity, conflict resolution UX for concurrent edits

### Phase 4 — MCP Server (Claude Integration)
- [ ] MCP server project setup
- [ ] Trip CRUD tools
- [ ] Activity CRUD tools (with audit trail entries)
- [ ] History/audit tools
- [ ] Claude Desktop configuration + setup docs
- [ ] Test end-to-end: chat with Claude → data appears in web app

### Phase 4 Review — Quality Attributes
- [ ] **Maintainability**: MCP tool handler structure, shared types between web app and MCP server, error handling consistency
- [ ] **Performance**: MCP response times, Supabase query efficiency from MCP context
- [ ] **Usability**: Natural language tool descriptions, clear error messages, setup documentation completeness

### Phase 5 — Polish
- [ ] Mobile responsive design
- [ ] Cost tracker per day/trip
- [ ] Export itinerary (PDF/share link)
- [ ] Dark mode

### Phase 5 Review — Quality Attributes
- [ ] **Maintainability**: Theme system structure, export logic isolation, overall code health (dead code, TODOs, tech debt)
- [ ] **Performance**: Final Lighthouse audit (target 90+), bundle analysis, image/asset optimization
- [ ] **Usability**: End-to-end user testing checklist, accessibility audit (keyboard nav, screen readers, contrast), mobile device testing

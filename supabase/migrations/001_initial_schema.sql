-- Users (managed by Supabase Auth, extended with profile)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Allow users to read any profile, update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

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

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Trip members (who can collaborate)
CREATE TABLE trip_members (
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);

ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see/modify trips they're members of
CREATE POLICY "Users can view trips they belong to"
  ON trips FOR SELECT
  TO authenticated
  USING (id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Members can update trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "Owners can delete trips"
  ON trips FOR DELETE
  TO authenticated
  USING (id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role = 'owner'));

-- Trip members RLS
CREATE POLICY "Members can view other members"
  ON trip_members FOR SELECT
  TO authenticated
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can insert members"
  ON trip_members FOR INSERT
  TO authenticated
  WITH CHECK (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "Owners can manage members"
  ON trip_members FOR DELETE
  TO authenticated
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role = 'owner'));

-- Activities (the core planning data)
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  block text CHECK (block IN ('morning', 'afternoon', 'evening')),
  title text NOT NULL,
  description text,
  category text CHECK (category IN ('food', 'transport', 'activity', 'accommodation', 'free')),
  location text,
  location_url text,
  place_id text,
  latitude decimal,
  longitude decimal,
  cost decimal,
  currency text DEFAULT 'USD',
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view activities"
  ON activities FOR SELECT
  TO authenticated
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));

CREATE POLICY "Editors can insert activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "Editors can update activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

CREATE POLICY "Editors can delete activities"
  ON activities FOR DELETE
  TO authenticated
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Votes on activities
CREATE TABLE activity_votes (
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (activity_id, user_id)
);

ALTER TABLE activity_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view votes"
  ON activity_votes FOR SELECT
  TO authenticated
  USING (activity_id IN (
    SELECT a.id FROM activities a
    JOIN trip_members tm ON tm.trip_id = a.trip_id
    WHERE tm.user_id = auth.uid()
  ));

CREATE POLICY "Members can vote"
  ON activity_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can change their vote"
  ON activity_votes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Members can remove their vote"
  ON activity_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Audit trail
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid,
  actor_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can insert audit log"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Invite links
CREATE TABLE trip_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invites"
  ON trip_invites FOR SELECT
  TO authenticated
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));

CREATE POLICY "Editors can create invites"
  ON trip_invites FOR INSERT
  TO authenticated
  WITH CHECK (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;

-- Index for common queries
CREATE INDEX idx_activities_trip_date ON activities(trip_id, date);
CREATE INDEX idx_trip_members_user ON trip_members(user_id);
CREATE INDEX idx_audit_log_trip ON audit_log(trip_id, created_at DESC);

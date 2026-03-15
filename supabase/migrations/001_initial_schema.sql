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
  start_time time,
  end_time time,
  block text,                -- 'morning' | 'afternoon' | 'evening'
  title text NOT NULL,
  description text,
  category text,             -- 'food' | 'transport' | 'activity' | 'accommodation' | 'free'
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

-- Votes on activities
CREATE TABLE activity_votes (
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (activity_id, user_id)
);

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

-- Invite links
CREATE TABLE trip_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trips
CREATE POLICY "trips_select" ON trips FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = trips.id AND user_id = auth.uid())
);
CREATE POLICY "trips_insert" ON trips FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "trips_update" ON trips FOR UPDATE USING (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = trips.id AND user_id = auth.uid() AND role IN ('owner', 'editor'))
);

-- Trip members
CREATE POLICY "trip_members_select" ON trip_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_members AS tm WHERE tm.trip_id = trip_members.trip_id AND tm.user_id = auth.uid())
);
CREATE POLICY "trip_members_insert" ON trip_members FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM trip_members AS tm WHERE tm.trip_id = trip_members.trip_id AND tm.user_id = auth.uid() AND tm.role = 'owner')
);

-- Activities
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

-- Audit log
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = audit_log.trip_id AND user_id = auth.uid())
);
CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT WITH CHECK (true);

-- Votes
CREATE POLICY "votes_select" ON activity_votes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM activities a
    JOIN trip_members tm ON tm.trip_id = a.trip_id
    WHERE a.id = activity_votes.activity_id AND tm.user_id = auth.uid()
  )
);
CREATE POLICY "votes_insert" ON activity_votes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "votes_update" ON activity_votes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "votes_delete" ON activity_votes FOR DELETE USING (user_id = auth.uid());

-- Invites
CREATE POLICY "invites_select" ON trip_invites FOR SELECT USING (true);
CREATE POLICY "invites_insert" ON trip_invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trip_members WHERE trip_id = trip_invites.trip_id AND user_id = auth.uid())
);

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;

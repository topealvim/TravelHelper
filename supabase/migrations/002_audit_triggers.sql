-- Trigger function to auto-log activity changes
CREATE OR REPLACE FUNCTION log_activity_change()
RETURNS TRIGGER AS $$
DECLARE
  _trip_id uuid;
  _action text;
  _old_values jsonb;
  _new_values jsonb;
  _description text;
  _actor_name text;
  _entity_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _trip_id := NEW.trip_id;
    _action := 'create';
    _old_values := NULL;
    _new_values := to_jsonb(NEW);
    _entity_id := NEW.id;
    _description := 'Added "' || NEW.title || '"';
    IF NEW.block IS NOT NULL THEN
      _description := _description || ' to ' || NEW.block;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    _trip_id := NEW.trip_id;
    _action := 'update';
    _old_values := to_jsonb(OLD);
    _new_values := to_jsonb(NEW);
    _entity_id := NEW.id;
    _description := 'Updated "' || NEW.title || '"';
  ELSIF TG_OP = 'DELETE' THEN
    _trip_id := OLD.trip_id;
    _action := 'delete';
    _old_values := to_jsonb(OLD);
    _new_values := NULL;
    _entity_id := OLD.id;
    _description := 'Removed "' || OLD.title || '"';
  END IF;

  -- Try to get actor name from profile
  SELECT display_name INTO _actor_name
  FROM profiles
  WHERE id = COALESCE(NEW.created_by, OLD.created_by);

  INSERT INTO audit_log (trip_id, user_id, actor_name, action, entity_type, entity_id, old_values, new_values, description)
  VALUES (_trip_id, COALESCE(NEW.created_by, OLD.created_by), COALESCE(_actor_name, 'Unknown'), _action, 'activity', _entity_id, _old_values, _new_values, _description);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER activity_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON activities
  FOR EACH ROW EXECUTE FUNCTION log_activity_change();

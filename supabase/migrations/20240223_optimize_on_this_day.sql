-- Function to get memories for a specific month and day (On This Day)
CREATE OR REPLACE FUNCTION get_on_this_day_memories(target_couple_id UUID, target_month INT, target_day INT)
RETURNS SETOF memories
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM memories
  WHERE couple_id = target_couple_id
    AND EXTRACT(MONTH FROM memory_date) = target_month
    AND EXTRACT(DAY FROM memory_date) = target_day;
END;
$$;

-- Function to get milestones for a specific month and day
CREATE OR REPLACE FUNCTION get_on_this_day_milestones(target_couple_id UUID, target_month INT, target_day INT)
RETURNS SETOF milestones
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM milestones
  WHERE couple_id = target_couple_id
    AND EXTRACT(MONTH FROM milestone_date) = target_month
    AND EXTRACT(DAY FROM milestone_date) = target_day;
END;
$$;

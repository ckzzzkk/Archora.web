-- RPC for incrementing architect-specific generation counters
-- Called by ai-generate after successful generation with an architectId
CREATE OR REPLACE FUNCTION public.increment_architect_counter(
  p_user_id      UUID,
  p_architect_id TEXT
) RETURNS VOID AS $$
DECLARE
  v_col TEXT;
BEGIN
  v_col := 'architect_' || replace(p_architect_id, '-', '_') || '_used';
  EXECUTE format(
    'UPDATE users SET %I = %I + 1, architect_generations_used = architect_generations_used + 1 WHERE id = $1',
    v_col, v_col
  ) USING p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 019_delete_user_data_rpc
-- GDPR-compliant full data deletion RPC called by the delete-account Edge Function.
--
-- Deletion order is FK-safe (children before parents).
-- audit_logs has ON DELETE SET NULL (not CASCADE) so must be deleted explicitly.
-- public.users is NOT deleted here — auth.admin.deleteUser in the Edge Function
-- removes the auth.users row, which cascades to public.users and remaining children.
-- notifications is CASCADE from public.users and handled automatically.

CREATE OR REPLACE FUNCTION public.delete_user_data(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- audit_logs: ON DELETE SET NULL — must be explicitly deleted
  DELETE FROM public.audit_logs    WHERE user_id = p_user_id;

  -- Social child tables (all ON DELETE CASCADE, but delete explicitly for ordering)
  DELETE FROM public.ratings       WHERE user_id = p_user_id;
  DELETE FROM public.likes         WHERE user_id = p_user_id;
  DELETE FROM public.saves         WHERE user_id = p_user_id;
  DELETE FROM public.comments      WHERE user_id = p_user_id;

  -- Other user-owned data
  DELETE FROM public.ar_scans      WHERE user_id = p_user_id;
  DELETE FROM public.ai_generations WHERE user_id = p_user_id;
  DELETE FROM public.subscriptions WHERE user_id = p_user_id;

  -- Templates before projects (templates reference projects via project_id)
  DELETE FROM public.templates     WHERE user_id = p_user_id;

  -- Projects last — project_versions cascade from projects automatically
  DELETE FROM public.projects      WHERE user_id = p_user_id;

  -- public.users is intentionally NOT deleted here.
  -- The delete-account Edge Function calls auth.admin.deleteUser() after this RPC,
  -- which removes the auth.users row → cascades to public.users.
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_data(UUID) TO authenticated;

-- PostgREST no longer sets the per-claim request.jwt.claim.role setting, so the
-- service-role guard in admin_set_user_access rejected the edge function's valid
-- service-role calls ("Service role required."). auth.role() reads both the
-- legacy setting and the request.jwt.claims JSON. Patched in place so it is a
-- no-op where 20261007000100 already uses auth.role().
do $$
declare
  v_definition text := pg_get_functiondef('public.admin_set_user_access(uuid,uuid,boolean,text)'::regprocedure);
  v_old text := 'current_setting(''request.jwt.claim.role'', true) is distinct from ''service_role''';
begin
  if position('auth.role()' in v_definition) = 0 then
    if position(v_old in v_definition) = 0 then
      raise exception 'admin_set_user_access changed; audit its service-role guard.';
    end if;
    execute replace(v_definition, v_old, 'auth.role() is distinct from ''service_role''');
  end if;
end;
$$;

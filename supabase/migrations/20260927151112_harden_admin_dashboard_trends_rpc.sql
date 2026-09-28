-- Admin RLS policies already grant the dashboard reads; do not bypass them.
alter function public.get_admin_dashboard_trends(date, date) security invoker;

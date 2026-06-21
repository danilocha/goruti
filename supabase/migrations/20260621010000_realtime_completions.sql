-- Enable Supabase Realtime for task_completions so members see each other's
-- checks live. RLS still applies to realtime: a client only receives changes
-- for rows it can SELECT (its own groups, via tc_select).
alter publication supabase_realtime add table public.task_completions;

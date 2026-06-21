-- Fix: a racy ensurePersonalGroup fallback could create multiple personal
-- groups for the same user under concurrent requests, breaking the
-- `.maybeSingle()` existence check (PGRST116: multiple rows).
-- 1) Deduplicate: keep the OLDEST personal group per creator (it holds the
--    seeded routine); cascade-delete the newer empty/duplicate ones.
-- 2) Enforce one personal group per user going forward.
delete from public.groups g
using public.groups keep
where g.type = 'personal'
  and keep.type = 'personal'
  and g.created_by = keep.created_by
  and (keep.created_at, keep.id) < (g.created_at, g.id);

create unique index if not exists one_personal_group_per_user
  on public.groups (created_by)
  where type = 'personal';

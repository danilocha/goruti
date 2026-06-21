-- Fix: chicken-and-egg RLS on groups.
-- `groups_select` only allowed members to see a group, but a freshly INSERTed
-- group has no members yet (membership is inserted in a second statement).
-- That made `insert(group).select()` fail with 42501 (PostgREST applies the
-- SELECT policy to the returned row) and also broke the EXISTS subquery in
-- `gm_self_owner_insert`. Allow the creator to always see their own groups.
drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups for select
  using (public.is_group_member(id) or created_by = auth.uid());

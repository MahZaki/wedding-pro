-- =============================================================
-- FIX: INSERT ... RETURNING blocked by SELECT policy
--
-- PostgREST's .insert(...).select() emits INSERT ... RETURNING,
-- which must also satisfy a SELECT policy. During creation the
-- user is not yet a wedding_members row, so member_select fails.
-- Solution: record who created each wedding and let creators
-- select their own workspace.
-- =============================================================

-- Track creator
alter table weddings
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table weddings
  alter column created_by set default auth.uid();

-- Backfill existing weddings from their first owner (if any)
update weddings w
set created_by = first_owner.user_id
from (
  select distinct on (wedding_id) wedding_id, user_id
  from wedding_members
  where role = 'owner'
  order by wedding_id, invited_at asc
) first_owner
where w.created_by is null and w.id = first_owner.wedding_id;

-- Creators can always see their own wedding
create policy "creator_select_own" on weddings
  for select
  using (created_by = auth.uid());

-- Remove temporary diagnostics helper
drop function if exists public.debug_policies();

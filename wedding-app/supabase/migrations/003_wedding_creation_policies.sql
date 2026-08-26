-- =============================================================
-- FIX: wedding creation blocked by RLS chicken-and-egg
--
-- Problem: insert policies required an existing wedding_members row,
-- making it impossible to create the first wedding/membership.
-- Solution: permissive INSERT policies (OR'd with existing ones):
--   * anyone may create their FIRST wedding (no memberships yet)
--   * the creator may add themself as the FIRST 'owner' member
-- Partner/planner joins still go through the admin-client invite flow.
-- =============================================================

-- Allow an authenticated user to create a wedding only while they
-- belong to no workspace yet (one active workspace per user).
create policy "create_own_wedding" on weddings
  for insert to authenticated
  with check (
    not exists (
      select 1 from wedding_members wm
      where wm.user_id = auth.uid()
    )
  );

-- Allow the creator to seed themself as the very first owner.
create policy "seed_first_owner" on wedding_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and not exists (
      select 1 from wedding_members wm2
      where wm2.wedding_id = wedding_members.wedding_id
    )
  );

-- =============================================================
-- FIX: infinite recursion in wedding_members policies
--
-- Policies referencing wedding_members while evaluating
-- wedding_members recurse infinitely. Standard fix: SECURITY
-- DEFINER helper functions that bypass RLS internally, then
-- rebuild every policy on top of them.
-- =============================================================

-- ── Helper functions (bypass RLS, expose only booleans) ─────

create or replace function public.is_wedding_member(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.wedding_members wm
    where wm.wedding_id = p_wedding_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.can_write_wedding(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.wedding_members wm
    where wm.wedding_id = p_wedding_id
      and wm.user_id = auth.uid()
      and wm.role <> 'viewer'
  );
$$;

-- ── Drop all existing policies on app tables (rebuilt below) ─

do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'weddings','wedding_members','budget_categories','budget_items',
    'payment_schedules','vendors','events','timeline_items',
    'tables','guests','rsvps'
  ] loop
    for p in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;
  end loop;
end $$;

-- ── Rebuild: SELECT = any member; writes = non-viewer member ─
-- <W> marks the wedding-id resolution expression per table.

-- weddings
create policy "member_select" on weddings
  for select using (is_wedding_member(weddings.id));
create policy "creator_first_wedding" on weddings
  for insert to authenticated with check (
    not exists (
      select 1 from public.wedding_members wm
      where wm.user_id = auth.uid()
    )
  );
create policy "member_update" on weddings
  for update using (can_write_wedding(weddings.id));
create policy "member_delete" on weddings
  for delete using (can_write_wedding(weddings.id));

-- wedding_members
create policy "member_select" on wedding_members
  for select using (is_wedding_member(wedding_members.wedding_id));
create policy "seed_first_owner" on wedding_members
  for insert to authenticated with check (
    user_id = auth.uid()
    and role = 'owner'
    and not exists (
      select 1 from public.wedding_members wm2
      where wm2.wedding_id = wedding_members.wedding_id
    )
  );
create policy "member_update" on wedding_members
  for update using (can_write_wedding(wedding_members.wedding_id));
create policy "member_delete" on wedding_members
  for delete using (can_write_wedding(wedding_members.wedding_id));

-- budget_categories
create policy "member_select" on budget_categories
  for select using (is_wedding_member(wedding_id));
create policy "member_insert" on budget_categories
  for insert with check (can_write_wedding(wedding_id));
create policy "member_update" on budget_categories
  for update using (can_write_wedding(wedding_id));
create policy "member_delete" on budget_categories
  for delete using (can_write_wedding(wedding_id));

-- budget_items (via category)
create policy "member_select" on budget_items
  for select using (
    is_wedding_member((
      select bc.wedding_id from budget_categories bc
      where bc.id = budget_items.category_id
    ))
  );
create policy "member_insert" on budget_items
  for insert with check (
    can_write_wedding((
      select bc.wedding_id from budget_categories bc
      where bc.id = budget_items.category_id
    ))
  );
create policy "member_update" on budget_items
  for update using (
    can_write_wedding((
      select bc.wedding_id from budget_categories bc
      where bc.id = budget_items.category_id
    ))
  );
create policy "member_delete" on budget_items
  for delete using (
    can_write_wedding((
      select bc.wedding_id from budget_categories bc
      where bc.id = budget_items.category_id
    ))
  );

-- payment_schedules (via item -> category)
create policy "member_select" on payment_schedules
  for select using (
    is_wedding_member((
      select bc.wedding_id
      from budget_items bi
      join budget_categories bc on bc.id = bi.category_id
      where bi.id = payment_schedules.budget_item_id
    ))
  );
create policy "member_insert" on payment_schedules
  for insert with check (
    can_write_wedding((
      select bc.wedding_id
      from budget_items bi
      join budget_categories bc on bc.id = bi.category_id
      where bi.id = payment_schedules.budget_item_id
    ))
  );
create policy "member_update" on payment_schedules
  for update using (
    can_write_wedding((
      select bc.wedding_id
      from budget_items bi
      join budget_categories bc on bc.id = bi.category_id
      where bi.id = payment_schedules.budget_item_id
    ))
  );
create policy "member_delete" on payment_schedules
  for delete using (
    can_write_wedding((
      select bc.wedding_id
      from budget_items bi
      join budget_categories bc on bc.id = bi.category_id
      where bi.id = payment_schedules.budget_item_id
    ))
  );

-- vendors
create policy "member_select" on vendors
  for select using (is_wedding_member(wedding_id));
create policy "member_insert" on vendors
  for insert with check (can_write_wedding(wedding_id));
create policy "member_update" on vendors
  for update using (can_write_wedding(wedding_id));
create policy "member_delete" on vendors
  for delete using (can_write_wedding(wedding_id));

-- events
create policy "member_select" on events
  for select using (is_wedding_member(wedding_id));
create policy "member_insert" on events
  for insert with check (can_write_wedding(wedding_id));
create policy "member_update" on events
  for update using (can_write_wedding(wedding_id));
create policy "member_delete" on events
  for delete using (can_write_wedding(wedding_id));

-- timeline_items (via event)
create policy "member_select" on timeline_items
  for select using (
    is_wedding_member((
      select e.wedding_id from events e
      where e.id = timeline_items.event_id
    ))
  );
create policy "member_insert" on timeline_items
  for insert with check (
    can_write_wedding((
      select e.wedding_id from events e
      where e.id = timeline_items.event_id
    ))
  );
create policy "member_update" on timeline_items
  for update using (
    can_write_wedding((
      select e.wedding_id from events e
      where e.id = timeline_items.event_id
    ))
  );
create policy "member_delete" on timeline_items
  for delete using (
    can_write_wedding((
      select e.wedding_id from events e
      where e.id = timeline_items.event_id
    ))
  );

-- tables (seating chart)
create policy "member_select" on tables
  for select using (is_wedding_member(wedding_id));
create policy "member_insert" on tables
  for insert with check (can_write_wedding(wedding_id));
create policy "member_update" on tables
  for update using (can_write_wedding(wedding_id));
create policy "member_delete" on tables
  for delete using (can_write_wedding(wedding_id));

-- guests
create policy "member_select" on guests
  for select using (is_wedding_member(wedding_id));
create policy "member_insert" on guests
  for insert with check (can_write_wedding(wedding_id));
create policy "member_update" on guests
  for update using (can_write_wedding(wedding_id));
create policy "member_delete" on guests
  for delete using (can_write_wedding(wedding_id));
create policy "public_rsvp_by_token" on guests
  for select using (token = current_setting('app.rsvp_token', true));

-- rsvps (via guest)
create policy "member_select" on rsvps
  for select using (
    is_wedding_member((
      select g.wedding_id from guests g
      where g.id = rsvps.guest_id
    ))
  );
create policy "member_insert" on rsvps
  for insert with check (
    can_write_wedding((
      select g.wedding_id from guests g
      where g.id = rsvps.guest_id
    ))
  );
create policy "member_update" on rsvps
  for update using (
    can_write_wedding((
      select g.wedding_id from guests g
      where g.id = rsvps.guest_id
    ))
  );
create policy "member_delete" on rsvps
  for delete using (
    can_write_wedding((
      select g.wedding_id from guests g
      where g.id = rsvps.guest_id
    ))
  );

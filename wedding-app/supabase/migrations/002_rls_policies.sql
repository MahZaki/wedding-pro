-- =============================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================

-- ── Enable RLS on every table ───────────────────────────────
alter table weddings enable row level security;
alter table wedding_members enable row level security;
alter table budget_categories enable row level security;
alter table budget_items enable row level security;
alter table payment_schedules enable row level security;
alter table vendors enable row level security;
alter table events enable row level security;
alter table timeline_items enable row level security;
alter table tables enable row level security;
alter table guests enable row level security;
alter table rsvps enable row level security;

-- =============================================================
-- MEMBER ACCESS POLICIES (read + write for owner/partner/planner)
-- =============================================================

create policy "wedding_member_access" on weddings
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = weddings.id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on wedding_members
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = wedding_members.wedding_id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on budget_categories
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = budget_categories.wedding_id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on budget_items
  for all using (
    exists (
      select 1 from budget_categories bc
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bc.id = budget_items.category_id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on payment_schedules
  for all using (
    exists (
      select 1 from budget_items bi
      join budget_categories bc on bc.id = bi.category_id
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bi.id = payment_schedules.budget_item_id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on vendors
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = vendors.wedding_id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on events
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = events.wedding_id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on timeline_items
  for all using (
    exists (
      select 1 from events e
      join wedding_members wm on wm.wedding_id = e.wedding_id
      where e.id = timeline_items.event_id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on tables
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = tables.wedding_id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on guests
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = guests.wedding_id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on rsvps
  for all using (
    exists (
      select 1 from guests g
      join wedding_members wm on wm.wedding_id = g.wedding_id
      where g.id = rsvps.guest_id
        and wm.user_id = auth.uid()
    )
  );

-- =============================================================
-- VIEWER WRITE-BLOCK POLICIES
-- Separate policies for INSERT (WITH CHECK) and UPDATE/DELETE (USING)
-- =============================================================

-- weddings
create policy "no_viewer_insert_weddings" on weddings
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = weddings.id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_weddings" on weddings
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = weddings.id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_weddings" on weddings
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = weddings.id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- wedding_members
create policy "no_viewer_insert_wedding_members" on wedding_members
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = wedding_members.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_wedding_members" on wedding_members
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = wedding_members.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_wedding_members" on wedding_members
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = wedding_members.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- budget_categories
create policy "no_viewer_insert_budget_categories" on budget_categories
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = budget_categories.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_budget_categories" on budget_categories
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = budget_categories.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_budget_categories" on budget_categories
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = budget_categories.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- budget_items
create policy "no_viewer_insert_budget_items" on budget_items
  for insert with check (
    exists (
      select 1 from budget_categories bc
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bc.id = budget_items.category_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_budget_items" on budget_items
  for update using (
    exists (
      select 1 from budget_categories bc
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bc.id = budget_items.category_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_budget_items" on budget_items
  for delete using (
    exists (
      select 1 from budget_categories bc
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bc.id = budget_items.category_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- payment_schedules
create policy "no_viewer_insert_payment_schedules" on payment_schedules
  for insert with check (
    exists (
      select 1 from budget_items bi
      join budget_categories bc on bc.id = bi.category_id
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bi.id = payment_schedules.budget_item_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_payment_schedules" on payment_schedules
  for update using (
    exists (
      select 1 from budget_items bi
      join budget_categories bc on bc.id = bi.category_id
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bi.id = payment_schedules.budget_item_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_payment_schedules" on payment_schedules
  for delete using (
    exists (
      select 1 from budget_items bi
      join budget_categories bc on bc.id = bi.category_id
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bi.id = payment_schedules.budget_item_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- vendors
create policy "no_viewer_insert_vendors" on vendors
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = vendors.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_vendors" on vendors
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = vendors.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_vendors" on vendors
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = vendors.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- events
create policy "no_viewer_insert_events" on events
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = events.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_events" on events
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = events.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_events" on events
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = events.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- timeline_items
create policy "no_viewer_insert_timeline_items" on timeline_items
  for insert with check (
    exists (
      select 1 from events e
      join wedding_members wm on wm.wedding_id = e.wedding_id
      where e.id = timeline_items.event_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_timeline_items" on timeline_items
  for update using (
    exists (
      select 1 from events e
      join wedding_members wm on wm.wedding_id = e.wedding_id
      where e.id = timeline_items.event_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_timeline_items" on timeline_items
  for delete using (
    exists (
      select 1 from events e
      join wedding_members wm on wm.wedding_id = e.wedding_id
      where e.id = timeline_items.event_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- tables (seating chart)
create policy "no_viewer_insert_tables" on tables
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = tables.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_tables" on tables
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = tables.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_tables" on tables
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = tables.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- guests
create policy "no_viewer_insert_guests" on guests
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = guests.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_guests" on guests
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = guests.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_guests" on guests
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = guests.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- rsvps
create policy "no_viewer_insert_rsvps" on rsvps
  for insert with check (
    exists (
      select 1 from guests g
      join wedding_members wm on wm.wedding_id = g.wedding_id
      where g.id = rsvps.guest_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_rsvps" on rsvps
  for update using (
    exists (
      select 1 from guests g
      join wedding_members wm on wm.wedding_id = g.wedding_id
      where g.id = rsvps.guest_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_rsvps" on rsvps
  for delete using (
    exists (
      select 1 from guests g
      join wedding_members wm on wm.wedding_id = g.wedding_id
      where g.id = rsvps.guest_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- =============================================================
-- PUBLIC RSVP TOKEN POLICY (guests table only)
-- =============================================================

create policy "public_rsvp_by_token" on guests
  for select using (
    token = current_setting('app.rsvp_token', true)
  );

-- =============================================================
-- INDEXES
-- =============================================================

create index idx_wedding_members_wedding_id on wedding_members(wedding_id);
create index idx_budget_categories_wedding_id on budget_categories(wedding_id);
create index idx_vendors_wedding_id on vendors(wedding_id);
create index idx_events_wedding_id on events(wedding_id);
create index idx_tables_wedding_id on tables(wedding_id);
create index idx_guests_wedding_id on guests(wedding_id);
create index idx_budget_items_category_id on budget_items(category_id);
create index idx_payment_schedules_budget_item_id on payment_schedules(budget_item_id);
create index idx_timeline_items_event_id on timeline_items(event_id);
create index idx_rsvps_guest_id on rsvps(guest_id);
create index idx_rsvps_event_id on rsvps(event_id);
create index idx_guests_token on guests(token);
create index idx_payment_schedules_due_date on payment_schedules(due_date);
create index idx_payment_schedules_status on payment_schedules(status);
create index idx_rsvps_status on rsvps(status);

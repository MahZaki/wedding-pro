-- =============================================================
-- GUEST PROFILE DEPTH: GUEST GROUPS + MEAL/ALLERGY FIELDS
-- Additive columns on guests + new guest_groups table.
-- =============================================================

-- EXTEND GUESTS
alter table guests
  add column if not exists meal_preference  text,
  add column if not exists allergies        text[],
  add column if not exists is_child         boolean default false,
  add column if not exists age_group        text,
  add column if not exists address          text,
  add column if not exists notes            text,
  add column if not exists thank_you_sent   boolean default false,
  add column if not exists thank_you_sent_at date;

-- GUEST GROUPS (families / couples traveling together)
create table guest_groups (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid references weddings(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now()
);

-- Reference groups from guests
alter table guests
  add column if not exists group_id uuid references guest_groups(id) on delete set null;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table guest_groups enable row level security;

-- MEMBER ACCESS (read + write for any wedding member)
create policy "wedding_member_access" on guest_groups
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = guest_groups.wedding_id
        and wm.user_id = auth.uid()
    )
  );

-- VIEWER WRITE-BLOCK POLICIES
create policy "no_viewer_insert_guest_groups" on guest_groups
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = guest_groups.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_guest_groups" on guest_groups
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = guest_groups.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_guest_groups" on guest_groups
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = guest_groups.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- =============================================================
-- INDEXES
-- =============================================================

create index idx_guests_group_id on guests(group_id);
create index idx_guest_groups_wedding_id on guest_groups(wedding_id);

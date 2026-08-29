-- =============================================================
-- GIFTS & THANK-YOU TRACKER
-- Additive table for logging gifts received and tracking
-- thank-you notes. Net-new feature (Epic 4).
-- =============================================================

create table gifts (
  id                uuid primary key default gen_random_uuid(),
  wedding_id        uuid references weddings(id) on delete cascade,
  guest_id          uuid references guests(id) on delete set null,
  giver_name        text,                -- If not a guest (anonymous, corporate, etc.)
  gift_type         text not null check (gift_type in ('cash','check','physical','registry','gift-card')),
  description       text,                -- For physical/registry gifts
  value             numeric(12,2),       -- Estimated or exact value
  received_at       date,
  thank_you_sent    boolean default false,
  thank_you_sent_at date,
  notes             text,
  created_at        timestamptz default now()
);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table gifts enable row level security;

-- MEMBER ACCESS (read + write for any wedding member)
create policy "wedding_member_access" on gifts
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = gifts.wedding_id
        and wm.user_id = auth.uid()
    )
  );

-- VIEWER WRITE-BLOCK POLICIES
create policy "no_viewer_insert_gifts" on gifts
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = gifts.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_gifts" on gifts
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = gifts.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_gifts" on gifts
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = gifts.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- =============================================================
-- INDEXES
-- =============================================================

create index idx_gifts_wedding_id on gifts(wedding_id);
create index idx_gifts_guest_id on gifts(guest_id);

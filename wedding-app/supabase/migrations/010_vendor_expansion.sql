-- =============================================================
-- VENDOR CRM EXPANSION
-- Additive vendor pipeline fields + a per-vendor document library.
-- `notes` already exists on vendors.
-- =============================================================

-- =============================================================
-- VENDOR PIPELINE FIELDS
-- =============================================================

alter table vendors
  add column if not exists status       text default 'researching'
    check (status in ('researching','contacted','quoted','shortlisted','booked','paid','completed')),
  add column if not exists quote_amount numeric(12,2),
  add column if not exists booked_at    date,
  add column if not exists rating       int check (rating between 1 and 5),
  add column if not exists instagram    text;

-- =============================================================
-- VENDOR DOCUMENT LIBRARY (multiple documents per vendor)
-- =============================================================

create table vendor_documents (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid references vendors(id) on delete cascade,
  wedding_id  uuid references weddings(id) on delete cascade,
  name        text not null,
  doc_type    text check (doc_type in ('contract','invoice','insurance','quote','other')) default 'other',
  storage_url text not null,
  uploaded_at timestamptz default now()
);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table vendor_documents enable row level security;

-- MEMBER ACCESS (read + write for any wedding member)
create policy "wedding_member_access" on vendor_documents
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = vendor_documents.wedding_id
        and wm.user_id = auth.uid()
    )
  );

-- VIEWER WRITE-BLOCK POLICIES
create policy "no_viewer_insert_vendor_documents" on vendor_documents
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = vendor_documents.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_vendor_documents" on vendor_documents
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = vendor_documents.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_vendor_documents" on vendor_documents
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = vendor_documents.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- =============================================================
-- INDEXES
-- =============================================================

create index idx_vendor_documents_vendor_id on vendor_documents(vendor_id);
create index idx_vendor_documents_wedding_id on vendor_documents(wedding_id);
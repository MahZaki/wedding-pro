-- =============================================================
-- BUDGET EXPANSION: CONTRIBUTIONS + EXPENSES
-- Additive tables for tracking who contributes money and
-- expense-level spend separate from vendor contracts.
-- =============================================================

-- WHO IS CONTRIBUTING MONEY TOWARD THE WEDDING
create table contributions (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid references weddings(id) on delete cascade,
  contributor  text not null check (contributor in ('Couple','Bride Parents','Groom Parents','Other')),
  label        text,
  amount       numeric(12,2) not null,
  received     boolean default false,
  received_at  date,
  notes        text,
  created_at   timestamptz default now()
);

-- INDIVIDUAL EXPENSES (may or may not tie to a vendor)
create table expenses (
  id             uuid primary key default gen_random_uuid(),
  wedding_id     uuid references weddings(id) on delete cascade,
  budget_item_id uuid references budget_items(id) on delete set null,
  vendor_id      uuid references vendors(id) on delete set null,
  description    text not null,
  amount         numeric(12,2) not null,
  paid_at        date,
  paid_by        text check (paid_by in ('couple','partner1','partner2','family')),
  receipt_url    text,
  created_at     timestamptz default now()
);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table contributions enable row level security;
alter table expenses enable row level security;

-- MEMBER ACCESS (read + write for any wedding member)
create policy "wedding_member_access" on contributions
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = contributions.wedding_id
        and wm.user_id = auth.uid()
    )
  );

create policy "wedding_member_access" on expenses
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = expenses.wedding_id
        and wm.user_id = auth.uid()
    )
  );

-- VIEWER WRITE-BLOCK POLICIES
create policy "no_viewer_insert_contributions" on contributions
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = contributions.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_contributions" on contributions
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = contributions.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_contributions" on contributions
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = contributions.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_insert_expenses" on expenses
  for insert with check (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = expenses.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_update_expenses" on expenses
  for update using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = expenses.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
create policy "no_viewer_delete_expenses" on expenses
  for delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = expenses.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

-- =============================================================
-- INDEXES
-- =============================================================

create index idx_contributions_wedding_id on contributions(wedding_id);
create index idx_expenses_wedding_id on expenses(wedding_id);

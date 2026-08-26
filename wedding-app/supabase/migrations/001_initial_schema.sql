-- WEDDINGS (tenant root)
create table weddings (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  target_budget        numeric(12,2) not null,
  wedding_date         date,
  guest_count_estimate int,
  region_tier          text check (region_tier in ('metro','suburban','rural')) default 'suburban',
  created_at           timestamptz default now()
);

-- WEDDING MEMBERS (access control)
create table wedding_members (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid references weddings(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  role        text check (role in ('owner','partner','planner','viewer')) not null,
  invited_at  timestamptz default now(),
  trial_started_at timestamptz default now(),
  unique (wedding_id, user_id)
);

-- BUDGET CATEGORIES
create table budget_categories (
  id               uuid primary key default gen_random_uuid(),
  wedding_id       uuid references weddings(id) on delete cascade,
  name             text not null,
  allocated_amount numeric(12,2) not null,
  sort_order       int default 0
);

-- VENDORS (created before budget_items due to FK)
create table vendors (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid references weddings(id) on delete cascade,
  category        text not null,
  business_name   text not null,
  contact_name    text,
  email           text,
  phone           text,
  website         text,
  contract_url    text,
  parsed_contract jsonb,
  notes           text
);

-- BUDGET ITEMS
create table budget_items (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid references budget_categories(id) on delete cascade,
  name           text not null,
  estimated_cost numeric(12,2) default 0,
  actual_cost    numeric(12,2),
  is_paid        boolean default false,
  vendor_id      uuid references vendors(id) on delete set null
);

-- PAYMENT SCHEDULES
create table payment_schedules (
  id             uuid primary key default gen_random_uuid(),
  budget_item_id uuid references budget_items(id) on delete cascade,
  amount         numeric(12,2) not null,
  due_date       date not null,
  status         text check (status in ('pending','paid','overdue')) default 'pending',
  notes          text
);

-- EVENTS (ceremony, reception, rehearsal, etc.)
create table events (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade,
  name       text not null,
  date       date,
  start_time time,
  location   text
);

-- TIMELINE ITEMS
create table timeline_items (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid references events(id) on delete cascade,
  start_time     time not null,
  end_time       time,
  title          text not null,
  assigned_roles text[],
  is_anchor      boolean default false,
  sort_order     int default 0
);

-- TABLES (seating chart)
create table tables (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid references weddings(id) on delete cascade,
  table_number int,
  shape        text check (shape in ('round','banquet','square')) default 'round',
  capacity     int not null,
  pos_x        float default 0,
  pos_y        float default 0,
  label        text
);

-- GUESTS
create table guests (
  id                  uuid primary key default gen_random_uuid(),
  wedding_id          uuid references weddings(id) on delete cascade,
  first_name          text not null,
  last_name           text not null,
  email               text,
  phone               text,
  invitation_group_id uuid,
  table_id            uuid references tables(id) on delete set null,
  tags                text[],
  side                text check (side in ('bride','groom','both')),
  token               text unique default replace(gen_random_uuid()::text, '-', '')
);

-- RSVPS
create table rsvps (
  id            uuid primary key default gen_random_uuid(),
  guest_id      uuid references guests(id) on delete cascade,
  event_id      uuid references events(id) on delete cascade,
  status        text check (status in ('attending','declined','pending')) default 'pending',
  dietary       text,
  dietary_tags  text[],
  plus_one_name text,
  submitted_at  timestamptz,
  unique (guest_id, event_id)
);

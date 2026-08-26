# Database Reference

> Complete PostgreSQL schema, RLS policies, indexing recommendations, and common query patterns.

---

## 1. CREATE TABLE Statements

### 1.1 Weddings (Tenant Root)

```sql
create table weddings (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  target_budget        numeric(12,2) not null,
  wedding_date         date,
  guest_count_estimate int,
  region_tier          text check (region_tier in ('metro','suburban','rural')) default 'suburban',
  created_at           timestamptz default now()
);
```

### 1.2 Wedding Members (Access Control)

```sql
create table wedding_members (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid references weddings(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  role        text check (role in ('owner','partner','planner','viewer')) not null,
  invited_at  timestamptz default now(),
  unique (wedding_id, user_id)
);
```

### 1.3 Budget Categories

```sql
create table budget_categories (
  id               uuid primary key default gen_random_uuid(),
  wedding_id       uuid references weddings(id) on delete cascade,
  name             text not null,
  allocated_amount numeric(12,2) not null,
  sort_order       int default 0
);
```

### 1.4 Budget Items

```sql
create table budget_items (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid references budget_categories(id) on delete cascade,
  name           text not null,
  estimated_cost numeric(12,2) default 0,
  actual_cost    numeric(12,2),
  is_paid        boolean default false,
  vendor_id      uuid references vendors(id) on delete set null
);
```

### 1.5 Payment Schedules

```sql
create table payment_schedules (
  id             uuid primary key default gen_random_uuid(),
  budget_item_id uuid references budget_items(id) on delete cascade,
  amount         numeric(12,2) not null,
  due_date       date not null,
  status         text check (status in ('pending','paid','overdue')) default 'pending',
  notes          text
);
```

### 1.6 Vendors

```sql
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
```

### 1.7 Events

```sql
create table events (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade,
  name       text not null,
  date       date,
  start_time time,
  location   text
);
```

### 1.8 Timeline Items

```sql
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
```

### 1.9 Tables (Seating Chart)

```sql
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
```

### 1.10 Guests

```sql
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
  token               text unique default encode(gen_random_bytes(32), 'hex')
);
```

### 1.11 RSVPs

```sql
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
```

---

## 2. RLS Policy SQL

Apply these policies to **every table**. Replace `<table>` with the actual table name and `<table>.wedding_id` with the correct foreign key column.

### 2.1 Enable RLS on Every Table

```sql
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
```

### 2.2 Member Access Policy (Read + Write for owner/partner/planner)

```sql
-- weddings
create policy "wedding_member_access" on weddings
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = weddings.id
        and wm.user_id = auth.uid()
    )
  );

-- wedding_members
create policy "wedding_member_access" on wedding_members
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = wedding_members.wedding_id
        and wm.user_id = auth.uid()
    )
  );

-- budget_categories
create policy "wedding_member_access" on budget_categories
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = budget_categories.wedding_id
        and wm.user_id = auth.uid()
    )
  );

-- budget_items (via category -> wedding)
create policy "wedding_member_access" on budget_items
  for all using (
    exists (
      select 1 from budget_categories bc
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bc.id = budget_items.category_id
        and wm.user_id = auth.uid()
    )
  );

-- payment_schedules (via budget_item -> category -> wedding)
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

-- vendors
create policy "wedding_member_access" on vendors
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = vendors.wedding_id
        and wm.user_id = auth.uid()
    )
  );

-- events
create policy "wedding_member_access" on events
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = events.wedding_id
        and wm.user_id = auth.uid()
    )
  );

-- timeline_items (via event -> wedding)
create policy "wedding_member_access" on timeline_items
  for all using (
    exists (
      select 1 from events e
      join wedding_members wm on wm.wedding_id = e.wedding_id
      where e.id = timeline_items.event_id
        and wm.user_id = auth.uid()
    )
  );

-- tables (seating chart)
create policy "wedding_member_access" on tables
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = tables.wedding_id
        and wm.user_id = auth.uid()
    )
  );

-- guests
create policy "wedding_member_access" on guests
  for all using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = guests.wedding_id
        and wm.user_id = auth.uid()
    )
  );

-- rsvps (via guest -> wedding)
create policy "wedding_member_access" on rsvps
  for all using (
    exists (
      select 1 from guests g
      join wedding_members wm on wm.wedding_id = g.wedding_id
      where g.id = rsvps.guest_id
        and wm.user_id = auth.uid()
    )
  );
```

### 2.3 Viewer Write-Block Policy

```sql
-- Block inserts/updates/deletes for users with 'viewer' role
-- Apply to every table that has a direct wedding_id FK:

create policy "no_viewer_writes" on weddings
  for insert, update, delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = weddings.id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_writes" on wedding_members
  for insert, update, delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = wedding_members.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_writes" on budget_categories
  for insert, update, delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = budget_categories.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_writes" on budget_items
  for insert, update, delete using (
    exists (
      select 1 from budget_categories bc
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bc.id = budget_items.category_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_writes" on payment_schedules
  for insert, update, delete using (
    exists (
      select 1 from budget_items bi
      join budget_categories bc on bc.id = bi.category_id
      join wedding_members wm on wm.wedding_id = bc.wedding_id
      where bi.id = payment_schedules.budget_item_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_writes" on vendors
  for insert, update, delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = vendors.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_writes" on events
  for insert, update, delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = events.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_writes" on timeline_items
  for insert, update, delete using (
    exists (
      select 1 from events e
      join wedding_members wm on wm.wedding_id = e.wedding_id
      where e.id = timeline_items.event_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_writes" on tables
  for insert, update, delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = tables.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_writes" on guests
  for insert, update, delete using (
    exists (
      select 1 from wedding_members wm
      where wm.wedding_id = guests.wedding_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );

create policy "no_viewer_writes" on rsvps
  for insert, update, delete using (
    exists (
      select 1 from guests g
      join wedding_members wm on wm.wedding_id = g.wedding_id
      where g.id = rsvps.guest_id
        and wm.user_id = auth.uid()
        and wm.role != 'viewer'
    )
  );
```

### 2.4 Public RSVP Token Policy (Guests Table Only)

```sql
-- Allows public (unauthenticated) access to guests by token
-- Used by the /rsvp/[token] page

create policy "public_rsvp_by_token" on guests
  for select using (
    token = current_setting('app.rsvp_token', true)
  );
```

**Usage in API route:**

```typescript
// In /app/api/rsvp/[token]/route.ts or the RSVP page server component:
const token = params.token;

// Set the session variable before querying
await supabase.rpc('set_rsvp_token', { p_token: token });

// Or use raw SQL in a server component:
await supabase.from('guests').select('*').single();
// The RLS policy will match against app.rsvp_token
```

Alternatively, use a direct SQL approach:

```typescript
// Set the GUC variable before querying
await supabase.rpc('set_config', {
  setting_name: 'app.rsvp_token',
  setting_value: token,
  is_local: true,
});
```

---

## 3. Indexing Recommendations

```sql
-- wedding_id indexes on every child table (foreign key lookups)
create index idx_wedding_members_wedding_id on wedding_members(wedding_id);
create index idx_budget_categories_wedding_id on budget_categories(wedding_id);
create index idx_vendors_wedding_id on vendors(wedding_id);
create index idx_events_wedding_id on events(wedding_id);
create index idx_tables_wedding_id on tables(wedding_id);
create index idx_guests_wedding_id on guests(wedding_id);

-- category_id on budget_items
create index idx_budget_items_category_id on budget_items(category_id);

-- budget_item_id on payment_schedules
create index idx_payment_schedules_budget_item_id on payment_schedules(budget_item_id);

-- event_id on timeline_items
create index idx_timeline_items_event_id on timeline_items(event_id);

-- guest_id on rsvps
create index idx_rsvps_guest_id on rsvps(guest_id);

-- event_id on rsvps
create index idx_rsvps_event_id on rsvps(event_id);

-- Token on guests (for public RSVP lookup)
create index idx_guests_token on guests(token);

-- Unique constraint: guest_id + event_id on rsvps (one RSVP per guest per event)
-- Already defined in the table via: unique (guest_id, event_id)

-- Due date on payment_schedules (for "upcoming payments" query)
create index idx_payment_schedules_due_date on payment_schedules(due_date);

-- Status on payment_schedules (for overdue filtering)
create index idx_payment_schedules_status on payment_schedules(status);

-- Status on rsvps (for RSVP stats)
create index idx_rsvps_status on rsvps(status);
```

---

## 4. Query Patterns

### 4.1 Fetch Wedding Budget Summary

Returns all categories with their total estimated, total actual, and variance for a given wedding.

```sql
select
  bc.id,
  bc.name,
  bc.allocated_amount,
  coalesce(sum(bi.estimated_cost), 0) as total_estimated,
  coalesce(sum(bi.actual_cost), 0) as total_actual,
  coalesce(sum(bi.actual_cost), 0) - coalesce(sum(bi.estimated_cost), 0) as variance
from budget_categories bc
left join budget_items bi on bi.category_id = bc.id
where bc.wedding_id = $1
group by bc.id, bc.name, bc.allocated_amount
order by bc.sort_order;
```

**TypeScript equivalent:**

```typescript
const { data, error } = await supabase
  .from('budget_categories')
  .select(`
    id,
    name,
    allocated_amount,
    budget_items (
      estimated_cost,
      actual_cost
    )
  `)
  .eq('wedding_id', weddingId)
  .order('sort_order');
```

### 4.2 Fetch Guests by Wedding with RSVP Status

Returns all guests with their RSVP status for the primary event.

```sql
select
  g.id,
  g.first_name,
  g.last_name,
  g.email,
  g.phone,
  g.side,
  g.tags,
  g.table_id,
  r.status as rsvp_status,
  r.dietary,
  r.dietary_tags,
  r.plus_one_name,
  r.submitted_at
from guests g
left join rsvps r on r.guest_id = g.id
  and r.event_id = (
    select e.id from events e
    where e.wedding_id = g.wedding_id
    order by e.date asc nulls last
    limit 1
  )
where g.wedding_id = $1
order by g.last_name, g.first_name;
```

**TypeScript equivalent:**

```typescript
const { data, error } = await supabase
  .from('guests')
  .select(`
    id,
    first_name,
    last_name,
    email,
    phone,
    side,
    tags,
    table_id,
    rsvps (
      status,
      dietary,
      dietary_tags,
      plus_one_name,
      submitted_at,
      event_id
    )
  `)
  .eq('wedding_id', weddingId)
  .order('last_name');
```

### 4.3 Fetch Upcoming Payments in Next 30 Days

Returns all payment schedule items due within the next 30 days, joined to their budget item and category.

```sql
select
  ps.id,
  ps.amount,
  ps.due_date,
  ps.status,
  ps.notes,
  bi.name as item_name,
  bc.name as category_name,
  bc.wedding_id
from payment_schedules ps
join budget_items bi on bi.id = ps.budget_item_id
join budget_categories bc on bc.id = bi.category_id
where bc.wedding_id = $1
  and ps.due_date between current_date and current_date + interval '30 days'
  and ps.status != 'paid'
order by ps.due_date asc;
```

**TypeScript equivalent:**

```typescript
const thirtyDaysFromNow = new Date();
thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

const { data, error } = await supabase
  .from('payment_schedules')
  .select(`
    id,
    amount,
    due_date,
    status,
    notes,
    budget_items (
      name,
      budget_categories (
        name,
        wedding_id
      )
    )
  `)
  .gte('due_date', new Date().toISOString().split('T')[0])
  .lte('due_date', thirtyDaysFromNow.toISOString().split('T')[0])
  .neq('status', 'paid')
  .order('due_date');
```

### 4.4 Fetch Timeline by Event

Returns all timeline items for a specific event, ordered by sort order.

```sql
select
  ti.id,
  ti.start_time,
  ti.end_time,
  ti.title,
  ti.assigned_roles,
  ti.is_anchor,
  ti.sort_order
from timeline_items ti
join events e on e.id = ti.event_id
where e.wedding_id = $1
  and ti.event_id = $2
order by ti.sort_order, ti.start_time;
```

**TypeScript equivalent:**

```typescript
const { data, error } = await supabase
  .from('timeline_items')
  .select(`
    id,
    start_time,
    end_time,
    title,
    assigned_roles,
    is_anchor,
    sort_order,
    event:events!inner (
      id,
      wedding_id
    )
  `)
  .eq('event.wedding_id', weddingId)
  .eq('event_id', eventId)
  .order('sort_order');
```

### 4.5 Fetch Vendors by Wedding

Returns all vendors for a wedding, optionally filtered by category.

```sql
select
  v.id,
  v.category,
  v.business_name,
  v.contact_name,
  v.email,
  v.phone,
  v.website,
  v.contract_url,
  v.parsed_contract,
  v.notes
from vendors v
where v.wedding_id = $1
order by v.category, v.business_name;
```

**TypeScript equivalent:**

```typescript
const { data, error } = await supabase
  .from('vendors')
  .select(`
    id,
    category,
    business_name,
    contact_name,
    email,
    phone,
    website,
    contract_url,
    parsed_contract,
    notes
  `)
  .eq('wedding_id', weddingId)
  .order('category');
```

---

## 5. Schema Relationships Diagram (Text)

```
weddings (1)
  ├── wedding_members (many)      → user_id references auth.users
  ├── budget_categories (many)
  │     └── budget_items (many)
  │           ├── payment_schedules (many)
  │           └── vendors (many)  → optional FK
  ├── vendors (many)
  ├── events (many)
  │     └── timeline_items (many)
  ├── tables (many)               → seating chart
  │     └── guests (many)         → table_id FK
  └── guests (many)
        └── rsvps (many)          → unique(guest_id, event_id)
```

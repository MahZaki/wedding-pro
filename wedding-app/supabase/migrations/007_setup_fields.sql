-- Setup wizard fields.
-- Additive only: extends the existing `weddings` table with the
-- fields captured by the first-run setup wizard (Epic 1).

alter table weddings
  add column if not exists partner1_name      text,
  add column if not exists partner2_name      text,
  add column if not exists ceremony_location  text,
  add column if not exists reception_location text,
  add column if not exists wedding_style      text,
  add column if not exists currency           text default 'USD',
  add column if not exists setup_complete     boolean default false,
  add column if not exists timezone           text default 'America/New_York';

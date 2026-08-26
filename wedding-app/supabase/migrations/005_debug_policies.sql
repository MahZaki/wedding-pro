-- Temporary diagnostics: inspect applied RLS policies via RPC.
create or replace function public.debug_policies()
returns table (
  tablename text,
  policyname text,
  cmd text,
  roles text,
  qual text,
  with_check text
)
language sql
security definer
set search_path = public
as $$
  select tablename::text, policyname::text, cmd::text, roles::text,
         coalesce(qual, '')::text, coalesce(with_check, '')::text
  from pg_policies
  where schemaname = 'public'
    and tablename in (
      'weddings','wedding_members','budget_categories','budget_items',
      'payment_schedules','vendors','events','timeline_items',
      'tables','guests','rsvps'
    )
  order by tablename, policyname;
$$;

# Apply Notes: routine-builder-v2

## DB Migration (T-01)

Migration file: `supabase/migrations/20260620000000_routine_builder.sql`

### Supabase CLI (recommended)

```bash
# 1. Link to your hosted project (only once)
npx supabase link --project-ref <your-project-ref>

# 2. Push the migration
npx supabase db push
```

### Alternative: Dashboard SQL Editor

1. Open the Supabase dashboard → SQL Editor.
2. Paste the full content of `supabase/migrations/20260620000000_routine_builder.sql`.
3. Run.

### Smoke queries (run after apply)

```sql
-- Tables exist
select table_name from information_schema.tables
  where table_schema = 'public'
  and table_name in ('groups','group_members','routines','tasks','task_completions');

-- Enums exist
select typname from pg_type where typname in ('group_type','member_role');

-- Trigger exists
select trigger_name from information_schema.triggers
  where trigger_name = 'on_auth_user_created';

-- Function exists
select routine_name from information_schema.routines
  where routine_schema = 'public' and routine_name = 'handle_new_user';

-- RLS is enabled on all tables
select tablename, rowsecurity from pg_tables
  where schemaname = 'public'
  and tablename in ('groups','group_members','routines','tasks','task_completions');
```

### Rollback

```sql
-- Paste content of supabase/migrations/20260620000000_routine_builder_down.sql
```

---

## Integration Smoke Tests (T-05, T-06, T-07 — no live DB in CI)

These server functions cannot be unit-tested with vitest (require live Supabase).
Manual validation steps:

1. **ensurePersonalGroup**: Sign in as a new user → navigate to app → confirm a `groups` row with `type='personal'` and a matching `group_members` row with `role='owner'` are created.
2. **seedDefaultRoutine**: First load → confirm a `routines` row with `template_id='couple-default'` and all expected `tasks` rows appear. Reload → confirm no duplicates (idempotency guard).
3. **fetchDayData**: Confirm the day's tasks are returned (filtered by `schedule.days`) and completions for today are included.

---

## Supabase CLI availability

`npx supabase --version` → **available** (installed on demand via npx: v2.107.0).

Recommended: install globally once to avoid repeated downloads.
```bash
npm install -g supabase
```

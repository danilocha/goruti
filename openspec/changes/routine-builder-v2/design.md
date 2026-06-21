# Design: Routine Builder v2 — Supabase Data-Driven Core (Fase 1)

> Architecture-level HOW. Persisted to Engram `sdd/routine-builder-v2/design`.
> Decisions are ADR-style: each carries rationale + rejected alternatives.

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│ Supabase (Postgres + RLS + Auth)                             │
│  groups · group_members · routines · tasks · task_completions │
│  handle_new_user() trigger → personal group on signup        │
└──────────────────────────────────────────────────────────────┘
        ▲ server client (RLS)            ▲ browser client (RLS)
        │ READ routine+tasks+completions │ WRITE completion toggles
┌───────┴──────────────┐         ┌───────┴───────────────────────┐
│ page.tsx (Server)    │ props   │ useCompletions() (client hook)│
│  ensurePersonalGroup │────────▶│  optimistic upsert/delete     │
│  seedDefaultRoutine  │         └───────────────────────────────┘
│  fetch routine+tasks │
│      │ renders                                                  │
│  HomeClient (Client) ── ChecklistProvider (tasks from props) ──│
└──────────────────────┘
```

**Pattern**: Hybrid Server Component fetch + thin client mutation hook. Static
routine/task data is read once on the server (RLS-scoped, no client round-trip,
no flash). Only completion toggles — the genuinely interactive surface — live in
a client hook writing through the browser client. This keeps the read path free
of `buildTasks()`/localStorage and avoids shipping a data-fetching waterfall to
the client.

**Boundaries**: DB (DDL + RLS + trigger) is the source of truth. Server actions
(`ensurePersonalGroup`, `seedDefaultRoutine`) own write-side bootstrapping with
RLS-scoped privileges. The client hook owns only per-user completion state.

---

## 2. SQL DDL (the 5 tables)

`supabase/migrations/<timestamp>_routine_builder.sql`

```sql
-- ── enums ────────────────────────────────────────────────────────────
create type group_type as enum ('personal', 'shared');
create type member_role as enum ('owner', 'member');

-- ── groups ───────────────────────────────────────────────────────────
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        group_type not null default 'personal',
  created_by  uuid not null references auth.users(id) on delete cascade,
  invite_code text unique,                       -- null in Fase 1
  created_at  timestamptz not null default now()
);

-- ── group_members ────────────────────────────────────────────────────
create table public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members(user_id);

-- ── routines ─────────────────────────────────────────────────────────
create table public.routines (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  name        text not null,
  description text,
  template_id text,                              -- 'couple-default' for idempotency
  created_at  timestamptz not null default now(),
  unique (group_id, template_id)                 -- seed idempotency guard
);
create index routines_group_idx on public.routines(group_id);

-- ── tasks ────────────────────────────────────────────────────────────
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  name        text not null,
  icon        text,
  block       text,                              -- '🌅 Mañana' etc (free text)
  time_label  text,                              -- old `time`, optional free text
  note        text,
  no_check    boolean not null default false,    -- old `noCheck`
  schedule    jsonb not null,                    -- { type:'weekly', days:DayName[] }
  assigned_to uuid[],                            -- null = all members (Fase 1: always null)
  position    int not null default 0,            -- ordering
  created_at  timestamptz not null default now(),
  constraint schedule_is_weekly
    check (schedule ->> 'type' = 'weekly'
       and jsonb_typeof(schedule -> 'days') = 'array')
);
create index tasks_routine_idx on public.tasks(routine_id);

-- ── task_completions ─────────────────────────────────────────────────
create table public.task_completions (
  id             uuid primary key default gen_random_uuid(),
  routine_id     uuid not null references public.routines(id) on delete cascade,
  task_id        uuid not null references public.tasks(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  completed_date date not null,
  completed_at   timestamptz not null default now(),
  unique (task_id, user_id, completed_date)      -- ← load-bearing: upsert target
);
create index completions_lookup_idx
  on public.task_completions(user_id, completed_date);
```

**ADR-DDL-1 — `schedule` as tagged jsonb, not a join table.**
Rationale: forward-compatible with `{type:'times_per_week', count:n}` without a
schema migration; days are a small bounded set; we never query "which tasks run
on day X" at the DB level (the client filters the already-fetched routine). The
CHECK constraint enforces the `weekly` tag shape so bad writes fail loudly.
Rejected: `task_days` join table — heavier, premature for a 7-value set, and
worse for the forward-compat goal.

**ADR-DDL-2 — completions reference `routine_id` redundantly.**
Rationale: lets RLS and analytics scope by routine/group without a join through
`tasks`. Tradeoff: mild denormalization; acceptable because `task_id` already
FKs and the unique is on `(task_id,user_id,completed_date)`.

**ADR-DDL-3 — `time` renamed to `time_label`.** `time` is a reserved-ish word in
SQL contexts and the value is free text (`"6:30"`, `"7–9am"`), not a real time.

---

## 3. RLS Policies (exact predicates)

The load-bearing predicate is **group membership**:

```sql
group_id in (select group_id from public.group_members where user_id = auth.uid())
```

`tasks` and `task_completions` reach `group_id` via their `routine_id`, so they
use a membership-through-routine predicate. Enable RLS on every table.

```sql
alter table public.groups           enable row level security;
alter table public.group_members    enable row level security;
alter table public.routines         enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_completions enable row level security;

-- helper: routines visible to the current user (membership-scoped)
-- inlined below rather than a SQL function to keep policies self-contained.

-- ── groups ───────────────────────────────────────────────────────────
create policy groups_select on public.groups for select
  using (id in (select group_id from public.group_members where user_id = auth.uid()));
create policy groups_insert on public.groups for insert
  with check (created_by = auth.uid());
create policy groups_update on public.groups for update
  using (id in (select group_id from public.group_members
                where user_id = auth.uid() and role = 'owner'));
create policy groups_delete on public.groups for delete
  using (id in (select group_id from public.group_members
                where user_id = auth.uid() and role = 'owner'));

-- ── group_members ────────────────────────────────────────────────────
-- SELECT: see members of groups you belong to.
create policy gm_select on public.group_members for select
  using (group_id in (select group_id from public.group_members
                      where user_id = auth.uid()));
-- INSERT: only an owner of the group may add members (self-add at create time
-- is handled by the security-definer trigger / server action, which bypass RLS).
create policy gm_insert on public.group_members for insert
  with check (group_id in (select group_id from public.group_members
                           where user_id = auth.uid() and role = 'owner'));
create policy gm_delete on public.group_members for delete
  using (group_id in (select group_id from public.group_members
                      where user_id = auth.uid() and role = 'owner'));

-- ── routines ─────────────────────────────────────────────────────────
create policy routines_select on public.routines for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy routines_cud on public.routines for all
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()))
  with check (group_id in (select group_id from public.group_members where user_id = auth.uid()));

-- ── tasks (membership through routine) ───────────────────────────────
create policy tasks_select on public.tasks for select
  using (routine_id in (
    select r.id from public.routines r
    join public.group_members gm on gm.group_id = r.group_id
    where gm.user_id = auth.uid()));
create policy tasks_cud on public.tasks for all
  using (routine_id in (
    select r.id from public.routines r
    join public.group_members gm on gm.group_id = r.group_id
    where gm.user_id = auth.uid()))
  with check (routine_id in (
    select r.id from public.routines r
    join public.group_members gm on gm.group_id = r.group_id
    where gm.user_id = auth.uid()));

-- ── task_completions (read group-wide, write only your own) ──────────
create policy tc_select on public.task_completions for select
  using (routine_id in (
    select r.id from public.routines r
    join public.group_members gm on gm.group_id = r.group_id
    where gm.user_id = auth.uid()));
-- writes restricted to the acting user AND a routine they belong to:
create policy tc_insert on public.task_completions for insert
  with check (user_id = auth.uid() and routine_id in (
    select r.id from public.routines r
    join public.group_members gm on gm.group_id = r.group_id
    where gm.user_id = auth.uid()));
create policy tc_update on public.task_completions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy tc_delete on public.task_completions for delete
  using (user_id = auth.uid());
```

**ADR-RLS-1 — completion read is group-wide, write is `auth.uid()`-only.**
Rationale: Fase 2 needs every member to *see* each other's checks; restricting
reads now would force a migration later. Writes are hard-bound to the actor so
nobody can forge another member's completion. The composite unique + the
`user_id = auth.uid()` check together make the upsert race-safe.

**ADR-RLS-2 — group_members SELECT references itself.** Postgres permits this;
the subquery is evaluated against the table with RLS bypassed inside the policy
expression for the same row set. The personal-group case (one self row) makes
the recursion trivially terminating. Verified pattern for Supabase membership.

**RLS-leak mitigation (proposal risk)**: before wiring the checklist, the
migration is validated with a second test user — confirm user B cannot select
user A's group, routines, tasks, or completions. This is a Fase-1 acceptance gate.

---

## 4. Personal-group auto-create trigger

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
begin
  insert into public.groups (name, type, created_by)
  values ('Personal', 'personal', new.id)
  returning id into new_group_id;

  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**ADR-TRG-1 — `security definer` + `set search_path`.** The function runs as the
table owner so it can write `groups`/`group_members` despite RLS, and the pinned
`search_path` blocks search-path-hijack escalation (Supabase lint requirement).

**Timing risk + fallback (proposal risk "trigger timing").**
The trigger fires on `auth.users` insert, but a freshly-signed-in client could
reach `page.tsx` before the row is visible (replication/edge timing), or the
trigger may not exist for users created *before* the migration. Mitigation: a
server-side **`ensurePersonalGroup()`** idempotent fallback, called at the top of
`page.tsx` before any fetch:

```ts
// src/lib/routines/ensurePersonalGroup.ts  (server-only)
export async function ensurePersonalGroup(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthenticated");

  // already a member of a personal group?
  const { data: existing } = await supabase
    .from("groups")
    .select("id")
    .eq("type", "personal")
    .eq("created_by", user.id)
    .maybeSingle();
  if (existing) return existing.id;

  // create + self-membership (RLS allows: created_by = auth.uid(),
  // and gm_insert is bypassed because owner self-add happens here under the
  // user's own session — see note below).
  const { data: group, error } = await supabase
    .from("groups")
    .insert({ name: "Personal", type: "personal", created_by: user.id })
    .select("id")
    .single();
  if (error) throw error;

  await supabase.from("group_members")
    .insert({ group_id: group.id, user_id: user.id, role: "owner" });
  return group.id;
}
```

> Note: `gm_insert`'s `with check` requires the user to already be an *owner* of
> the group. For the very first self-membership that predicate is false. To keep
> the fallback working without weakening RLS, add a narrow self-bootstrap policy:
> `create policy gm_self_owner_insert on public.group_members for insert with
> check (user_id = auth.uid() and exists (select 1 from public.groups g where
> g.id = group_id and g.created_by = auth.uid()));`
> This lets a user add *themselves* as a member of a group they created, which is
> exactly the bootstrap case, and never lets them add others.

**ADR-TRG-2 — trigger AND server fallback, not one or the other.** The trigger is
the happy path (zero latency on the read). The fallback covers pre-existing users
and race windows, and is idempotent via the `personal/created_by` lookup. Both
converge on the same shape.

---

## 5. Supabase CLI migration structure

```
supabase/
  config.toml                       -- project ref + local stack config
  migrations/
    <timestamp>_routine_builder.sql -- enums, 5 tables, indexes, RLS, trigger, fn
```

- Establish with `supabase init` (creates `supabase/` + `config.toml`), then
  `supabase migration new routine_builder` to get a timestamped file, into which
  the DDL/RLS/trigger from sections 2–4 are written as ONE migration.
- **Apply path (the user runs):** `supabase link --project-ref <ref>` once, then
  `supabase db push` to apply to the hosted project. Alternative for users who
  prefer the UI: paste the migration SQL into the dashboard SQL editor — but the
  committed migration file remains the source of truth.
- `config.toml` only needs the `project_id`; no local-stack changes are required
  because we target the existing hosted DB. Local `supabase start` is optional
  for testing RLS against a throwaway DB.
- A matching down migration (DROP tables/types/trigger/function) is included to
  satisfy the proposal's rollback plan; tables are additive so the down is safe.

**ADR-MIG-1 — single migration file.** Fase 1 schema is cohesive and lands
atomically. Splitting into per-table migrations adds ordering ceremony with no
benefit at this size. Future changes get their own timestamped files.

---

## 6. Seed strategy

A **server action** `seedDefaultRoutine(groupId)` runs the data-driven seed,
guarded for idempotency.

```ts
// src/lib/routines/seedDefaultRoutine.ts (server-only)
export async function seedDefaultRoutine(groupId: string): Promise<string> {
  const supabase = await createClient();

  // idempotency guard: template already seeded for this group?
  const { data: existing } = await supabase
    .from("routines")
    .select("id")
    .eq("group_id", groupId)
    .eq("template_id", "couple-default")
    .maybeSingle();
  if (existing) return existing.id;

  const { data: routine } = await supabase
    .from("routines")
    .insert({ group_id: groupId, name: "Rutina de Hogar",
              template_id: "couple-default" })
    .select("id").single();

  const rows = buildSeedTaskRows(routine.id); // pure, derived from buildTasks()
  await supabase.from("tasks").insert(rows);
  return routine.id;
}
```

**ADR-SEED-1 — double idempotency.** The `routines (group_id, template_id)`
unique is the DB-level guard; the `maybeSingle` pre-check is the app-level guard
(avoids a failed insert round-trip on the common already-seeded path). Together
they make "seed runs twice" (proposal risk) impossible to duplicate.

**ADR-SEED-2 — pure transform `buildSeedTaskRows()`** lives in
`src/lib/routines/seed-template.ts`, deriving rows from the existing
`buildTasks()` output rather than hardcoding a second copy. This keeps a single
authoritative definition during the transition; `buildTasks()` stays in the repo
*only* as seed input, removed from the read path.

### Mapping `buildTasks()` (7 days) → task rows

The transform iterates all 7 days, collecting each emitted task, then **dedupes**
into ONE row per logical task with a `schedule.days` array:

| Old `Task` field | New `tasks` column | Mapping rule |
|------------------|--------------------|--------------|
| `id` (e.g. `"desa"`) | — (not stored as PK) | dedup key component |
| `task` | `name` | direct |
| `icon` | `icon` | direct |
| `block` | `block` | direct (free text incl. emoji) |
| `time` | `time_label` | direct; part of dedup key (weekday vs weekend differ) |
| `note` | `note` | direct |
| `noCheck` | `no_check` | direct (default false) |
| `who` (`D`/`A`/`Rot`/`DA`) | `assigned_to` | **dropped → null** (all members) for Fase 1 |
| (presence per day) | `schedule` | `{ type:'weekly', days:[...] }` accumulated |
| (emit order) | `position` | first-seen index |

**Dedup key**: `(id, time_label, block, name, note, no_check)`. A task emitted on
multiple days with identical fields collapses to one row; its `schedule.days`
accumulates each day it appeared. Tasks that legitimately differ (e.g. `desa` at
`6:10` weekdays vs `8:00` weekends, or the dynamic `alm` "Hoy cocina" note) keep
**separate rows** because `time_label`/`note` differ — each scheduled on the
subset of days where that variant applies.

**ADR-SEED-3 — `who` → `assigned_to = null` for Fase 1.** There is exactly one
member (the personal group owner), so per-person assignment is meaningless now.
The `D`/`A`/`Rot`/`DA` semantics (including the parity-based `almuerzoPerson`
cook and rotation) are **flattened into the task name/note text** where they
already appear (e.g. note `"Hoy cocina: D"`), and `assigned_to` is left null
(= all members). Rotation/assignment is explicitly deferred to Fase 2 per the
proposal. Tradeoff: the `almuerzo` rotation that depended on day-index parity
becomes baked text per day-variant row instead of computed — acceptable because
Fase 1 has a single user and the seed is the user's editable starting point.

---

## 7. page.tsx server/client split

**Boundary**: `page.tsx` becomes a Server Component (drop `"use client"`); the
entire current interactive body moves to a new client component `HomeClient`.

```
src/app/page.tsx              ← Server Component (NEW role)
  └─ ensurePersonalGroup()        // bootstrap (section 4)
  └─ seedDefaultRoutine(groupId)  // idempotent (section 6)
  └─ fetch routine + tasks via createClient() (server, RLS)
  └─ fetch today's completions for the user
  └─ <HomeClient routine={...} tasks={...} initialCompletions={...} />

src/app/HomeClient.tsx        ← Client Component (NEW; holds today's page.tsx body)
  "use client"
  - tab switching, day slide, Framer Motion, theming  (verbatim from old page.tsx)
  - wraps children in <ChecklistProvider tasks={tasks} routineId={...}>
```

```ts
// page.tsx (sketch)
export default async function Page() {
  const supabase = await createClient();
  const groupId = await ensurePersonalGroup();
  const routineId = await seedDefaultRoutine(groupId);

  const { data: routine } = await supabase
    .from("routines").select("id, name").eq("id", routineId).single();
  const { data: tasks } = await supabase
    .from("tasks").select("*").eq("routine_id", routineId).order("position");

  return <HomeClient routine={routine} tasks={tasks ?? []} />;
}
```

### Providers / ChecklistContext adaptation

`Providers` (`src/app/providers.tsx`) is restructured so the checklist context is
**seeded from server props** instead of `buildTasks()`/`useReducer`/localStorage:

- **`useChecklist` change**: no longer calls `buildTasks`. It accepts
  `tasks: RoutineTask[]` (from props) and a per-day filter derived from each
  task's `schedule.days`. `tasks` for the selected day = `allTasks.filter(t =>
  t.schedule.days.includes(selectedDay))`. The derived `blocks/done/total/
  progress` logic stays, but `dayChecks` now comes from completions (section 7
  hook), not the local reducer.
- **`useLocalStorage` removed** from `Providers`; `STORAGE_KEY` checklist
  persistence retired (micro-habits' separate `goruti-micro-habits` key is out of
  scope and untouched).
- **`CheckState` reducer retired** for the checklist read path. Completion state
  is owned by `useCompletions()` (section 8), which the context exposes as
  `dayChecks` + `toggleTask`.
- `AuthProvider`/`AuthGuard` are unchanged; `ThemeProvider` in `layout.tsx`
  unchanged.

**ADR-PAGE-1 — extract `HomeClient`, don't make `page.tsx` partly-client.** A
Server Component cannot contain `useState`/Framer Motion. Moving the whole
interactive tree into one client child keeps a single clean RSC→client boundary
and lets the server own data + bootstrapping. Rejected: keeping `page.tsx` client
and fetching via the browser client — reintroduces a client waterfall and a data
flash, defeating the proposal's "no hardcoded read path / server fetch" goal.

**ADR-PAGE-2 — context seeded by props, completions by hook.** Static routine
data flows top-down (server → props → context, immutable for the session).
Mutable per-user completion state is isolated in `useCompletions`. This split
matches the read-mostly / write-rarely shape and keeps optimistic UI local.

---

## 8. `useCompletions(taskIds, date)` hook contract

```ts
// src/hooks/useCompletions.ts  (client)
interface UseCompletions {
  /** taskId → completed? for the given date */
  checks: Record<string, boolean>;
  toggle: (taskId: string, routineId: string) => void; // optimistic
  isPending: boolean;
  error: Error | null;
}

export function useCompletions(
  taskIds: string[],
  date: string,                 // 'YYYY-MM-DD' (local), the selected day's date
  initial?: Record<string, boolean>,
): UseCompletions;
```

**Read**: on mount / `date` change, query the browser client —
```ts
supabase.from("task_completions")
  .select("task_id")
  .eq("user_id", uid)
  .eq("completed_date", date)
  .in("task_id", taskIds);
```
seeded by `initial` (passed from the server fetch for today to avoid a flash).

**Write (toggle)** — optimistic, race-safe via the composite unique:
- Flip `checks[taskId]` locally immediately.
- If now-checked → **upsert**:
  ```ts
  supabase.from("task_completions")
    .upsert({ task_id, routine_id, user_id: uid, completed_date: date },
            { onConflict: "task_id,user_id,completed_date", ignoreDuplicates: true });
  ```
- If now-unchecked → **delete** matching `(task_id, user_id, completed_date)`.
- On error: roll back the optimistic flip, surface `error`.

**ADR-HOOK-1 — upsert on the composite unique kills the completion race**
(proposal risk "completion write races"). Rapid double-toggles or two tabs can't
create duplicate rows; the unique makes the second insert a no-op via
`ignoreDuplicates`, and delete is idempotent. No transaction needed.

**ADR-HOOK-2 — `date` granularity.** Completions are keyed by `completed_date`,
not by the routine's `DayName`. The selected `DayName` maps to a concrete date
(the current week's instance of that weekday) so history accumulates per real
date — required for the deferred weekly-progress view. `DayName`→date conversion
uses the existing date helpers (`src/data/dates.ts`).

---

## 9. TypeScript types

Generated Supabase types are the substrate; hand-written domain types wrap them.

```ts
// src/data/types.ts (revised) — DayName kept; Person/CheckState retired from read path
export type DayName = /* unchanged 7-value union */;

export interface TaskSchedule { type: "weekly"; days: DayName[]; }

export interface RoutineTask {          // replaces Task in the read path
  id: string;
  routineId: string;
  name: string;
  icon: string | null;
  block: string | null;
  timeLabel: string | null;
  note: string | null;
  noCheck: boolean;
  schedule: TaskSchedule;
  assignedTo: string[] | null;          // null = all members
  position: number;
}

export interface Routine { id: string; groupId: string; name: string;
  description: string | null; templateId: string | null; }

export interface Group { id: string; name: string; type: "personal" | "shared";
  createdBy: string; inviteCode: string | null; }

export interface GroupMember { groupId: string; userId: string;
  role: "owner" | "member"; }

export interface Completion { id: string; routineId: string; taskId: string;
  userId: string; completedDate: string; completedAt: string; }
```

- `Database` types generated via `supabase gen types typescript` →
  `src/lib/supabase/database.types.ts`; the clients are typed with it.
- Hand-written domain types above are camelCase mappers over the snake_case rows,
  produced by small `mapRow` functions at the server fetch boundary so the rest
  of the app never sees snake_case.
- **Retired**: `Person`, `CheckState`, `ChecklistAction` (and `reducer.ts`) leave
  the checklist read/write path. They may remain physically until `sdd-apply`
  deletes them, but no new code references them.

**ADR-TYPES-1 — generated + hand-written, mapped at the edge.** Generated types
guarantee DB↔TS fidelity; hand-written camelCase domain types give the UI a clean
contract and absorb the jsonb `schedule` into a typed `TaskSchedule`. Mapping at
the fetch boundary localizes the snake/camel seam.

---

## 10. Risk ledger (all proposal risks addressed)

| Risk | Mitigation in this design |
|------|---------------------------|
| RLS leak / cross-group access | Membership predicate on every policy; completions write-bound to `auth.uid()`; second-user acceptance test before checklist wiring (§3) |
| Seed idempotency (runs twice) | `routines(group_id,template_id)` unique + app-level `maybeSingle` pre-check (§6 ADR-SEED-1) |
| Trigger timing (client reads before group exists) | `handle_new_user` trigger happy-path + idempotent server `ensurePersonalGroup()` fallback + `gm_self_owner_insert` bootstrap policy (§4) |
| Completion write race | Composite unique `(task_id,user_id,completed_date)` + upsert `ignoreDuplicates` + idempotent delete (§8 ADR-HOOK-1) |
| `page.tsx` refactor non-trivial | Single RSC→`HomeClient` boundary; interactive tree moved verbatim; context seeded by props (§7) |

## 11. Open assumptions for validation

- `gm_self_owner_insert` policy is required for the server fallback; confirm it
  doesn't widen attack surface beyond self-add (predicate ties `user_id` to
  `auth.uid()` AND group `created_by`).
- `DayName`→date resolution for completions assumes the current ISO week; the
  deferred weekly-progress view will need an explicit week anchor (out of Fase 1
  scope but the `completed_date` column already supports it).
- The dynamic `almuerzo` "Hoy cocina: D/A" parity is frozen into seed text; if
  the user later wants live rotation, that is Fase 2 assignment work.

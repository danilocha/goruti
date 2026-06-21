# Design: AI Agent — Fase A

## Technical Approach

Extract current CRUD logic from `useRoutines` into a 3-layer pyramid: operations (pure Supabase calls with injected client) → server actions (operations + `revalidatePath`) → agent tools (zod schemas). The existing UI transitions from direct Supabase calls to `useActionState` with server actions. The chat endpoint (`POST /api/chat`) uses Vercel AI SDK v6 `streamText` with Gemini 3.5 Flash. Destructive tools use AI SDK tool-invocation without server-side `execute` — the UI catches `input-available` state and renders a confirmation dialog that calls the server action on confirm.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| Operations as separate module vs inline in actions | Separate: testable in isolation, reusable across actions+tools. Inline: fewer files. | **Separate module** `src/lib/operations/routines.ts` — each op is a pure async fn taking `SupabaseClient` + params, returning result or `{ok:false, error}`. |
| useRoutines refactored vs replaced | Refactor: fewer changes to RoutineBuilder/RoutineEditor. Replace: spec-clean but higher diff. | **Refactor** — keep `useRoutines` for reads/mapping, strip mutations. Existing UI gets mutation server actions via props + `useActionState`. |
| Chat history: full round-trip vs hybrid | Full: client sends entire history each turn — simple but wasteful. Hybrid: client sends last message, handler rehydrates from DB — bandwidth-efficient. | **Hybrid** — client POSTs `{id, message}` only. Handler loads `chat_sessions` messages, appends user message, calls streamText, upserts result in `onEnd`. |
| Destructive HITL: execute wrapper vs no-execute | Wrapper: execute catches flag, pauses. No-execute: tool has no `execute` fn, always returns `input-available`. | **No-execute** — `deleteRoutine`/`deleteTask` omit `execute`. UI catches `state: 'input-available'`, shows `<DestructiveToolConfirmation>`, calls server action on confirm via `addToolOutput`. |
| AI SDK version | v5 stable vs v6 latest with `maxSteps`. | **v6** — `maxSteps:5` enables multi-turn tool chains (create routine → add 3 tasks) in one request. |

## Data Flow

```
┌─ UI (legacy) ─────────────────────┐   ┌─ AI Chat ──────────────────────────┐
│ RoutineBuilder                    │   │ Chat page                          │
│  ├─ useRoutines (reads)           │   │  ├─ useChat() → POST /api/chat     │
│  ├─ useActionState(serverAction)  │   │  ├─ ToolResultCard (output)         │
│  └─ router.refresh()              │   │  └─ DestructiveConfirmation        │
└──────────┬────────────────────────┘   └──────────┬─────────────────────────┘
           ▼                                       ▼
    Server actions                     ┌─── POST /api/chat route ───────────┐
    src/lib/actions/                   │ auth guard → rehydrate history      │
    ├─ 'use server'                    │ → streamText(tools + systemPrompt)  │
    ├─ calls operation                 │ → onEnd → upsert chat_sessions      │
    └─ revalidatePath('/')             └──────────┬─────────────────────────┘
           │                                      │
           ▼                                      ▼
    Operations ──────────────────── src/lib/operations/routines.ts
    ├─ injectSupabase(client) ───── each function
    └─ CRUD fns: listRoutines, createRoutine, addTask, etc.
           │
           ▼
    Supabase (RLS enforces group-scoped access)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/operations/routines.ts` | Create | Pure CRUD fns — each takes `SupabaseClient` + params, returns result or `{ok:false, error}` |
| `src/lib/actions/routines.ts` | Create | `'use server'` wrappers — each calls operation + `revalidatePath('/')` |
| `src/lib/agent/tools.ts` | Create | 9 zod tool definitions. Destructive tools omit `execute`. Read tools call operations directly. Mutation tools call server actions. |
| `src/app/api/chat/route.ts` | Create | POST handler: auth guard (401), rehydrate from `chat_sessions`, dynamic group context, `streamText` with `maxSteps:5`, `onEnd` upsert |
| `src/components/Asistente/` | Create | Chat UI: `useChat()` hook, `<Welcome>`, `<SuggestionChips>`, `<ToolResultCard>`, `<DestructiveToolConfirmation>` |
| `src/components/BottomNav.tsx` | Modify | TabId adds `"asistente"`, TABS adds 5th entry with `auto_awesome` icon |
| `src/app/HomeClient.tsx` | Modify | Render `<Asistente>` when `activeTab === "asistente"` |
| `src/hooks/useRoutines.ts` | Modify | Strip mutation methods; keep only fetch + mapping. Callers (RoutineBuilder) migrate to server actions via props. |
| `src/components/routines/RoutineBuilder.tsx` | Modify | Receive server actions as props, use `useActionState` for mutations, `useRoutines` for reads |
| `supabase/migrations/20260621020000_chat_sessions.sql` | Create | `chat_sessions` table, RLS, index |

## Interfaces / Contracts

```typescript
// ── Operations (src/lib/operations/routines.ts) ──
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Routine, RoutineTask, TaskSchedule, Group } from "@/data/types";

export function listRoutines(client: SupabaseClient, groupId: string): Promise<Routine[]>;
export function getRoutineTasks(client: SupabaseClient, routineId: string): Promise<RoutineTask[]>;
export function createRoutine(client: SupabaseClient, input: { groupId: string; name: string; description?: string }): Promise<Routine>;
export function updateRoutine(client: SupabaseClient, id: string, fields: Partial<Pick<Routine, "name" | "description">>): Promise<void>;
export function deleteRoutine(client: SupabaseClient, id: string): Promise<void>;
export function addTask(client: SupabaseClient, routineId: string, input: TaskInput): Promise<RoutineTask>;
export function updateTask(client: SupabaseClient, taskId: string, fields: Partial<TaskInput>): Promise<void>;
export function deleteTask(client: SupabaseClient, taskId: string): Promise<void>;
export function installTemplate(client: SupabaseClient, groupId: string, template: RoutineTemplate): Promise<Routine>;

// ── Tool result envelope ──
type ToolResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

// ── Agent tool schema pattern (src/lib/agent/tools.ts) ──
import { tool } from "ai";
import { z } from "zod";

export const deleteRoutineTool = tool({
  description: "Delete a routine permanently",
  parameters: z.object({ routineId: z.string().uuid() }),
  // NOTE: no `execute` — destructive tools use HITL
});

// ── Chat session storage shape ──
interface ChatSession {
  id: string;
  user_id: string;
  title: string | null;
  messages: CoreMessage[];     // AI SDK message array
  created_at: string;
  updated_at: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Operations | Each CRUD fn with mocked Supabase client | Pure unit tests: inject mock `from().insert().select()` chain, verify correct calls and error handling |
| Server actions | Wrapping behavior | Mock operations, verify `revalidatePath` is called on success, not on error |
| Agent tools | Zod validation + error envelope | Validate tool params with zod parse, test error paths for unknown entities |
| Chat route | Auth guard (401), history rehydration, group context injection | Unit: mock Supabase + AI SDK, test routing logic. No real LLM in CI. |
| UI components | ToolResultCard, DestructiveToolConfirmation, Welcome, chips | Vitest + @testing-library/react: render states (empty, streaming, output, input-available) |
| useRoutines refactor | Fetches still work after stripping mutations | Existing tests (if any) must pass; snapshot fetch output |

## Migration / Rollout

Single PR. Sequencing: (1) migration + operations layer (no visible change), (2) server actions + refactor `useRoutines`/`RoutineBuilder` (existing UI goes through new path — green tests), (3) agent tools + chat route + UI (new capability), (4) BottomNav + HomeClient tab (expose feature). Rollback: revert PR, drop `chat_sessions` via down migration.

## Open Questions

- [ ] Should `installTemplate` be destructive? Template install creates data but is recoverable — treating it as non-destructive feels right.
- [ ] Exact revalidatePath targets: `'/'` covers home, but RoutineBuilder uses client state — verify `router.refresh()` still called from UI.

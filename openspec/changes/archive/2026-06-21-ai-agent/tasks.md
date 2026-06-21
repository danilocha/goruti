# Tasks: AI Agent — Fase A

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1200–1800 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR (size:exception) |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Phase 1: Foundation

- [x] 1.1 Install deps: `ai@^6`, `@ai-sdk/react@^3`, `@ai-sdk/google@^3`, add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.local`
- [x] 1.2 Create `supabase/migrations/20260621020000_chat_sessions.sql` — table, RLS policy `user_id = auth.uid()`, index `(user_id, updated_at desc)`
- [x] 1.3 TDD: Operations layer `src/lib/operations/routines.ts` — RED (test listRoutines, getRoutineTasks, createRoutine, updateRoutine, deleteRoutine, addTask, updateTask, deleteTask, installTemplate with mocked Supabase client) → GREEN (implement 9 pure CRUD fns, `ToolResult` envelope) → REFACTOR

## Phase 2: Server Actions + Refactor

- [x] 2.1 TDD: Server actions `src/lib/actions/routines.ts` — RED (test wrapping behavior: operation called, revalidatePath on success, no revalidate on error) → GREEN (implement 9 `'use server'` wrappers, each calling operation + `revalidatePath('/')`) → REFACTOR
- [x] 2.2 Refactor `src/hooks/useRoutines.ts` — strip 7 mutation methods; keep only `fetchAll` + mapping in `UseRoutinesResult`
- [x] 2.3 Refactor `src/components/routines/RoutineBuilder.tsx` — receive server actions as props, use `useActionState` for mutations, `useRoutines` for reads only

## Phase 3: Agent Core

- [x] 3.1 TDD: Agent tools `src/lib/agent/tools.ts` — RED (test zod validation, error envelope, destructive tools omit execute) → GREEN (9 tool defs: listRoutines, getRoutineTasks, createRoutine, updateRoutine, deleteRoutine, addTask, updateTask, deleteTask, installTemplate; read tools call operations, mutation tools call server actions, destructive omit `execute`) → REFACTOR
- [x] 3.2 TDD: Chat route `src/app/api/chat/route.ts` — RED (test auth guard→401, history rehydration, group context injection, 503 on AI down) → GREEN (POST handler: Supabase auth guard, rehydrate from chat_sessions, dynamic group context, streamText with maxSteps:5, onEnd upsert) → REFACTOR

## Phase 4: UI + Integration

- [x] 4.1 Create `src/components/Asistente/Welcome.tsx` — branding avatar, greeting, 4 suggestion chips
- [x] 4.2 Create `src/components/Asistente/SuggestionChips.tsx` — clickable chips that send `useChat().append()`
- [x] 4.3 Create `src/components/Asistente/ToolResultCard.tsx` — collapsible card with icon, label, success/failure, expandable params/output
- [x] 4.4 Create `src/components/Asistente/DestructiveToolConfirmation.tsx` — confirm/cancel with entity name; confirm calls server action via `addToolOutput`
- [x] 4.5 Create `src/components/Asistente/index.tsx` — orchestrator: `useChat()` with hybrid transport (`{id, message}`), render `message.parts`, wire refresh on mutation
- [x] 4.6 Add `src/components/Asistente/Asistente.module.css` — styles for all sub-components
- [x] 4.7 Modify `src/components/BottomNav.tsx` — TabId adds `"asistente"`, TABS adds 5th entry `{ id: "asistente", label: "Asistente", icon: "auto_awesome" }`
- [x] 4.8 Modify `src/app/HomeClient.tsx` — import `<Asistente>`, render when `activeTab === "asistente"`

## Phase 5: Tests + Verification

- [x] 5.1 UI component tests — render states for Welcome (empty/loaded), ToolResultCard (streaming/output-available), DestructiveToolConfirmation (confirm/cancel) — spec scenarios: UI-1, UI-2, UI-3, UI-4, UI-5
- [x] 5.2 Verify existing tests pass after refactor — `npm test`, confirm RoutineBuilder/RoutineEditor unchanged behavior
- [x] 5.3 Verify `npm run build` succeeds with new `ai` dependencies

## Phase 6: Cleanup

- [x] 6.1 Update `UseRoutinesResult` interface — remove mutation methods from type export if any consumers still reference them
- [x] 6.2 Remove any dead code from the old direct-Supabase mutation pattern in files that no longer use it

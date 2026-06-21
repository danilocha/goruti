# Proposal: AI Agent — Asistente conversacional de rutinas (Fase A)

## Intent

Agente conversacional que opera rutinas/tareas vía lenguaje natural. Reemplaza formularios por 9 CRUD tools (Vercel AI SDK v6 + Gemini 3.5 Flash).

## Scope

### In Scope
- Route handler `/api/chat` (streamText, maxSteps:5, 9 tools)
- 3-layer mutations: operations → server actions → agent tools; refactor existing UI
- Human-in-the-loop for deleteRoutine/deleteTask
- `chat_sessions` table (Supabase RLS) + DefaultChatTransport for cross-device history
- 5th tab "Asistente" + chat UI (welcome, chips, tool cards, destructive confirmation)
- Tests mocking AI SDK

### Out of Scope
Completions (Fase B), universal control (Fase D), multi-session UI, Realtime, rate limiting, E2E with real LLM

## Capabilities

### New Capabilities
- `ai-agent-chat`: POST `/api/chat` w/ Vercel AI SDK v6, Gemini 3.5 Flash, auth guard (401), streaming, system prompt + dynamic group context
- `ai-agent-tools`: 9 zod CRUD tools (listRoutines, getRoutineTasks, createRoutine, updateRoutine, deleteRoutine, addTask, updateTask, deleteTask, installTemplate) with destructive metadata for HITL
- `ai-agent-storage`: `chat_sessions` table (RLS user_id = auth.uid()), upsert per turn, single-session lookup by updated_at
- `ai-agent-ui`: 5th tab + welcome/chips (empty), `message.parts` rendering, `<ToolResultCard>`, `<DestructiveToolConfirmation>`, router.refresh() on mutation

### Modified Capabilities
- `routine-builder`: Refactor from direct Supabase client to operations layer + server actions; existing CRUD preserved
- `app-navigation`: TabId gains `"asistente"`; nav grows 4→5 tabs

## Approach

Single PR. operations layer (pure fns + injected Supabase client) → server actions (operation + revalidatePath) → agent tools (zod schemas calling operations). streamText w/ maxSteps:5. Destructive tools omit execute; UI confirms via onToolCall + server action. History persisted via onEnd callback.

## Affected Areas

| Area | Impact |
|------|--------|
| `src/app/api/chat/route.ts` | New |
| `src/lib/operations/routines.ts` | New |
| `src/lib/actions/routines.ts` | New |
| `src/lib/agent/tools.ts` | New |
| `src/components/Asistente/` | New |
| `src/components/BottomNav.tsx` | Modified |
| `src/hooks/useRoutines.ts` | Modified |
| `supabase/migrations/` | New |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Key leak | Low | Server-side only |
| Prompt injection | Low | System prompt + HITL + RLS + maxSteps:5 |
| Breaking existing UI | Med | Tests pass; operations wrap identically |

## Rollback Plan

Revert single PR: restore BottomNav, revert useRoutines path, drop chat_sessions via down migration, revert `ai`/`@ai-sdk-*` deps.

## Dependencies

- `routine-builder-v2` archived (confirmed)
- `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`
- `ai@^6`, `@ai-sdk/react@^3`, `@ai-sdk/google@^3`, `zod`

## Success Criteria

- [ ] All 40 user stories passing
- [ ] Existing routine UI tests pass unchanged
- [ ] Chat history survives refresh and cross-device reload
- [ ] Destructive actions require confirmation
- [ ] Unauthenticated `/api/chat` returns 401
- [ ] No real LLM invoked in CI

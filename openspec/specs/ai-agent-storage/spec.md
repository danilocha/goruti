# AI Agent Storage Specification

## Purpose

Persistent chat session storage in Supabase with RLS isolation, cross-device sync, and single-session retrieval for the Asistente tab.

## Requirements

### Requirement: chat_sessions Table

The system MUST define a `chat_sessions` table with columns: `id` (uuid PK), `user_id` (uuid FK to auth.users, on delete cascade), `title` (text nullable), `messages` (jsonb, default `[]`), `created_at` (timestamptz), `updated_at` (timestamptz). An index on `(user_id, updated_at desc)` MUST exist.

#### Scenario: Schema supports multiple sessions per user
- GIVEN a user has 2 chat sessions
- WHEN rows are inserted with the same `user_id`
- THEN two rows exist with distinct `id` values

#### Scenario: Index enables fast lookup
- GIVEN a user with 10 chat sessions
- WHEN querying for the most recent session
- THEN the index on `(user_id, updated_at desc)` is used

### Requirement: RLS by User

The system MUST enforce RLS on `chat_sessions` with policy `user_id = auth.uid()` for SELECT, INSERT, UPDATE, and DELETE.

#### Scenario: User reads own sessions
- GIVEN an authenticated user
- WHEN they query `chat_sessions`
- THEN only rows where `user_id` equals their `auth.uid()` are returned

#### Scenario: Cross-user isolation
- GIVEN user A has existing sessions
- WHEN user B queries `chat_sessions`
- THEN zero rows belonging to user A are returned

### Requirement: Session Persistence via Upsert

The system MUST upsert the full message array each turn using `INSERT ... ON CONFLICT (id) DO UPDATE`. A row MUST NOT exist until the first successful turn.

#### Scenario: First turn creates session row
- GIVEN no chat session exists with the given `id`
- WHEN the first turn completes successfully
- THEN a row is inserted with the full message array

#### Scenario: Subsequent turns update row
- GIVEN an existing session row
- WHEN a new turn completes
- THEN the `messages` column is replaced with the updated history
- AND `updated_at` is refreshed

### Requirement: Single-Session Retrieval

The system MUST load the most recent session by `(user_id, updated_at desc)` with LIMIT 1 on Asistente tab mount.

#### Scenario: Most recent session is loaded
- GIVEN a user has 2 sessions, one more recent
- WHEN the Asistente tab mounts
- THEN the session with the latest `updated_at` is loaded as `initialMessages`

# AI Agent Chat Specification

## Purpose

Server-side chat endpoint for the conversational AI agent. Handles authentication, streaming, and dynamic context injection for the Gemini-powered assistant.

## Requirements

### Requirement: Authentication Gate

The system MUST reject unauthenticated requests to POST `/api/chat` with HTTP 401 and MUST NOT process the message stream.

#### Scenario: Unauthenticated request returns 401
- GIVEN no valid session cookie
- WHEN the client sends POST `/api/chat`
- THEN the system responds with HTTP 401 and no stream is initiated

#### Scenario: Authenticated request proceeds
- GIVEN a valid user session
- WHEN the client sends POST `/api/chat`
- THEN the system processes the message and returns a stream

### Requirement: Streaming Response

The system MUST stream the AI response using Vercel AI SDK v6 `streamText` with `maxSteps` set to 5.

#### Scenario: Assistant response is streamed
- GIVEN an authenticated user sends a message
- WHEN the handler processes the request
- THEN the response is a server-sent event stream of text and tool invocations

#### Scenario: Multi-step tool chain completes
- GIVEN the agent needs to create a routine and add 3 tasks
- WHEN the LLM calls tools in sequence
- THEN up to 5 tool steps are allowed within a single request

### Requirement: Dynamic Group Context

The system MUST inject the user's active group and group list into the chat instructions on every POST.

#### Scenario: Group context is present in instructions
- GIVEN an authenticated user with groups ["Pareja", "Personal"] and active group "Pareja"
- WHEN the handler receives a POST request
- THEN the instructions include the group list and active group
- AND the agent announces the group before its first mutation in a session

### Requirement: Infrastructure Error Handling

The system MUST return HTTP 503 when the AI service is unavailable.

#### Scenario: AI service down returns 503
- GIVEN the Gemini API is unreachable or returns an error
- WHEN the handler attempts to call `streamText`
- THEN the response is HTTP 503
- AND the existing chat history is preserved

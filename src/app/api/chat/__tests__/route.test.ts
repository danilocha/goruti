import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// ── Hoisted mocks ───────────────────────────────────────────

const mockStreamText = vi.hoisted(() => vi.fn());

vi.mock("ai", () => ({
  streamText: mockStreamText,
  stepCountIs: vi.fn((n: number) => () => false),
  tool: vi.fn((def: { description: string; parameters: unknown; execute?: unknown }) => def),
  userModelMessageSchema: {
    parse: vi.fn((x: unknown) => x),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/operations/routines", () => ({
  listRoutines: vi.fn(),
}));

vi.mock("@/lib/actions/routines", () => ({
  listRoutinesAction: vi.fn(),
}));

vi.mock("@ai-sdk/google", () => ({
  google: vi.fn(() => ({})),
  default: {},
}));

// Import AFTER mocks
import { POST } from "../route";
import { createClient } from "@/lib/supabase/server";
import * as ops from "@/lib/operations/routines";

// ── Fixtures ────────────────────────────────────────────────

function makeNextRequest(body: Record<string, unknown> = {}): NextRequest {
  return {
    json: vi.fn().mockResolvedValue({ id: "session-1", message: "Hola", ...body }),
  } as unknown as NextRequest;
}

function makeAuthClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
}

// ── Tests ───────────────────────────────────────────────────

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(null) as never);

    const response = await POST(makeNextRequest());
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(mockStreamText).not.toHaveBeenCalled();
  });

  it("returns 400 when message is missing", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient("user-1") as never);

    const response = await POST(makeNextRequest({ message: undefined }));
    expect(response.status).toBe(400);
  });

  it("returns 503 when AI service is unavailable", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient("user-1") as never);

    mockStreamText.mockImplementation(() => {
      throw new Error("AI service unavailable");
    });

    const response = await POST(makeNextRequest());
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns streaming response on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient("user-1") as never);

    const mockResponse = new Response("data: test\n\n", {
      headers: { "Content-Type": "text/event-stream" },
    });
    mockStreamText.mockReturnValue({
      toTextStreamResponse: vi.fn().mockReturnValue(mockResponse),
    });

    const response = await POST(makeNextRequest());
    expect(response.status).toBe(200);
    expect(mockStreamText).toHaveBeenCalledOnce();
  });

  it("injects system prompt with group context", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient("user-1") as never);
    vi.mocked(ops.listRoutines).mockResolvedValue({ ok: true, data: [] });

    const mockResponse = new Response("data: test\n\n", {
      headers: { "Content-Type": "text/event-stream" },
    });
    mockStreamText.mockReturnValue({
      toTextStreamResponse: vi.fn().mockReturnValue(mockResponse),
    });

    await POST(makeNextRequest());

    expect(mockStreamText).toHaveBeenCalled();
    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.system).toBeDefined();
    expect(callArgs.system).toContain("asistente");
  });

  it("injects history from chat_sessions", async () => {
    const client = makeAuthClient("user-1");
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "session-1",
        messages: [
          { role: "user", content: "Hola" },
          { role: "assistant", content: "Hola! En qué puedo ayudarte?" },
        ],
      },
      error: null,
    });
    client.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }));

    vi.mocked(createClient).mockResolvedValue(client as never);

    const mockResponse = new Response("data: test\n\n", {
      headers: { "Content-Type": "text/event-stream" },
    });
    mockStreamText.mockReturnValue({
      toTextStreamResponse: vi.fn().mockReturnValue(mockResponse),
    });

    await POST(makeNextRequest());

    expect(mockStreamText).toHaveBeenCalled();
    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.messages).toHaveLength(3); // 2 existing + 1 new
  });

  it("saves session on finish", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const client = makeAuthClient("user-1");
    client.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: mockUpsert,
    }));

    vi.mocked(createClient).mockResolvedValue(client as never);

    const onFinishCallback: { current: ((args: { response: { messages: unknown[] } }) => Promise<void>) | undefined } = { current: undefined };

    mockStreamText.mockImplementation((opts: { onFinish: (args: { response: { messages: unknown[] } }) => Promise<void> }) => {
      onFinishCallback.current = opts.onFinish;
      return {
        toTextStreamResponse: vi.fn().mockReturnValue(new Response()),
      };
    });

    await POST(makeNextRequest());

    expect(onFinishCallback.current).not.toBeUndefined();
    await onFinishCallback.current!({ response: { messages: [{ role: "assistant", content: "Respuesta" }] } });

    expect(mockUpsert).toHaveBeenCalled();
  });
});

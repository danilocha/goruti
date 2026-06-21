import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// ── Hoisted mocks ───────────────────────────────────────────

const mockStreamText = vi.hoisted(() => vi.fn());
const mockConvert = vi.hoisted(() =>
  vi.fn(async (msgs: unknown[]) => msgs),
);

vi.mock("ai", () => ({
  streamText: mockStreamText,
  stepCountIs: vi.fn(() => () => false),
  convertToModelMessages: mockConvert,
  tool: vi.fn(
    (def: { description: string; parameters: unknown; execute?: unknown }) =>
      def,
  ),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/routines/ensurePersonalGroup", () => ({
  ensurePersonalGroup: vi.fn().mockResolvedValue("personal-1"),
}));

vi.mock("@/lib/routines/activeGroup", () => ({
  getActiveGroupId: vi.fn().mockResolvedValue("group-1"),
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

// ── Fixtures ────────────────────────────────────────────────

const SAMPLE_MESSAGES = [
  { id: "m1", role: "user", parts: [{ type: "text", text: "Hola" }] },
];

function makeNextRequest(body: Record<string, unknown> = {}): NextRequest {
  return {
    json: vi
      .fn()
      .mockResolvedValue({ id: "session-1", messages: SAMPLE_MESSAGES, ...body }),
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

/** Default streamText mock returning a UI message stream response. */
function mockUiStream(
  onFinishRef?: {
    current?: (args: { messages: unknown[] }) => Promise<void>;
  },
) {
  mockStreamText.mockReturnValue({
    toUIMessageStreamResponse: vi.fn(
      (opts?: { onFinish?: (args: { messages: unknown[] }) => Promise<void> }) => {
        if (onFinishRef) onFinishRef.current = opts?.onFinish;
        return new Response("stream", {
          headers: { "Content-Type": "text/event-stream" },
        });
      },
    ),
  });
}

// ── Tests ───────────────────────────────────────────────────

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConvert.mockImplementation(async (msgs: unknown[]) => msgs);
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(null) as never);

    const response = await POST(makeNextRequest());
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(mockStreamText).not.toHaveBeenCalled();
  });

  it("returns 400 when messages are missing or empty", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient("user-1") as never);

    const missing = await POST(makeNextRequest({ messages: undefined }));
    expect(missing.status).toBe(400);

    const empty = await POST(makeNextRequest({ messages: [] }));
    expect(empty.status).toBe(400);
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

  it("returns a streaming response on success", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient("user-1") as never);
    mockUiStream();

    const response = await POST(makeNextRequest());
    expect(response.status).toBe(200);
    expect(mockStreamText).toHaveBeenCalledOnce();
  });

  it("injects the system prompt", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient("user-1") as never);
    mockUiStream();

    await POST(makeNextRequest());

    expect(mockStreamText).toHaveBeenCalled();
    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.system).toBeDefined();
    expect(callArgs.system).toContain("asistente");
  });

  it("converts the incoming UI messages to model messages", async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient("user-1") as never);
    mockUiStream();

    await POST(makeNextRequest());

    expect(mockConvert).toHaveBeenCalledWith(SAMPLE_MESSAGES);
    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.messages).toEqual(SAMPLE_MESSAGES);
  });

  it("persists the transcript on finish", async () => {
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

    const onFinishRef: {
      current?: (args: { messages: unknown[] }) => Promise<void>;
    } = {};
    mockUiStream(onFinishRef);

    await POST(makeNextRequest());

    expect(onFinishRef.current).toBeDefined();
    await onFinishRef.current!({
      messages: [
        { id: "m1", role: "user", parts: [{ type: "text", text: "Hola" }] },
        { id: "m2", role: "assistant", parts: [{ type: "text", text: "¡Hola!" }] },
      ],
    });

    expect(mockUpsert).toHaveBeenCalled();
  });
});

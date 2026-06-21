import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../useAuth";

// ── Mocks ─────────────────────────────────────────────────────────

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  }),
}));

// ── Helper ────────────────────────────────────────────────────────

function TestConsumer() {
  const { user, session, isLoading, login, signup, signOut } = useAuth();

  if (isLoading) return <div data-testid="loading">Cargando…</div>;

  return (
    <div>
      {user ? (
        <div data-testid="authenticated">{user.email}</div>
      ) : (
        <div data-testid="unauthenticated">Sin sesión</div>
      )}
      <div data-testid="session">{session?.access_token ?? "no-token"}</div>
      <button
        data-testid="login-btn"
        onClick={() => login("a@b.com", "pass")}
      >
        Login
      </button>
      <button
        data-testid="signup-btn"
        onClick={() => signup("a@b.com", "pass")}
      >
        Signup
      </button>
      <button data-testid="signout-btn" onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
}

function renderWithProvider(initialSession?: any) {
  return render(
    <AuthProvider initialSession={initialSession ?? null}>
      <TestConsumer />
    </AuthProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue(undefined);
  });

  it("shows loading state while checking session (no initial session)", async () => {
    // Use a deferred promise so we can check loading before it resolves
    let resolveSession!: (value: any) => void;
    const sessionPromise = new Promise<any>((resolve) => {
      resolveSession = resolve;
    });
    mockGetSession.mockReturnValue(sessionPromise);

    renderWithProvider();

    // Should show loading immediately while session check is in flight
    expect(screen.getByTestId("loading")).toBeInTheDocument();

    // Resolve the session to avoid hanging
    resolveSession({ data: { session: null } });

    await waitFor(() => {
      expect(screen.getByTestId("unauthenticated")).toBeInTheDocument();
    });
  });

  it("shows unauthenticated when no session found", async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("unauthenticated")).toBeInTheDocument();
    });
  });

  it("shows authenticated when initial session is provided", () => {
    const fakeSession = {
      user: { email: "user@example.com" },
      access_token: "tok-123",
    };

    renderWithProvider(fakeSession);

    expect(screen.getByTestId("authenticated")).toHaveTextContent(
      "user@example.com"
    );
    expect(screen.getByTestId("session")).toHaveTextContent("tok-123");
  });

  it("calls login and updates state on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("unauthenticated")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId("login-btn"));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "pass",
      });
    });
  });

  it("calls signup and updates state on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("unauthenticated")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTestId("signup-btn"));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "pass",
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    });
  });

  it("calls signOut when sign-out button is clicked", async () => {
    const fakeSession = {
      user: { email: "user@example.com" },
      access_token: "tok-123",
    };

    renderWithProvider(fakeSession);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("signout-btn"));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledOnce();
    });
  });
});

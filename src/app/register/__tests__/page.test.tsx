import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RegisterPage from "../page";

// ── Mocks ─────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockSignup = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ signup: mockSignup }),
}));

// ── Tests ─────────────────────────────────────────────────────────

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the registration form", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: /crear cuenta/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /crear cuenta/i })
    ).toBeInTheDocument();
  });

  it("redirects to / on successful registration", async () => {
    mockSignup.mockResolvedValue({ error: null });

    render(<RegisterPage />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/correo electrónico/i), "new@b.com");
    await user.type(screen.getByLabelText(/contraseña/i), "new-password");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith("new@b.com", "new-password");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalledWith();
    });
  });

  it("shows the (already-localized) error returned by useAuth", async () => {
    // useAuth localizes Supabase errors via translateAuthError; the page
    // just displays whatever string it receives.
    mockSignup.mockResolvedValue({
      error:
        "Este correo electrónico ya está registrado. Prueba con otro o inicia sesión.",
    });

    render(<RegisterPage />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/correo electrónico/i), "existing@b.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/ya está registrado/i)).toBeInTheDocument();
    });

    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than 6 characters before calling signup", async () => {
    render(<RegisterPage />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/correo electrónico/i), "a@b.com");
    await user.type(screen.getByLabelText(/contraseña/i), "weak");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("shows a link to the login page", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("link", { name: /iniciar sesión/i })
    ).toHaveAttribute("href", "/login");
  });
});

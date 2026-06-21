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

  it("shows friendly error on duplicate email", async () => {
    mockSignup.mockResolvedValue({
      error: "User already registered",
    });

    render(<RegisterPage />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/correo electrónico/i), "existing@b.com");
    await user.type(screen.getByLabelText(/contraseña/i), "password123");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /ya está registrado/i
        )
      ).toBeInTheDocument();
    });

    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows raw error on non-duplicate error", async () => {
    mockSignup.mockResolvedValue({
      error: "Password too weak",
    });

    render(<RegisterPage />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/correo electrónico/i), "a@b.com");
    await user.type(screen.getByLabelText(/contraseña/i), "weak");
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText("Password too weak")).toBeInTheDocument();
    });
  });

  it("shows a link to the login page", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("link", { name: /iniciar sesión/i })
    ).toHaveAttribute("href", "/login");
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "../page";

// ── Mocks ─────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockLogin = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// ── Tests ─────────────────────────────────────────────────────────

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /iniciar sesión/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i })
    ).toBeInTheDocument();
  });

  it("redirects to / on successful login", async () => {
    mockLogin.mockResolvedValue({ error: null });

    render(<LoginPage />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/correo electrónico/i), "a@b.com");
    await user.type(screen.getByLabelText(/contraseña/i), "correct-password");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("a@b.com", "correct-password");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalledWith();
    });
  });

  it("shows inline error on invalid credentials", async () => {
    mockLogin.mockResolvedValue({ error: "Invalid login credentials" });

    render(<LoginPage />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/correo electrónico/i), "a@b.com");
    await user.type(screen.getByLabelText(/contraseña/i), "wrong");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
    });

    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows a link to the register page", () => {
    render(<LoginPage />);

    expect(screen.getByRole("link", { name: /registrarse/i })).toHaveAttribute(
      "href",
      "/register"
    );
  });
});

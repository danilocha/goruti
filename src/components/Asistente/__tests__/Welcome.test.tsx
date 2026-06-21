import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Welcome from "../Welcome";

describe("Welcome", () => {
  it("renders the avatar and greeting", () => {
    render(<Welcome onSuggestionClick={vi.fn()} />);
    expect(screen.getByText("¡Hola! Soy Goruti")).toBeInTheDocument();
    expect(screen.getByText(/Tu asistente de rutinas/)).toBeInTheDocument();
  });

  it("renders 4 suggestion chips", () => {
    render(<Welcome onSuggestionClick={vi.fn()} />);
    const chips = screen.getAllByRole("button");
    expect(chips).toHaveLength(4);
  });

  it("calls onSuggestionClick when a chip is tapped", async () => {
    const onClick = vi.fn();
    render(<Welcome onSuggestionClick={onClick} />);
    const chip = screen.getByText("Muéstrame mis rutinas");
    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalledWith("Muéstrame mis rutinas");
  });

  it("renders all 4 suggestion texts", () => {
    render(<Welcome onSuggestionClick={vi.fn()} />);
    expect(screen.getByText("Muéstrame mis rutinas")).toBeInTheDocument();
    expect(screen.getByText("Crea una rutina nueva")).toBeInTheDocument();
    expect(screen.getByText("Agrega una tarea a mi rutina")).toBeInTheDocument();
    expect(screen.getByText("¿Qué puedo hacer hoy?")).toBeInTheDocument();
  });
});

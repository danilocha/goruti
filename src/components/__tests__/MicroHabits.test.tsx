import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MicroHabits from "../MicroHabits";

describe("MicroHabits", () => {
  it("renders the section title", () => {
    render(<MicroHabits />);

    expect(screen.getByText("✨ Micro-hábitos instantáneos")).toBeInTheDocument();
  });

  it("renders all 6 habits", () => {
    render(<MicroHabits />);

    const habits = [
      "Secar el baño al usarlo",
      "Loza al lavaplatos ya",
      "Ropa sucia → cesta",
      "Guardar ingredientes al cocinar",
      "Limpiar mesa al terminar",
      "Recoger basura al verla",
    ];

    for (const habit of habits) {
      expect(screen.getByText(habit)).toBeInTheDocument();
    }
  });

  it("renders all 6 habit icons", () => {
    render(<MicroHabits />);

    const icons = ["🚿", "🍽️", "👕", "🍳", "🪑", "🗑️"];

    for (const icon of icons) {
      expect(screen.getByText(icon)).toBeInTheDocument();
    }
  });
});

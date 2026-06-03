import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DayTabs from "../DayTabs";

describe("DayTabs", () => {
  const defaultProps = {
    selectedDay: "Lunes",
    todayName: "Lunes",
    dayProgressMap: {
      Lunes: 50,
      Martes: 0,
      Miércoles: 75,
      Jueves: 0,
      Viernes: 100,
      Sábado: 20,
      Domingo: 0,
    },
    onSelect: vi.fn(),
  };

  it("renders all 7 day tabs", () => {
    render(<DayTabs {...defaultProps} />);

    // Each tab shows 3-letter abbreviation
    const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    for (const label of labels) {
      expect(screen.getByText(label, { exact: false })).toBeInTheDocument();
    }
  });

  it("marks the selected tab as aria-selected", () => {
    render(<DayTabs {...defaultProps} selectedDay="Martes" />);

    const martesTab = screen.getByRole("tab", { name: /mar/i });
    expect(martesTab).toHaveAttribute("aria-selected", "true");

    const lunesTab = screen.getByRole("tab", { name: /lun/i });
    expect(lunesTab).toHaveAttribute("aria-selected", "false");
  });

  it("calls onSelect when a tab is clicked", () => {
    const onSelect = vi.fn();
    render(<DayTabs {...defaultProps} onSelect={onSelect} />);

    const miercolesTab = screen.getByRole("tab", { name: /mié/i });
    fireEvent.click(miercolesTab);

    expect(onSelect).toHaveBeenCalledWith("Miércoles");
  });

  it("shows today indicator only for the current day", () => {
    render(<DayTabs {...defaultProps} todayName="Miércoles" />);

    expect(screen.getByText("Mié🟢")).toBeInTheDocument();
    expect(screen.getByText("Lun")).toBeInTheDocument();
  });

  it("renders progress bar only when progress > 0", () => {
    render(<DayTabs {...defaultProps} />);

    // Should have progress bars for days with > 0 progress
    const progressBars = document.querySelectorAll('[class*="progressBar"]');
    // Days with progress > 0: Lunes(50), Miércoles(75), Viernes(100), Sábado(20) = 4
    expect(progressBars.length).toBe(4);
  });

  it("has role tablist for accessibility", () => {
    render(<DayTabs {...defaultProps} />);

    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});

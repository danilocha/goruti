import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DayTabs from "../DayTabs";

// Mock buildDayRange so tests are deterministic regardless of real date.
// Returns a fixed 7-day window with Miércoles as today.
vi.mock("@/data/dates", () => ({
  buildDayRange: () => [
    { dayName: "Domingo",   abbreviation: "DOM", date: 15, isToday: false, fullDate: new Date() },
    { dayName: "Lunes",     abbreviation: "LUN", date: 16, isToday: false, fullDate: new Date() },
    { dayName: "Martes",    abbreviation: "MAR", date: 17, isToday: false, fullDate: new Date() },
    { dayName: "Miércoles", abbreviation: "MIÉ", date: 18, isToday: true,  fullDate: new Date() },
    { dayName: "Jueves",    abbreviation: "JUE", date: 19, isToday: false, fullDate: new Date() },
    { dayName: "Viernes",   abbreviation: "VIE", date: 20, isToday: false, fullDate: new Date() },
    { dayName: "Sábado",    abbreviation: "SÁB", date: 21, isToday: false, fullDate: new Date() },
  ],
}));

describe("DayTabs", () => {
  const defaultProps = {
    selectedDay: "Lunes",
    onSelect: vi.fn(),
  };

  it("renders all 7 day tabs", () => {
    render(<DayTabs {...defaultProps} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(7);
  });

  it("renders each day abbreviation", () => {
    render(<DayTabs {...defaultProps} />);

    for (const abbr of ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]) {
      expect(screen.getByText(abbr)).toBeInTheDocument();
    }
  });

  it("marks the selected tab as aria-selected true", () => {
    render(<DayTabs {...defaultProps} selectedDay="Martes" />);

    const martesTab = screen.getByRole("tab", { name: /mar/i });
    expect(martesTab).toHaveAttribute("aria-selected", "true");
  });

  it("marks non-selected tabs as aria-selected false", () => {
    render(<DayTabs {...defaultProps} selectedDay="Martes" />);

    const lunesTab = screen.getByRole("tab", { name: /lun/i });
    expect(lunesTab).toHaveAttribute("aria-selected", "false");
  });

  it("calls onSelect with the dayName when a tab is clicked", () => {
    const onSelect = vi.fn();
    render(<DayTabs selectedDay="Lunes" onSelect={onSelect} />);

    const miercolesTab = screen.getByRole("tab", { name: /mié/i });
    fireEvent.click(miercolesTab);

    expect(onSelect).toHaveBeenCalledWith("Miércoles");
  });

  it("has role tablist for accessibility", () => {
    render(<DayTabs {...defaultProps} />);

    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("renders date numbers inside tabs", () => {
    render(<DayTabs {...defaultProps} />);

    // The mocked data has date 18 for Miércoles (isToday)
    expect(screen.getByText("18")).toBeInTheDocument();
  });
});

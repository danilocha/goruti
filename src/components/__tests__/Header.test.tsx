import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Header from "../Header";

describe("Header", () => {
  it("renders the day name in uppercase", () => {
    render(<Header dayName="Lunes" progress={50} done={2} total={4} />);

    expect(screen.getByText("LUNES")).toBeInTheDocument();
  });

  it("renders the progress percentage", () => {
    render(<Header dayName="Martes" progress={75} done={3} total={4} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders 0% when progress is zero", () => {
    render(<Header dayName="Miércoles" progress={0} done={0} total={5} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders 100% when all tasks are done", () => {
    render(<Header dayName="Jueves" progress={100} done={5} total={5} />);

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders the calendar icon", () => {
    render(<Header dayName="Lunes" progress={50} done={2} total={4} />);

    expect(screen.getByText("calendar_today")).toBeInTheDocument();
  });

  it("does not render a subtitle", () => {
    render(<Header dayName="Lunes" progress={50} done={2} total={4} />);

    expect(screen.queryByText("Rutina de Hogar")).not.toBeInTheDocument();
  });

  it("does not render legend badges", () => {
    render(<Header dayName="Lunes" progress={50} done={2} total={4} />);

    // Legend was moved out of Header in the new design
    expect(screen.queryByText("Daniel")).not.toBeInTheDocument();
    expect(screen.queryByText("Rotan")).not.toBeInTheDocument();
  });

  it("does not render a sign-out button", () => {
    render(<Header dayName="Lunes" progress={50} done={2} total={4} />);

    expect(screen.queryByText("Cerrar sesión")).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Header from "../Header";

describe("Header", () => {
  it("renders the day name", () => {
    render(<Header dayName="Lunes" progress={50} done={2} total={4} />);

    expect(screen.getByText("Lunes")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<Header dayName="Lunes" progress={50} done={2} total={4} />);

    expect(screen.getByText("Rutina de Hogar")).toBeInTheDocument();
  });

  it("renders all 4 legend badges", () => {
    render(<Header dayName="Lunes" progress={50} done={2} total={4} />);

    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Rot")).toBeInTheDocument();
    expect(screen.getByText("D+A")).toBeInTheDocument();
  });

  it("renders legend names", () => {
    render(<Header dayName="Lunes" progress={50} done={2} total={4} />);

    expect(screen.getByText("Daniel")).toBeInTheDocument();
    expect(screen.getByText("Tu novia")).toBeInTheDocument();
    expect(screen.getByText("Rotan")).toBeInTheDocument();
    expect(screen.getByText("Los dos")).toBeInTheDocument();
  });

  it("renders ProgressCircle with correct percentage", () => {
    render(<Header dayName="Martes" progress={75} done={3} total={4} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders ProgressCircle with 0% when no tasks done", () => {
    render(<Header dayName="Miércoles" progress={0} done={0} total={5} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ProgressCircle from "../ProgressCircle";

describe("ProgressCircle", () => {
  it("renders the percentage text", () => {
    render(<ProgressCircle progress={75} done={3} total={4} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders aria-label with progress info", () => {
    render(<ProgressCircle progress={75} done={3} total={4} />);

    const svg = screen.getByLabelText("75% completo — 3 de 4");
    expect(svg).toBeInTheDocument();
  });

  it("renders SVG with correct viewBox", () => {
    render(<ProgressCircle progress={75} done={3} total={4} />);

    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 52 52");
  });

  it("displays 0% when progress is 0", () => {
    render(<ProgressCircle progress={0} done={0} total={5} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("displays 100% when progress is 100", () => {
    render(<ProgressCircle progress={100} done={5} total={5} />);

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders two circles (track + arc)", () => {
    render(<ProgressCircle progress={75} done={3} total={4} />);

    const circles = document.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });
});

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

    const bar = screen.getByLabelText("75% completo — 3 de 4");
    expect(bar).toBeInTheDocument();
  });

  it("renders a progressbar role element", () => {
    render(<ProgressCircle progress={75} done={3} total={4} />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
  });

  it("sets aria-valuenow to the progress value", () => {
    render(<ProgressCircle progress={75} done={3} total={4} />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "75");
  });

  it("sets aria-valuemin and aria-valuemax", () => {
    render(<ProgressCircle progress={75} done={3} total={4} />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("displays 0% when progress is 0", () => {
    render(<ProgressCircle progress={0} done={0} total={5} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("displays 100% when progress is 100", () => {
    render(<ProgressCircle progress={100} done={5} total={5} />);

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("does not render an SVG element", () => {
    render(<ProgressCircle progress={75} done={3} total={4} />);

    expect(document.querySelector("svg")).not.toBeInTheDocument();
  });

  it("accepts variant prop without error", () => {
    render(<ProgressCircle progress={50} done={2} total={4} variant="streak" />);

    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});

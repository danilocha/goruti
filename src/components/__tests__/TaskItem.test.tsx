import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskItem from "../TaskItem";
import type { Task } from "@/data/types";

const baseTask: Task = {
  id: "test-1",
  time: "6:00",
  block: "🌅 Mañana",
  task: "Test task",
  who: "D",
  icon: "⏰",
};

describe("TaskItem", () => {
  it("renders the task description", () => {
    render(<TaskItem task={baseTask} checked={false} onToggle={vi.fn()} />);

    expect(screen.getByText("Test task")).toBeInTheDocument();
  });

  it("renders the time", () => {
    render(<TaskItem task={baseTask} checked={false} onToggle={vi.fn()} />);

    expect(screen.getByText("6:00")).toBeInTheDocument();
  });

  it("renders the assignee badge", () => {
    render(<TaskItem task={baseTask} checked={false} onToggle={vi.fn()} />);

    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("shows D+A for DA assignee", () => {
    const daTask: Task = { ...baseTask, who: "DA" };
    render(<TaskItem task={daTask} checked={false} onToggle={vi.fn()} />);

    expect(screen.getByText("D+A")).toBeInTheDocument();
  });

  it("renders the note when provided", () => {
    const taskWithNote: Task = { ...baseTask, note: "A note about this task" };
    render(<TaskItem task={taskWithNote} checked={false} onToggle={vi.fn()} />);

    expect(screen.getByText("A note about this task")).toBeInTheDocument();
  });

  it("renders a checkbox when not noCheck", () => {
    render(<TaskItem task={baseTask} checked={false} onToggle={vi.fn()} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
  });

  it("does not render a checkbox for noCheck tasks", () => {
    const workTask: Task = { ...baseTask, noCheck: true };
    render(<TaskItem task={workTask} checked={false} onToggle={vi.fn()} />);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("calls onToggle when checkbox is changed", () => {
    const onToggle = vi.fn();
    render(<TaskItem task={baseTask} checked={false} onToggle={onToggle} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith("test-1");
  });

  it("checkbox is checked when checked prop is true", () => {
    render(<TaskItem task={baseTask} checked={true} onToggle={vi.fn()} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("checkbox is unchecked when checked prop is false", () => {
    render(<TaskItem task={baseTask} checked={false} onToggle={vi.fn()} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("shows correct aria-label for checked task", () => {
    render(<TaskItem task={baseTask} checked={true} onToggle={vi.fn()} />);

    const checkbox = screen.getByRole("checkbox", { name: /completado/ });
    expect(checkbox).toBeInTheDocument();
  });

  it("shows correct aria-label for unchecked task", () => {
    render(<TaskItem task={baseTask} checked={false} onToggle={vi.fn()} />);

    const checkbox = screen.getByRole("checkbox", { name: /pendiente/ });
    expect(checkbox).toBeInTheDocument();
  });
});

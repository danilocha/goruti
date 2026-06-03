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

  it("renders checkbox when not noCheck", () => {
    render(<TaskItem task={baseTask} checked={false} onToggle={vi.fn()} />);

    const item = screen.getByRole("button");
    expect(item).toBeInTheDocument();
  });

  it("does not render checkbox for noCheck tasks", () => {
    const workTask: Task = { ...baseTask, noCheck: true };
    render(<TaskItem task={workTask} checked={false} onToggle={vi.fn()} />);

    // noCheck tasks should not have role="button"
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(<TaskItem task={baseTask} checked={false} onToggle={onToggle} />);

    const item = screen.getByRole("button");
    fireEvent.click(item);

    expect(onToggle).toHaveBeenCalledWith("test-1");
  });

  it("shows checkmark when checked", () => {
    render(<TaskItem task={baseTask} checked={true} onToggle={vi.fn()} />);

    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows correct aria-label for checked task", () => {
    render(<TaskItem task={baseTask} checked={true} onToggle={vi.fn()} />);

    const item = screen.getByRole("button", { name: /completado/ });
    expect(item).toBeInTheDocument();
  });

  it("shows correct aria-label for unchecked task", () => {
    render(<TaskItem task={baseTask} checked={false} onToggle={vi.fn()} />);

    const item = screen.getByRole("button", { name: /pendiente/ });
    expect(item).toBeInTheDocument();
  });
});

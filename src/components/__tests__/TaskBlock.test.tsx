import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskBlock from "../TaskBlock";
import type { Task } from "@/data/types";

const mockTasks: Task[] = [
  {
    id: "task-1",
    time: "6:00",
    block: "🌅 Mañana",
    task: "Test task 1",
    who: "D",
    icon: "⏰",
  },
  {
    id: "task-2",
    time: "6:10",
    block: "🌅 Mañana",
    task: "Test task 2",
    who: "A",
    icon: "🍳",
  },
];

describe("TaskBlock", () => {
  it("renders the block label", () => {
    render(
      <TaskBlock
        label="🌅 Mañana"
        tasks={mockTasks}
        dayChecks={{}}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("🌅 Mañana")).toBeInTheDocument();
  });

  it("renders all tasks in the block", () => {
    render(
      <TaskBlock
        label="🌅 Mañana"
        tasks={mockTasks}
        dayChecks={{}}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("Test task 1")).toBeInTheDocument();
    expect(screen.getByText("Test task 2")).toBeInTheDocument();
  });

  it("shows task count", () => {
    render(
      <TaskBlock
        label="🌅 Mañana"
        tasks={mockTasks}
        dayChecks={{}}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("collapses when toggle button is clicked", () => {
    render(
      <TaskBlock
        label="🌅 Mañana"
        tasks={mockTasks}
        dayChecks={{}}
        onToggle={vi.fn()}
      />
    );

    // Should show tasks initially
    expect(screen.getByText("Test task 1")).toBeInTheDocument();

    // Click collapse button
    const toggleButton = screen.getByRole("button", { name: /colapsar/i });
    fireEvent.click(toggleButton);

    // Tasks should be hidden
    expect(screen.queryByText("Test task 1")).not.toBeInTheDocument();
  });

  it("expands when collapsed and toggle is clicked again", () => {
    render(
      <TaskBlock
        label="🌅 Mañana"
        tasks={mockTasks}
        dayChecks={{}}
        onToggle={vi.fn()}
      />
    );

    // Collapse first
    const toggleButton = screen.getByRole("button", { name: /colapsar/i });
    fireEvent.click(toggleButton);

    expect(screen.queryByText("Test task 1")).not.toBeInTheDocument();

    // Expand again
    const expandButton = screen.getByRole("button", { name: /expandir/i });
    fireEvent.click(expandButton);

    expect(screen.getByText("Test task 1")).toBeInTheDocument();
  });

  it("renders TaskItem with correct checked state", () => {
    const dayChecks = { "task-1": true, "task-2": false };
    render(
      <TaskBlock
        label="🌅 Mañana"
        tasks={mockTasks}
        dayChecks={dayChecks}
        onToggle={vi.fn()}
      />
    );

    // task-1 is checked, task-2 is not
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it("renders expand/collapse label correctly", () => {
    render(
      <TaskBlock
        label="🌅 Mañana"
        tasks={mockTasks}
        dayChecks={{}}
        onToggle={vi.fn()}
      />
    );

    // Default state is expanded — button says "colapsar"
    expect(
      screen.getByRole("button", { name: /colapsar/i })
    ).toBeInTheDocument();
  });
});

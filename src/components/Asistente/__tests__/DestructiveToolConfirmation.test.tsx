import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DestructiveToolConfirmation from "../DestructiveToolConfirmation";

describe("DestructiveToolConfirmation", () => {
  it("renders warning text with entity name", () => {
    render(
      <DestructiveToolConfirmation
        toolName="deleteRoutine"
        args={{ routineId: "r1" }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/eliminar esta rutina/)).toBeInTheDocument();
    expect(screen.getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
  });

  it("renders cancel and delete buttons", () => {
    render(
      <DestructiveToolConfirmation
        toolName="deleteTask"
        args={{ taskId: "t1" }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByText("Eliminar")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(
      <DestructiveToolConfirmation
        toolName="deleteRoutine"
        args={{}}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onConfirm when delete button is clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <DestructiveToolConfirmation
        toolName="deleteRoutine"
        args={{}}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Eliminar"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("displays entity name from args when present", () => {
    render(
      <DestructiveToolConfirmation
        toolName="deleteRoutine"
        args={{ name: "Rutina nocturna" }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/Rutina nocturna/)).toBeInTheDocument();
  });
});

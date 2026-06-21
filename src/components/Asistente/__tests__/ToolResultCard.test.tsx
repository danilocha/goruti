import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToolResultCard from "../ToolResultCard";

describe("ToolResultCard", () => {
  it("renders streaming state with spinner", () => {
    render(
      <ToolResultCard
        toolName="listRoutines"
        args={{}}
        result={{ ok: true }}
        isStreaming={true}
      />,
    );
    expect(screen.getByText("Listar rutinas")).toBeInTheDocument();
  });

  it("renders success state with check icon", () => {
    render(
      <ToolResultCard
        toolName="createRoutine"
        args={{ name: "Mañana" }}
        result={{ ok: true, data: { id: "r1" } }}
      />,
    );
    expect(screen.getByText("Crear rutina")).toBeInTheDocument();
  });

  it("renders error state with error icon", () => {
    render(
      <ToolResultCard
        toolName="deleteRoutine"
        args={{}}
        result={{ ok: false, error: "No encontrado" }}
      />,
    );
    expect(screen.getByText("Eliminar rutina")).toBeInTheDocument();
  });

  it("expands to show params and result on click", async () => {
    render(
      <ToolResultCard
        toolName="createRoutine"
        args={{ name: "Mañana" }}
        result={{ ok: true, data: { id: "r1" } }}
      />,
    );
    // Before click — params should be hidden
    expect(screen.queryByText("Parámetros:")).not.toBeInTheDocument();

    // Click to expand
    await userEvent.click(screen.getByText("Crear rutina"));
    expect(screen.getByText("Parámetros:")).toBeInTheDocument();
    expect(screen.getByText("Resultado:")).toBeInTheDocument();
  });

  it("falls back to toolName when no label mapping exists", () => {
    render(
      <ToolResultCard
        toolName="unknownTool"
        args={{}}
        result={{ ok: true }}
      />,
    );
    expect(screen.getByText("unknownTool")).toBeInTheDocument();
  });
});

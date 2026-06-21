import { NextRequest } from "next/server";
import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { createClient } from "@/lib/supabase/server";
import { ensurePersonalGroup } from "@/lib/routines/ensurePersonalGroup";
import { getActiveGroupId } from "@/lib/routines/activeGroup";
import * as tools from "@/lib/agent/tools";

// ── Route: POST /api/chat ───────────────────────────────────
//
// Speaks the AI SDK v6 "UI Message Stream" protocol used by the
// `useChat` + `DefaultChatTransport` client. The client sends the full
// `messages: UIMessage[]` history each turn; we convert it to model
// messages, stream the response back as a UI message stream (so tool
// invocations render), and persist the final transcript on finish.

export async function POST(request: NextRequest) {
  // 1. Auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Parse request body — the client transport sends { id, messages }
  const body = await request.json().catch(() => ({}));
  const { id: sessionId, messages } = body as {
    id?: string;
    messages?: UIMessage[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Mensaje requerido" }, { status: 400 });
  }

  // 3. Resolve the active group so the agent knows which group to operate on.
  const personalId = await ensurePersonalGroup();
  const activeGroupId = await getActiveGroupId(personalId);

  // 4. Build system prompt with the active group context
  const systemPrompt = `Eres un asistente de rutinas domésticas. Ayudas a gestionar tareas del hogar.
Puedes crear, leer, actualizar y eliminar rutinas y tareas.
El grupo activo del usuario es "${activeGroupId}". Usa SIEMPRE este groupId cuando una herramienta lo requiera, salvo que el usuario indique otro.
Sé conciso y amigable. Responde siempre en español.`;

  // 5. Call streamText with tools
  try {
    const result = streamText({
      model: google("gemini-3.5-flash"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: {
        listRoutines: tools.listRoutinesTool,
        getRoutineTasks: tools.getRoutineTasksTool,
        createRoutine: tools.createRoutineTool,
        updateRoutine: tools.updateRoutineTool,
        deleteRoutine: tools.deleteRoutineTool,
        addTask: tools.addTaskTool,
        updateTask: tools.updateTaskTool,
        deleteTask: tools.deleteTaskTool,
        installTemplate: tools.installTemplateTool,
      } as never,
      stopWhen: stepCountIs(5) as never,
    });

    // 5. Stream back as a UI message stream and persist the full
    //    transcript (original + assistant reply) once the turn finishes.
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      // Surface a friendly Spanish message instead of the default
      // "An error occurred." while logging the real cause server-side.
      onError: (error) => {
        console.error("AI stream error:", error);
        return "El asistente no pudo responder. Inténtalo de nuevo.";
      },
      onFinish: async ({ messages: allMessages }) => {
        const { error: upsertError } = await supabase
          .from("chat_sessions")
          .upsert(
            {
              id: sessionId ?? crypto.randomUUID(),
              user_id: user.id,
              messages: allMessages,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          );

        if (upsertError) {
          console.error("chat_sessions upsert error:", upsertError);
        }
      },
    });
  } catch (error) {
    console.error("AI service error:", error);
    return Response.json(
      { error: "El servicio de IA no está disponible" },
      { status: 503 },
    );
  }
}

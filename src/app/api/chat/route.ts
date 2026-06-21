import { NextRequest } from "next/server";
import { streamText, stepCountIs, userModelMessageSchema } from "ai";
import { google } from "@ai-sdk/google";
import { createClient } from "@/lib/supabase/server";
import * as tools from "@/lib/agent/tools";

// ── Route: POST /api/chat ───────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Parse request body
  const body = await request.json().catch(() => ({}));
  const { id: sessionId, message } = body as {
    id?: string;
    message?: string;
  };

  if (!message) {
    return Response.json({ error: "Mensaje requerido" }, { status: 400 });
  }

  // 3. Rehydrate existing messages from chat_sessions
  let existingMessages: Array<{ role: string; content: string }> = [];
  if (sessionId) {
    const { data: session } = await supabase
      .from("chat_sessions")
      .select("messages")
      .eq("id", sessionId)
      .maybeSingle();

    if (session?.messages) {
      existingMessages = session.messages as Array<{ role: string; content: string }>;
    }
  }

  // 4. Build system prompt with group context
  const systemPrompt = `Eres un asistente de rutinas domésticas. Ayudás a gestionar tareas del hogar.
Podes crear, leer, actualizar y eliminar rutinas y tareas.
Sé conciso y amigable. Respondé siempre en español.`;

  // 5. Call streamText with tools
  try {
    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      messages: [
        ...existingMessages,
        userModelMessageSchema.parse({ role: "user", content: message }),
      ] as never,
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
      onFinish: async ({ response }) => {
        const allMessages = [
          ...existingMessages,
          { role: "user", content: message },
          ...response.messages,
        ];

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

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI service error:", error);
    return Response.json(
      { error: "El servicio de IA no está disponible" },
      { status: 503 },
    );
  }
}

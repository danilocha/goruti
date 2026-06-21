"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "@ai-sdk/react";
import Welcome from "./Welcome";
import ToolResultCard from "./ToolResultCard";
import DestructiveToolConfirmation from "./DestructiveToolConfirmation";
import styles from "./Asistente.module.css";

interface Props {
  sessionId?: string;
}

const MUTATION_TOOLS = new Set([
  "createRoutine", "updateRoutine", "deleteRoutine",
  "addTask", "updateTask", "deleteTask", "installTemplate",
]);
const DESTRUCTIVE_TOOLS = new Set(["deleteRoutine", "deleteTask"]);

/** Helper to extract text from a UIMessage's parts */
function getMessageContent(msg: UIMessage): string {
  const textPart = (msg.parts ?? []).find((p) => p.type === "text");
  return textPart ? (textPart as unknown as { text: string }).text : "";
}

/** Helper to check if a part is a tool invocation */
interface ToolInvocationPart {
  type: `tool-${string}`;
  toolInvocation: {
    toolName: string;
    toolCallId: string;
    state: string;
    args: Record<string, unknown>;
    result?: { ok: boolean; data?: unknown; error?: string };
  };
}

function isToolInvocationPart(part: unknown): part is ToolInvocationPart {
  const p = part as ToolInvocationPart;
  return typeof p.type === "string" && p.type.startsWith("tool-") && !!p.toolInvocation;
}

/**
 * Asistente — main chat orchestrator.
 *
 * Uses useChat() from @ai-sdk/react to manage conversation state.
 */
export default function Asistente({ sessionId }: Props) {
  const router = useRouter();
  const refreshDoneRef = useRef(false);
  const [input, setInput] = useState("");

  // Stable chat id for the lifetime of this component. A new id (or a new
  // transport instance) on every render makes useChat recreate its internal
  // Chat and wipe the message list, so both must be memoized.
  const chatId = useMemo(() => sessionId ?? crypto.randomUUID(), [sessionId]);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { id: chatId },
      }),
    [chatId],
  );

  const chat = useChat({ id: chatId, transport });

  const { messages, status, error, addToolOutput } = chat;

  // Refresh home after mutation tool results
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const hasMutation = (lastMsg.parts ?? []).some((part) => {
        if (!isToolInvocationPart(part)) return false;
        const ti = part.toolInvocation;
        return MUTATION_TOOLS.has(ti.toolName) && ti.state === "result";
      });
      if (hasMutation && !refreshDoneRef.current) {
        refreshDoneRef.current = true;
        router.refresh();
      } else if (!hasMutation) {
        refreshDoneRef.current = false;
      }
    }
  }, [status, messages, router]);

  const isEmpty =
    messages.length === 0 ||
    (messages.length === 1 && messages[0].role === "system");

  function handleSuggestionClick(text: string) {
    chat.sendMessage({ text });
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() && status !== "streaming") {
      chat.sendMessage({ text: input });
      setInput("");
    }
  }

  return (
    <div className={styles.container}>
      {isEmpty ? (
        <Welcome onSuggestionClick={handleSuggestionClick} />
      ) : (
        <div className={styles.messages}>
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" && (
                <div className={styles.userMessage}>
                  <div className={styles.bubble}>{getMessageContent(msg)}</div>
                </div>
              )}
              {msg.role === "assistant" && (
                <div className={styles.assistantMessage}>
                  {getMessageContent(msg) && (
                    <div className={styles.bubble}>{getMessageContent(msg)}</div>
                  )}
                  {(msg.parts ?? []).map((part, idx) => {
                    if (!isToolInvocationPart(part)) return null;
                    const ti = part.toolInvocation;

                    if (
                      ti.state === "input-available" &&
                      DESTRUCTIVE_TOOLS.has(ti.toolName)
                    ) {
                      return (
                        <DestructiveToolConfirmation
                          key={`${ti.toolCallId}-${idx}`}
                          toolName={ti.toolName}
                          args={ti.args}
                          onConfirm={() => {
                            addToolOutput({
                              tool: ti.toolName as never,
                              toolCallId: ti.toolCallId,
                              state: "output-available",
                              output: { ok: true },
                            });
                          }}
                          onCancel={() => {
                            addToolOutput({
                              tool: ti.toolName as never,
                              toolCallId: ti.toolCallId,
                              state: "output-available",
                              output: { ok: false, error: "cancelado" },
                            });
                          }}
                        />
                      );
                    }

                    if (ti.state === "result" || ti.state === "streaming") {
                      return (
                        <ToolResultCard
                          key={`${ti.toolCallId}-${idx}`}
                          toolName={ti.toolName}
                          args={ti.args}
                          result={
                            ti.state === "result" && ti.result
                              ? ti.result
                              : { ok: true }
                          }
                          isStreaming={ti.state === "streaming"}
                        />
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>
          ))}
          {status === "streaming" && (
            <div className={styles.typing}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          )}
        </div>
      )}

      <form className={styles.inputForm} onSubmit={handleFormSubmit}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje…"
          disabled={status === "streaming"}
          aria-label="Mensaje para el asistente"
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={status === "streaming" || !input.trim()}
          aria-label="Enviar mensaje"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>

      {error && (
        <div className={styles.errorBar} role="alert">
          {error.message || "Hubo un error al procesar tu mensaje."}
        </div>
      )}
    </div>
  );
}

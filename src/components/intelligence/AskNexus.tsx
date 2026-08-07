import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "What happens if a major quake hits Tokyo?",
  "How does the Suez backlog reach European retail shelves?",
  "Which sectors are most exposed this week?",
];

interface Props {
  context: string;
}

export function AskNexus({ context }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function ask(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), 60_000);

    setStreaming(true);
    setError(null);
    setAnswer("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ question: trimmed, context }),
      });
      if (!response.ok || !response.body) {
        throw new Error(
          response.status === 429
            ? "Intelligence queue is saturated. Try again in a moment."
            : "Briefing unavailable right now.",
        );
      }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        setAnswer((prev) => prev + value);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      if (controller.signal.reason === "timeout") {
        setError("The briefing took too long. Please send the question again.");
      } else if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (requestId === requestIdRef.current) {
        abortRef.current = null;
        setStreaming(false);
      }
    }
  }

  return (
    <section
      aria-label="Ask NEXUS"
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center gap-2 pb-3">
        <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">Ask NEXUS</h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="flex items-center gap-2 rounded-lg border border-glass-border bg-surface/60 px-3 py-2 focus-within:border-primary/50"
      >
        <label htmlFor="ask-nexus" className="sr-only">
          Ask NEXUS a question about global risk
        </label>
        <input
          id="ask-nexus"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about any scenario on Earth…"
          maxLength={280}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={question.trim().length < 3}
          aria-label={streaming ? "Send new question" : "Send question"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuestion(s);
              void ask(s);
            }}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      {(streaming || answer || error) && (
        <div
          className="mt-4 min-h-0 border-t border-glass-border pt-3 sm:max-h-[320px] sm:overflow-y-auto sm:overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          aria-live="polite"
        >
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : answer ? (
            <div className="space-y-1.5">
              {answer.split("\n").filter(Boolean).map((line, i) => (
                <p
                  key={i}
                  className={
                    line.startsWith("Recommended")
                      ? "text-sm font-medium text-foreground"
                      : "text-sm leading-relaxed text-muted-foreground"
                  }
                >
                  {line}
                </p>
              ))}
              {streaming && (
                <span className="inline-block h-3.5 w-1.5 animate-pulse bg-primary align-middle" aria-hidden="true" />
              )}
            </div>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">Synthesising briefing…</p>
          )}
        </div>
      )}
    </section>
  );
}

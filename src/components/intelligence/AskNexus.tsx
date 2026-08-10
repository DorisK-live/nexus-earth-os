import { useEffect, useRef, useState } from "react";
import { ArrowUp, ExternalLink, LoaderCircle, Search, Sparkles } from "lucide-react";

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
  const [submittedQuestion, setSubmittedQuestion] = useState("");
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

    setSubmittedQuestion(trimmed);
    setQuestion("");
    setStreaming(true);
    setError(null);
    setAnswer("");

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ question: trimmed, context }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) {
        throw new Error(payload.error || "Briefing unavailable right now.");
      }
      if (requestId !== requestIdRef.current) return;
      setAnswer(payload.answer);
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
              void ask(s);
            }}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      {(submittedQuestion || streaming || answer || error) && (
        <div
          className="mt-4 min-h-0 border-t border-glass-border pt-3 sm:max-h-[320px] sm:overflow-y-auto sm:overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          aria-live="polite"
        >
          {submittedQuestion && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-glass-border bg-surface/50 px-3 py-2.5">
              <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <p className="min-w-0 break-words text-sm font-medium leading-relaxed text-foreground">
                {submittedQuestion}
              </p>
            </div>
          )}

          {streaming && !answer && !error && (
            <div className="flex items-center gap-2.5 py-1 font-mono text-xs text-muted-foreground" role="status">
              <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
              <span>Synthesising briefing…</span>
            </div>
          )}

          {error ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {error.includes("AI credits are currently unavailable") && (
                <a
                  href="https://lovable.dev/settings/plans"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Upgrade credits
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
          ) : answer ? (
            <div className="space-y-1.5 border-t border-glass-border pt-3">
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
                <span className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
                  Receiving briefing…
                </span>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

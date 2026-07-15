import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import { apiExplainExecution } from "@/http";
import type { AiDebugQueryResponse } from "@quantnest-trading/types/ai";

interface ExecutionDebuggerProps {
  executionId: string | null;
  workflowName: string;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  data?: AiDebugQueryResponse;
}

const SUGGESTED_QUESTIONS = [
  "Why did this execution succeed/fail?",
  "What were the indicator values when the trigger fired?",
  "Which branch was taken and why?",
  "Was the trigger condition correctly evaluated?",
];

export const ExecutionDebugger = ({
  executionId,
  workflowName,
  onClose,
}: ExecutionDebuggerProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [traceLoaded, setTraceLoaded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (executionId && !traceLoaded) {
      setTraceLoaded(true);
      setMessages([
        {
          role: "assistant",
          content: `I'm analyzing execution **${executionId.slice(-6)}**. Ask me anything about what happened during this run.`,
        },
      ]);
    }
  }, [executionId, traceLoaded]);

  const ask = useCallback(
    async (question: string) => {
      if (!executionId || !question.trim() || loading) return;

      const userMsg: ChatMessage = { role: "user", content: question };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setShowSuggestions(false);

      try {
        const res = await apiExplainExecution(
          executionId,
          question,
          workflowName,
        );
        const answer: ChatMessage = {
          role: "assistant",
          content: res.data?.answer || "No explanation could be generated.",
          data: res.data,
        };
        setMessages((prev) => [...prev, answer]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Failed to get an explanation. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [executionId, workflowName, loading],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/6 bg-[#0d0f13]">
      <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[#f17463]" />
          <span className="text-sm font-semibold text-white">
            Explain this run
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-[#f17463]/20 text-white"
                  : "border border-white/6 bg-[#0a0b0d] text-zinc-200"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.data && (
                <div className="mt-2 space-y-1 border-t border-white/6 pt-2 text-xs text-zinc-500">
                  <p>
                    Confidence:{" "}
                    <span
                      className={
                        msg.data.confidence === "High"
                          ? "text-emerald-400"
                          : msg.data.confidence === "Medium"
                            ? "text-amber-400"
                            : "text-zinc-400"
                      }
                    >
                      {msg.data.confidence}
                    </span>
                  </p>
                  {msg.data.supportingIndicators.length > 0 && (
                    <p>
                      Indicators: {msg.data.supportingIndicators.join(", ")}
                    </p>
                  )}
                  {msg.data.relevantNodes.length > 0 && (
                    <p>Nodes: {msg.data.relevantNodes.join(", ")}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-white/6 bg-[#0a0b0d] px-3.5 py-2.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#f17463]" />
              <span className="text-xs text-zinc-500">
                Analyzing execution...
              </span>
            </div>
          </div>
        )}

        {showSuggestions && (
          <div className="mt-4 space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
              Suggested questions
            </p>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void ask(q)}
                className="block w-full rounded-lg border border-white/6 bg-white/3 px-3 py-2 text-left text-xs text-zinc-400 transition-colors hover:border-white/15 hover:text-zinc-200"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-white/6 px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this execution..."
          className="flex-1 rounded-lg border border-white/7 bg-white/3 px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-white/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="rounded-lg bg-[#f17463] p-2 text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};

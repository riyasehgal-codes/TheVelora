import { useCallback, useEffect, useRef, useState } from "react";
import api, { sendChatMessage } from "../api/client";
import Navbar from "../components/Navbar";

const STORAGE_KEY = "velora-ai-chat";

const DEFAULT_SUGGESTIONS = [
  {
    title: "How the market works",
    prompt: "Explain how the stock market works.",
  },
  {
    title: "Stocks vs mutual funds",
    prompt: "What is the difference between stocks and mutual funds?",
  },
  {
    title: "Diversification",
    prompt: "How can I diversify my portfolio and why does it matter?",
  },
  {
    title: "Compound interest",
    prompt: "Help me understand compound interest.",
  },
];

/* ============================================================
   SMALL PIECES
   ============================================================ */

// The Velora "V" mark, same shape as the navbar logo.
const VMark = ({ size = 32 }) => (
  <span
    className="relative inline-block shrink-0"
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    <span className="absolute left-[9%] top-[6%] h-[78%] w-[31%] skew-x-[27deg] rounded-[2px] bg-gradient-to-b from-cyan-400 to-blue-600" />
    <span className="absolute right-[9%] top-[6%] h-[78%] w-[31%] -skew-x-[27deg] rounded-[2px] bg-gradient-to-b from-blue-600 to-fuchsia-500" />
  </span>
);

const Avatar = ({ size = 36, mark = 18 }) => (
  <span
    className="flex shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10"
    style={{ width: size, height: size }}
  >
    <VMark size={mark} />
  </span>
);

const ICONS = {
  send: "M5 12h14M12 5l7 7-7 7",
  check: "M5 13l4 4L19 7",
  copy: "M9 9h10v11H9zM5 15V4h10",
  refresh: "M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
};

const Icon = ({ name, className = "h-4 w-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d={ICONS[name]} />
  </svg>
);

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

/* ---------- lightweight formatting for model replies ---------- */

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-slate-800 px-1.5 py-0.5 text-[0.85em] text-cyan-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedText({ text }) {
  const blocks = [];
  let list = null;
  let code = null;

  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  text.split("\n").forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (code) {
        blocks.push(code);
        code = null;
      } else {
        flushList();
        code = { type: "code", lines: [] };
      }
      return;
    }
    if (code) {
      code.lines.push(line);
      return;
    }

    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)/);
    const heading = line.match(/^#{1,4}\s+(.*)/);

    if (bullet || numbered) {
      const type = numbered ? "ol" : "ul";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((bullet || numbered)[1]);
    } else if (!line.trim()) {
      flushList();
    } else if (heading) {
      flushList();
      blocks.push({ type: "h", text: heading[1] });
    } else {
      flushList();
      blocks.push({ type: "p", text: line });
    }
  });
  flushList();
  if (code) blocks.push(code);

  return (
    <div className="space-y-2.5 break-words text-sm leading-7">
      {blocks.map((b, i) => {
        if (b.type === "h") {
          return (
            <p key={i} className="font-semibold text-white">
              {renderInline(b.text)}
            </p>
          );
        }
        if (b.type === "ul" || b.type === "ol") {
          const Tag = b.type;
          return (
            <Tag
              key={i}
              className={`space-y-1 pl-5 ${
                b.type === "ul" ? "list-disc" : "list-decimal"
              } marker:text-blue-400`}
            >
              {b.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </Tag>
          );
        }
        if (b.type === "code") {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-xl border border-slate-700/50 bg-[#050b18] p-3 text-xs leading-6 text-slate-300"
            >
              {b.lines.join("\n")}
            </pre>
          );
        }
        return <p key={i}>{renderInline(b.text)}</p>;
      })}
    </div>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

function AIChat() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Personalise one suggestion with the user's largest holding.
  useEffect(() => {
    (async () => {
      try {
        const response = await api.get("/holdings/");
        const list = Array.isArray(response.data) ? response.data : [];
        if (list.length === 0) return;
        const top = [...list].sort(
          (a, b) =>
            Number(b.quantity) * Number(b.average_price) -
            Number(a.quantity) * Number(a.average_price)
        )[0];
        const symbol = String(top.ticker).split(".")[0].toUpperCase();
        setSuggestions([
          {
            title: `What moves ${symbol}`,
            prompt: `What factors usually drive the share price of ${symbol}?`,
          },
          ...DEFAULT_SUGGESTIONS.slice(1),
        ]);
      } catch {
        /* keep defaults */
      }
    })();
  }, []);

  // Save the conversation so a refresh doesn't wipe it.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* storage unavailable: ignore */
    }
  }, [messages]);

  // Keep the newest message in view (inside the chat panel only).
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, error]);

  // Grow the textarea with its content.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const requestReply = useCallback(async (history) => {
    setLoading(true);
    setError("");
    try {
      // Only send what the backend needs.
      const response = await sendChatMessage(
        history.map(({ role, content }) => ({ role, content }))
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply, time: Date.now() },
      ]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to reach Velora AI. Check that Django and Ollama are running, then retry."
      );
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, []);

  const handleSend = (customMessage) => {
    const text = (customMessage ?? input).trim();
    if (!text || loading) return;

    const history = [
      ...messages,
      { role: "user", content: text, time: Date.now() },
    ];
    setMessages(history);
    setInput("");
    requestReply(history);
  };

  const handleRetry = () => {
    if (loading || messages.length === 0) return;
    requestReply(messages);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (loading || messages.length === 0) return;
    if (!window.confirm("Clear this conversation?")) return;
    setMessages([]);
    setInput("");
    setError("");
  };

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      /* clipboard blocked: ignore */
    }
  };

  const status = error
    ? { label: "Connection issue", dot: "bg-rose-400" }
    : loading
    ? { label: "Thinking...", dot: "bg-amber-400" }
    : { label: "Ready", dot: "bg-emerald-400" };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#050b18] text-slate-100 [background-image:radial-gradient(ellipse_at_top,rgba(37,99,235,0.14),transparent_55%)]">
      <Navbar />

      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-4 py-5 sm:px-6">
        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar size={44} mark={22} />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Velora AI
              </h1>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                {status.label}
                <span className="text-slate-600">|</span>
                Llama 3.2, running locally
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            disabled={messages.length === 0 || loading}
            className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-[#0d1731] px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="trash" className="h-3.5 w-3.5" />
            Clear chat
          </button>
        </div>

        {/* CHAT PANEL */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-700/40 bg-[#0a1226]/90 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          {/* MESSAGES */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"
            aria-live="polite"
          >
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6">
              {/* EMPTY STATE */}
              {messages.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl" />
                    <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/30 bg-[#0d1731]">
                      <VMark size={38} />
                    </span>
                  </div>

                  <h2 className="text-2xl font-semibold text-white">
                    What would you like to understand?
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Ask about investing, your holdings or how the markets
                    work. Pick a starting point or type your own question.
                  </p>

                  <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                    {suggestions.map((s) => (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => handleSend(s.prompt)}
                        disabled={loading}
                        className="group rounded-xl border border-slate-700/50 bg-[#0d1731]/70 p-4 text-left transition hover:border-blue-500/50 hover:bg-blue-500/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-50"
                      >
                        <p className="text-sm font-semibold text-white">
                          {s.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400 group-hover:text-slate-300">
                          {s.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MESSAGES */}
              {messages.map((message, index) =>
                message.role === "user" ? (
                  <div key={index} className="flex flex-col items-end gap-1">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-sm leading-7 text-white shadow-lg shadow-blue-950/40 sm:max-w-[75%]">
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {formatTime(message.time)}
                    </span>
                  </div>
                ) : (
                  <div key={index} className="flex items-start gap-3">
                    <Avatar />
                    <div className="min-w-0 max-w-[88%] sm:max-w-[80%]">
                      <div className="rounded-2xl rounded-tl-md border border-slate-700/50 bg-[#0d1731] px-4 py-3 text-slate-200">
                        <FormattedText text={message.content} />
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                        <span>{formatTime(message.time)}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(message.content, index)}
                          className="flex items-center gap-1 transition hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                        >
                          <Icon
                            name={copiedIndex === index ? "check" : "copy"}
                            className="h-3 w-3"
                          />
                          {copiedIndex === index ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* THINKING */}
              {loading && (
                <div className="flex items-center gap-3">
                  <Avatar />
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-700/50 bg-[#0d1731] px-4 py-3.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
                    <span className="ml-1 text-xs text-slate-400">
                      Velora AI is thinking...
                    </span>
                  </div>
                </div>
              )}

              {/* ERROR + RETRY */}
              {error && (
                <div
                  role="alert"
                  className="flex flex-col gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={loading}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-400/40 px-3.5 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <Icon name="refresh" className="h-3.5 w-3.5" />
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* INPUT */}
          <div className="border-t border-slate-700/40 bg-[#080f20]/80 p-4 sm:px-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="mx-auto flex w-full max-w-3xl items-end gap-3 rounded-xl border border-slate-700/60 bg-[#0d1731] p-2 transition focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Velora AI..."
                aria-label="Message Velora AI"
                rows={1}
                disabled={loading}
                className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="send" className="h-5 w-5" />
              </button>
            </form>

            <p className="mt-2.5 text-center text-[11px] text-slate-500">
              Enter to send, Shift+Enter for a new line. Velora AI can make
              mistakes and does not give financial advice.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AIChat;
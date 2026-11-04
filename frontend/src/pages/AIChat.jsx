
import { useCallback, useEffect, useRef, useState } from "react";

import api, {
  getChatConversations,
  createChatConversation,
  getChatMessages,
  sendChatMessage,
  deleteChatConversation,
} from "../api/client";

import Navbar from "../components/Navbar";

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
   SMALL COMPONENTS
   ============================================================ */

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
  copy: "M9 9h10v11H9zM5 15V4h10",
  check: "M5 13l4 4L19 7",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  plus: "M12 5v14M5 12h14",
  message: "M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8z",
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

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

/* ============================================================
   MESSAGE FORMATTING
   ============================================================ */

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

  (text || "").split("\n").forEach((line) => {
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
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  /* ============================================================
     LOAD CONVERSATION LIST
     ============================================================ */

  const refreshConversations = useCallback(async () => {
    const data = await getChatConversations();
    setConversations(Array.isArray(data) ? data : []);
    return data;
  }, []);

  /* ============================================================
     OPEN A CONVERSATION
     ============================================================ */

  const openConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    setError("");
    setHistoryLoading(true);

    try {
      const data = await getChatMessages(conversation.id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Could not load conversation:", err);

      setError(
        err.response?.data?.error ||
          "Unable to load this conversation."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const data = await getChatConversations();

        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        setConversations(list);

        if (list.length > 0) {
          const latest = list[0];
          setActiveConversation(latest);

          const history = await getChatMessages(latest.id);

          if (!cancelled) {
            setMessages(Array.isArray(history) ? history : []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Chat history error:", err);

          setError(
            err.response?.data?.detail ||
              "Unable to load your chat history."
          );
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     PERSONALIZED SUGGESTION
     ============================================================ */

  useEffect(() => {
    let cancelled = false;

    const loadSuggestion = async () => {
      try {
        const response = await api.get("/holdings/");
        const list = Array.isArray(response.data) ? response.data : [];

        if (cancelled || list.length === 0) return;

        const top = [...list].sort(
          (a, b) =>
            Number(b.quantity) * Number(b.average_price) -
            Number(a.quantity) * Number(a.average_price)
        )[0];

        const symbol = String(top.ticker)
          .split(".")[0]
          .toUpperCase();

        setSuggestions([
          {
            title: `What moves ${symbol}`,
            prompt: `What factors usually drive the share price of ${symbol}?`,
          },
          ...DEFAULT_SUGGESTIONS.slice(1),
        ]);
      } catch {
        // Keep the default suggestions.
      }
    };

    loadSuggestion();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     AUTO SCROLL
     ============================================================ */

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, error]);

  /* ============================================================
     TEXTAREA SIZE
     ============================================================ */

  useEffect(() => {
    const el = textareaRef.current;

    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  /* ============================================================
     CREATE NEW CHAT
     ============================================================ */

  const handleNewChat = () => {
    if (loading) return;

    setActiveConversation(null);
    setMessages([]);
    setInput("");
    setError("");

    textareaRef.current?.focus();
  };

  /* ============================================================
     SEND MESSAGE
     ============================================================ */

  const handleSend = async (customMessage) => {
    const text = (customMessage ?? input).trim();

    if (!text || loading || historyLoading) return;

    setInput("");
    setError("");
    setLoading(true);

    let conversation = activeConversation;

    try {
      // Create a database conversation when starting a new chat.
      if (!conversation) {
        conversation = await createChatConversation(
          text.slice(0, 50)
        );

        setActiveConversation(conversation);
        setConversations((prev) => [
          conversation,
          ...prev,
        ]);
      }

      // Send the message to Django and receive both saved messages.
      const response = await sendChatMessage(
        conversation.id,
        text
      );

      setMessages((prev) => [
        ...prev,
        response.user_message,
        response.assistant_message,
      ]);

      await refreshConversations();
    } catch (err) {
      console.error("Chatbot error:", err);

      // The backend saves the user message before calling Ollama.
      // Reload the conversation so the saved message is not lost.
      if (conversation?.id) {
        try {
          const history = await getChatMessages(conversation.id);
          setMessages(Array.isArray(history) ? history : []);
        } catch {
          // Keep the current messages if reloading fails.
        }
      }

      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to reach Velora AI. Check that Django and Ollama are running."
      );

      if (conversation?.id) {
        await refreshConversations().catch(() => {});
      }
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  /* ============================================================
     DELETE CURRENT CONVERSATION
     ============================================================ */

  const handleDeleteConversation = async (conversation) => {
    if (loading) return;

    const confirmed = window.confirm(
      `Delete "${conversation.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteChatConversation(conversation.id);

      const remaining = conversations.filter(
        (item) => item.id !== conversation.id
      );

      setConversations(remaining);

      if (activeConversation?.id === conversation.id) {
        setActiveConversation(null);
        setMessages([]);
        setError("");

        if (remaining.length > 0) {
          await openConversation(remaining[0]);
        }
      }
    } catch (err) {
      console.error("Delete conversation error:", err);

      setError(
        err.response?.data?.error ||
          "Unable to delete this conversation."
      );
    }
  };

  /* ============================================================
     COPY MESSAGE
     ============================================================ */

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);

      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // Clipboard may be unavailable.
    }
  };

  /* ============================================================
     KEYBOARD
     ============================================================ */

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  /* ============================================================
     STATUS
     ============================================================ */

  const status = error
    ? { label: "Connection issue", dot: "bg-rose-400" }
    : loading
    ? { label: "Thinking...", dot: "bg-amber-400" }
    : { label: "Ready", dot: "bg-emerald-400" };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#050b18] text-slate-100 [background-image:radial-gradient(ellipse_at_top,rgba(37,99,235,0.14),transparent_55%)]">

      <Navbar />

      <main className="mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col px-3 py-4 sm:px-5">

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
        </div>

        <section className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-700/40 bg-[#0a1226]/90 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">

          {/* ==================================================
              CONVERSATION SIDEBAR
          ================================================== */}

          <aside className="flex w-[250px] shrink-0 flex-col border-r border-slate-700/40 bg-[#080f20]/80 max-sm:w-[68px]">

            <div className="border-b border-slate-700/40 p-3">
              <button
                type="button"
                onClick={handleNewChat}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/15 px-3 py-3 text-sm font-semibold text-blue-300 transition hover:border-blue-400/50 hover:bg-blue-600/25 disabled:opacity-40"
              >
                <Icon name="plus" className="h-4 w-4 shrink-0" />

                <span className="max-sm:hidden">
                  New conversation
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">

              <p className="mb-2 px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 max-sm:hidden">
                Recent conversations
              </p>

              {historyLoading && (
                <p className="px-2 py-4 text-center text-xs text-slate-500 max-sm:hidden">
                  Loading history...
                </p>
              )}

              {!historyLoading && conversations.length === 0 && (
                <p className="px-2 py-4 text-center text-xs leading-5 text-slate-500 max-sm:hidden">
                  Your conversations will appear here.
                </p>
              )}

              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group flex items-center gap-1 rounded-xl transition ${
                      activeConversation?.id === conversation.id
                        ? "bg-blue-500/15 text-white"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openConversation(conversation)}
                      disabled={loading}
                      title={conversation.title}
                      className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-3 text-left text-xs disabled:opacity-40"
                    >
                      <Icon
                        name="message"
                        className="h-4 w-4 shrink-0 text-blue-400"
                      />

                      <span className="min-w-0 flex-1 max-sm:hidden">
                        <span className="block truncate font-medium">
                          {conversation.title}
                        </span>

                        <span className="mt-1 block text-[10px] text-slate-500">
                          {formatDate(conversation.updated_at)}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteConversation(conversation)
                      }
                      disabled={loading}
                      title="Delete conversation"
                      aria-label={`Delete ${conversation.title}`}
                      className="mr-1 rounded-md p-2 text-slate-500 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100 max-sm:hidden disabled:opacity-30"
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-700/40 p-3 text-center">
              <p className="text-[10px] text-slate-500 max-sm:hidden">
                Your chats are saved securely.
              </p>
              <span className="text-[10px] text-slate-500 sm:hidden">
                AI
              </span>
            </div>

          </aside>

          {/* ==================================================
              CHAT AREA
          ================================================== */}

          <div className="flex min-w-0 flex-1 flex-col">

            {/* MESSAGES */}

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"
              aria-live="polite"
            >
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6">

                {/* EMPTY STATE */}

                {!historyLoading && messages.length === 0 && (
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
                      Ask about anything. Learn something new, solve a
                      problem, explore an idea or discuss the markets.
                    </p>

                    <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.title}
                          type="button"
                          onClick={() => handleSend(suggestion.prompt)}
                          disabled={loading}
                          className="group rounded-xl border border-slate-700/50 bg-[#0d1731]/70 p-4 text-left transition hover:border-blue-500/50 hover:bg-blue-500/5 disabled:opacity-50"
                        >
                          <p className="text-sm font-semibold text-white">
                            {suggestion.title}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-400 group-hover:text-slate-300">
                            {suggestion.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* LOADING HISTORY */}

                {historyLoading && (
                  <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                    Loading conversation...
                  </div>
                )}

                {/* MESSAGE LIST */}

                {!historyLoading && messages.map((message, index) =>
                  message.role === "user" ? (
                    <div
                      key={message.id || index}
                      className="flex flex-col items-end gap-1"
                    >
                      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-sm leading-7 text-white shadow-lg shadow-blue-950/40 sm:max-w-[75%]">
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>

                      <span className="text-[11px] text-slate-500">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  ) : (
                    <div
                      key={message.id || index}
                      className="flex items-start gap-3"
                    >
                      <Avatar />

                      <div className="min-w-0 max-w-[88%] sm:max-w-[80%]">
                        <div className="rounded-2xl rounded-tl-md border border-slate-700/50 bg-[#0d1731] px-4 py-3 text-slate-200">
                          <FormattedText text={message.content} />
                        </div>

                        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                          <span>
                            {formatTime(message.created_at)}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(message.content, index)
                            }
                            className="flex items-center gap-1 transition hover:text-slate-200"
                          >
                            <Icon
                              name={
                                copiedIndex === index
                                  ? "check"
                                  : "copy"
                              }
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

                {/* ERROR */}

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200"
                  >
                    {error}
                  </div>
                )}

              </div>
            </div>

            {/* INPUT */}

            <div className="border-t border-slate-700/40 bg-[#080f20]/80 p-4 sm:px-8">

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
                className="mx-auto flex w-full max-w-3xl items-end gap-3 rounded-xl border border-slate-700/60 bg-[#0d1731] p-2 transition focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Velora AI..."
                  aria-label="Message Velora AI"
                  rows={1}
                  disabled={loading || historyLoading}
                  className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading || historyLoading}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="send" className="h-5 w-5" />
                </button>
              </form>

              <p className="mt-2.5 text-center text-[11px] text-slate-500">
                Enter to send, Shift+Enter for a new line. Your
                conversations are saved to your Velora account.
              </p>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AIChat;

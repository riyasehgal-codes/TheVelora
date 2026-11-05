
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
    icon: "trending",
    title: "Understand the markets",
    prompt: "Explain how the stock market works and what moves stock prices.",
  },
  {
    icon: "chart",
    title: "Stocks vs mutual funds",
    prompt: "What is the difference between stocks and mutual funds?",
  },
  {
    icon: "layers",
    title: "Diversification",
    prompt: "How can I diversify my portfolio and why does it matter?",
  },
  {
    icon: "calculator",
    title: "Compound interest",
    prompt: "Help me understand compound interest with examples.",
  },
];

const ICONS = {
  send: "M5 12h14M12 5l7 7-7 7",
  copy: "M9 9h10v11H9zM5 15V4h10",
  check: "M5 13l4 4L19 7",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  plus: "M12 5v14M5 12h14",
  message: "M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8z",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
  close: "M18 6 6 18M6 6l12 12",
  menu: "M4 6h16M4 12h16M4 18h16",
  sparkles: "m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3zM19 14l1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14z",
  chart: "M3 3v18h18M8 15l4-4 4 4 5-7",
  layers: "m12 3 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5",
  calculator: "M5 3h14v18H5zM8 7h8M8 12h2M14 12h2M8 16h2M14 16h2",
  trending: "M3 17l6-6 4 4 8-9M15 6h6v6",
};

function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[name] || ICONS.sparkles} />
    </svg>
  );
}

function VMark({ size = 30 }) {
  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="absolute left-[9%] top-[6%] h-[78%] w-[31%] skew-x-[27deg] rounded-[2px] bg-gradient-to-b from-cyan-400 to-blue-600" />
      <span className="absolute right-[9%] top-[6%] h-[78%] w-[31%] -skew-x-[27deg] rounded-[2px] bg-gradient-to-b from-blue-600 to-fuchsia-500" />
    </span>
  );
}

function Avatar({ size = 38 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border border-blue-400/25 bg-gradient-to-br from-blue-500/15 to-purple-500/15 shadow-lg shadow-blue-950/20"
      style={{ width: size, height: size }}
    >
      <VMark size={size * 0.52} />
    </div>
  );
}

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) return "Today";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

const COOLDOWN_STORAGE_KEY = "velora_ai_cooldown_until";

function getCooldownMilliseconds(data) {
  const retryAfter = data?.retry_after;

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds * 1000;
    }

    const retryDate = Date.parse(retryAfter);

    if (Number.isFinite(retryDate) && retryDate > Date.now()) {
      return retryDate - Date.now();
    }
  }

  const resetAfter = data?.reset_after;

  if (typeof resetAfter === "string") {
    const match = resetAfter.match(
      /(?:(\d+(?:\.\d+)?)h)?\s*(?:(\d+(?:\.\d+)?)m)?\s*(?:(\d+(?:\.\d+)?)s)?/i
    );

    if (match && (match[1] || match[2] || match[3])) {
      const total =
        (Number(match[1] || 0) * 3600 +
          Number(match[2] || 0) * 60 +
          Number(match[3] || 0)) *
        1000;

      if (total > 0) return total;
    }
  }

  return 60 * 1000;
}

function formatCooldown(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="rounded-md border border-blue-400/15 bg-blue-400/10 px-1.5 py-0.5 text-[0.88em] text-cyan-300"
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
      blocks.push({ type: "heading", text: heading[1] });
    } else {
      flushList();
      blocks.push({ type: "paragraph", text: line });
    }
  });

  flushList();
  if (code) blocks.push(code);

  return (
    <div className="space-y-3 break-words text-[14px] leading-7 text-slate-300">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <p key={i} className="pt-1 font-semibold text-white">
              {renderInline(block.text)}
            </p>
          );
        }

        if (block.type === "ul" || block.type === "ol") {
          const Tag = block.type;

          return (
            <Tag
              key={i}
              className={`space-y-1.5 pl-5 ${
                block.type === "ul" ? "list-disc" : "list-decimal"
              } marker:text-blue-400`}
            >
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </Tag>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-xl border border-slate-700/60 bg-[#050a16] p-4 text-xs leading-6 text-cyan-100"
            >
              {block.lines.join("\n")}
            </pre>
          );
        }

        return <p key={i}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}

function AIChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);

  const [cooldownUntil, setCooldownUntil] = useState(() => {
    const saved = Number(localStorage.getItem(COOLDOWN_STORAGE_KEY));
    return Number.isFinite(saved) && saved > Date.now() ? saved : null;
  });

  const [cooldownSeconds, setCooldownSeconds] = useState(() => {
    const saved = Number(localStorage.getItem(COOLDOWN_STORAGE_KEY));
    return Number.isFinite(saved) && saved > Date.now()
      ? Math.ceil((saved - Date.now()) / 1000)
      : 0;
  });

  const limitReached = cooldownSeconds > 0;
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const refreshConversations = useCallback(async () => {
    const data = await getChatConversations();
    setConversations(Array.isArray(data) ? data : []);
    return data;
  }, []);

  const openConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    setError("");
    setHistoryLoading(true);
    setMobileSidebarOpen(false);

    try {
      const data = await getChatMessages(conversation.id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Could not load conversation:", err);
      setError(
        err.response?.data?.error || "Unable to load this conversation."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const data = await getChatConversations();
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        setConversations(list);

        if (list.length > 0) {
          setActiveConversation(list[0]);
          const history = await getChatMessages(list[0].id);

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
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

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

        const symbol = String(top.ticker).split(".")[0].toUpperCase();

        setSuggestions([
          {
            icon: "trending",
            title: `Explore ${symbol}`,
            prompt: `What factors usually drive the share price of ${symbol}?`,
          },
          ...DEFAULT_SUGGESTIONS.slice(1),
        ]);
      } catch {
        // Keep default suggestions.
      }
    };

    loadSuggestion();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSeconds(0);
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((cooldownUntil - Date.now()) / 1000)
      );

      setCooldownSeconds(remaining);

      if (remaining <= 0) {
        localStorage.removeItem(COOLDOWN_STORAGE_KEY);
        setCooldownUntil(null);
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, error]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleNewChat = () => {
    if (loading) return;

    setActiveConversation(null);
    setMessages([]);
    setInput("");
    setError("");
    setMobileSidebarOpen(false);
    textareaRef.current?.focus();
  };

  const handleSend = async (customMessage) => {
    const text = (customMessage ?? input).trim();

    if (!text || loading || historyLoading || limitReached) return;

    setInput("");
    setError("");
    setLoading(true);

    let conversation = activeConversation;

    try {
      if (!conversation) {
        conversation = await createChatConversation(text.slice(0, 50));
        setActiveConversation(conversation);
        setConversations((prev) => [conversation, ...prev]);
      }

      const response = await sendChatMessage(conversation.id, text);

      setMessages((prev) => [
        ...prev,
        response.user_message,
        response.assistant_message,
      ]);

      await refreshConversations();
    } catch (err) {
      console.error("Chatbot error:", err);

      const responseData = err.response?.data;
      const isRateLimited =
        err.response?.status === 429 ||
        responseData?.code === "AI_LIMIT_REACHED";

      if (isRateLimited) {
        const cooldown = getCooldownMilliseconds(responseData);
        const until = Date.now() + cooldown;

        setCooldownUntil(until);
        setCooldownSeconds(Math.ceil(cooldown / 1000));
        localStorage.setItem(COOLDOWN_STORAGE_KEY, String(until));
        setError("");
      }

      if (conversation?.id) {
        try {
          const history = await getChatMessages(conversation.id);
          setMessages(Array.isArray(history) ? history : []);
        } catch {
          // Preserve current messages.
        }
      }

      if (!isRateLimited) {
        setError(
          responseData?.error ||
            responseData?.detail ||
            "Unable to reach Velora AI. Please check your connection."
        );
      }

      if (conversation?.id) {
        await refreshConversations().catch(() => {});
      }
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

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

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // Clipboard may be unavailable.
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter((conversation) =>
    (conversation.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const status = limitReached
    ? { label: "Usage limit reached", dot: "bg-rose-400" }
    : error
    ? { label: "Connection issue", dot: "bg-rose-400" }
    : loading
    ? { label: "Thinking...", dot: "bg-amber-400" }
    : { label: "Ready to help", dot: "bg-emerald-400" };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#050914] text-slate-100">
      <Navbar />

      <main className="relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden px-2 py-3 sm:px-5 sm:py-5">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[700px] -translate-x-1/2 rounded-full bg-blue-600/[0.08] blur-[120px]" />

        <div className="relative mb-4 flex shrink-0 items-center justify-between gap-3 px-1 sm:px-2">
          <div className="flex items-center gap-3">
            <Avatar size={46} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                  Velora AI
                </h1>
                <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-300">
                  Assistant
                </span>
              </div>
              <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
                <span className="text-slate-700">•</span>
                Powered by Groq
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/70 text-slate-300 transition hover:border-blue-400/40 hover:text-white md:hidden"
            aria-label="Open conversations"
          >
            <Icon name="menu" size={19} />
          </button>
        </div>

        <section className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-700/50 bg-[#0a1122]/95 shadow-[0_20px_70px_rgba(0,0,0,0.4)]">
          {/* MOBILE OVERLAY */}
          {mobileSidebarOpen && (
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute inset-0 z-30 bg-black/65 backdrop-blur-sm md:hidden"
            />
          )}

          {/* SIDEBAR */}
          <aside
            className={`absolute inset-y-0 left-0 z-40 flex w-[285px] flex-col border-r border-slate-700/50 bg-[#080f1e] transition-transform duration-300 md:relative md:z-auto md:translate-x-0 ${
              mobileSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-700/40 p-4">
              <div className="flex items-center gap-2">
                <VMark size={20} />
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300">
                  Workspace
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white md:hidden"
                aria-label="Close sidebar"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-3 border-b border-slate-700/40 p-3">
              <button
                type="button"
                onClick={handleNewChat}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40"
              >
                <Icon name="plus" size={17} />
                New conversation
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-[#0c1629] px-3 py-2.5 transition focus-within:border-blue-500/50">
                <Icon name="search" size={15} className="text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations"
                  className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-slate-500 hover:text-white"
                    aria-label="Clear search"
                  >
                    <Icon name="close" size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="mb-3 flex items-center justify-between px-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Recent conversations
                </p>
                <span className="text-[10px] text-slate-600">
                  {filteredConversations.length}
                </span>
              </div>

              {historyLoading && (
                <p className="px-2 py-5 text-center text-xs text-slate-500">
                  Loading conversations...
                </p>
              )}

              {!historyLoading && filteredConversations.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <Icon
                    name="message"
                    size={25}
                    className="mx-auto mb-3 text-slate-600"
                  />
                  <p className="text-xs text-slate-500">
                    {search
                      ? "No matching conversations."
                      : "Your conversations will appear here."}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                {filteredConversations.map((conversation) => {
                  const active =
                    activeConversation?.id === conversation.id;

                  return (
                    <div
                      key={conversation.id}
                      className={`group flex items-center gap-1 rounded-xl border transition ${
                        active
                          ? "border-blue-500/25 bg-blue-500/10"
                          : "border-transparent hover:border-slate-700/50 hover:bg-slate-800/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openConversation(conversation)}
                        disabled={loading}
                        title={conversation.title}
                        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3 text-left disabled:opacity-40"
                      >
                        <Icon
                          name="message"
                          size={16}
                          className={active ? "text-blue-400" : "text-slate-500"}
                        />

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-xs font-medium ${
                              active ? "text-white" : "text-slate-300"
                            }`}
                          >
                            {conversation.title}
                          </span>
                          <span className="mt-1 block text-[10px] text-slate-500">
                            {formatDate(conversation.updated_at)}
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteConversation(conversation)}
                        disabled={loading}
                        title="Delete conversation"
                        aria-label={`Delete ${conversation.title}`}
                        className="mr-1 rounded-lg p-2 text-slate-500 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-700/40 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <div>
                  <p className="text-[11px] font-medium text-slate-300">
                    Private workspace
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Conversations saved to your account
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* CHAT PANEL */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-700/40 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {activeConversation?.title || "New conversation"}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {messages.length > 0
                    ? `${messages.length} messages`
                    : "Start a conversation with Velora AI"}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-300">
                  Online
                </span>
              </div>
            </div>

            {/* MESSAGE AREA */}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8"
              aria-live="polite"
            >
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-7">
                {!historyLoading && messages.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                    <div className="relative mb-7">
                      <div className="absolute inset-0 scale-150 rounded-full bg-blue-500/20 blur-3xl" />
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-blue-400/25 bg-gradient-to-br from-[#13264a] to-[#11122f] shadow-2xl shadow-blue-950/40">
                        <VMark size={49} />
                      </div>
                      <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-xl border border-purple-400/20 bg-[#17132e] text-purple-300 shadow-lg">
                        <Icon name="sparkles" size={16} />
                      </span>
                    </div>

                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-blue-400">
                      Your intelligent companion
                    </p>

                    <h2 className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-[38px]">
                      Think bigger.
                      <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Ask anything.
                      </span>
                    </h2>

                    <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                      Explore ideas, understand complex topics, solve
                      problems and learn something new with Velora AI.
                    </p>

                    <div className="mt-9 w-full text-left">
                      <div className="mb-3 flex items-center justify-between px-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          Suggested prompts
                        </p>
                        <span className="text-[10px] text-slate-600">
                          Get started
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion.title}
                            type="button"
                            onClick={() => handleSend(suggestion.prompt)}
                            disabled={loading || historyLoading || limitReached}
                            className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-[#101b32] to-[#0c1528] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-950/20 disabled:opacity-50"
                          >
                            <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-blue-300 transition group-hover:bg-blue-500/20">
                              <Icon name={suggestion.icon} size={18} />
                            </span>
                            <p className="text-sm font-semibold text-white">
                              {suggestion.title}
                            </p>
                            <p className="mt-1.5 text-xs leading-5 text-slate-400 transition group-hover:text-slate-300">
                              {suggestion.prompt}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {historyLoading && (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                      Loading your conversation...
                    </div>
                  </div>
                )}

                {!historyLoading &&
                  messages.map((message, index) =>
                    message.role === "user" ? (
                      <div
                        key={message.id || index}
                        className="flex flex-col items-end gap-2"
                      >
                        <div className="max-w-[90%] rounded-2xl rounded-br-md border border-blue-400/20 bg-gradient-to-br from-blue-600 to-indigo-700 px-4 py-3.5 text-sm leading-7 text-white shadow-lg shadow-blue-950/30 sm:max-w-[78%]">
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <span className="px-1 text-[10px] text-slate-600">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    ) : (
                      <div
                        key={message.id || index}
                        className="flex items-start gap-3 sm:gap-4"
                      >
                        <Avatar size={36} />

                        <div className="min-w-0 max-w-[92%] flex-1 sm:max-w-[85%]">
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">
                              Velora AI
                            </span>
                            <span className="text-[10px] text-slate-600">
                              {formatTime(message.created_at)}
                            </span>
                          </div>

                          <div className="rounded-2xl rounded-tl-md border border-slate-700/60 bg-[#101a2e] px-4 py-4 shadow-lg shadow-black/10 sm:px-5">
                            <FormattedText text={message.content} />
                          </div>

                          <div className="mt-2 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleCopy(message.content, index)}
                              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                            >
                              <Icon
                                name={copiedIndex === index ? "check" : "copy"}
                                size={12}
                              />
                              {copiedIndex === index ? "Copied" : "Copy"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                {loading && (
                  <div className="flex items-start gap-3">
                    <Avatar size={36} />
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-300">
                        Velora AI
                      </p>
                      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-700/50 bg-[#101a2e] px-4 py-4">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400 [animation-delay:300ms]" />
                        <span className="ml-2 text-xs text-slate-400">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {limitReached && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                      <Icon name="sparkles" size={17} />
                      Usage limit reached
                    </div>
                    <p className="mt-2 text-xs leading-6 text-amber-100/70">
                      The AI service has reached its current usage limit.
                      Sending is temporarily disabled. You can try again in{" "}
                      <strong className="tabular-nums text-white">
                        {formatCooldown(cooldownSeconds)}
                      </strong>.
                    </p>
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-4 text-xs leading-6 text-rose-200"
                  >
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* COMPOSER */}
            <div className="shrink-0 border-t border-slate-700/40 bg-[#080f1e]/90 px-3 py-4 sm:px-8 sm:py-5">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
                className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-slate-700/70 bg-[#111c32] p-2 shadow-xl shadow-black/20 transition focus-within:border-blue-500/60 focus-within:shadow-blue-950/30"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Velora AI anything..."
                  aria-label="Message Velora AI"
                  rows={1}
                  disabled={loading || historyLoading || limitReached}
                  className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={
                    !input.trim() || loading || historyLoading || limitReached
                  }
                  aria-label="Send message"
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/30 transition hover:scale-105 hover:from-blue-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
                >
                  <Icon name="send" size={18} />
                </button>
              </form>

              <div className="mx-auto mt-3 flex w-full max-w-3xl items-center justify-between gap-2 px-1">
                <p className="text-[10px] text-slate-500">
                  Enter to send · Shift + Enter for a new line
                </p>
                <p className="text-[10px] text-slate-600">
                  Powered by Groq
                </p>
              </div>

              {limitReached && (
                <p className="mt-2 text-center text-[11px] text-amber-300">
                  Sending paused · Try again in{" "}
                  {formatCooldown(cooldownSeconds)}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AIChat;

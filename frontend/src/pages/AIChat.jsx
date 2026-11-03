
import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api/client";
import Navbar from "../components/Navbar";

function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Automatically scroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = async (customMessage) => {
    const messageText = (customMessage ?? input).trim();

    if (!messageText || loading) return;

    const userMessage = {
      role: "user",
      content: messageText,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await sendChatMessage(updatedMessages);

      const assistantMessage = {
        role: "assistant",
        content: response.reply,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (err) {
      console.error("Chatbot error:", err);

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Unable to connect to Velora AI. Please check that Django and Ollama are running.";

      setError(errorMessage);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSend();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (loading) return;

    setMessages([]);
    setInput("");
    setError("");
  };

  const suggestions = [
    "Explain how the stock market works.",
    "What is the difference between stocks and mutual funds?",
    "Help me understand compound interest.",
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <Navbar />

      <main className="mx-auto flex max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* PAGE HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10">
                <span className="text-xl font-bold text-blue-400">
                  V
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Velora AI
                </h1>

                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <p className="text-xs text-slate-400">
                    Local AI assistant
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Your personal space for questions, ideas and conversations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={messages.length === 0 || loading}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear chat
          </button>
        </div>

        {/* CHAT CONTAINER */}
        <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1224] shadow-2xl shadow-black/20">

          {/* CHAT HEADER */}
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-white">
                Conversation
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Powered by Llama 3.2
              </p>
            </div>

            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              Online
            </span>
          </div>

          {/* MESSAGES AREA */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-7">

            {/* WELCOME SCREEN */}
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10">
                  <span className="text-3xl font-bold text-blue-400">
                    V
                  </span>
                </div>

                <h2 className="text-2xl font-semibold">
                  Hello! How can I help?
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  I'm Velora AI. Ask me anything, explore an idea,
                  or simply start a conversation.
                </p>

                <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSend(suggestion)}
                      disabled={loading}
                      className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-left text-sm text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-800 disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT MESSAGES */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-sm font-bold text-blue-400">
                    V
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                    message.role === "user"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md border border-slate-700 bg-slate-900 text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-7">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {/* LOADING INDICATOR */}
            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-sm font-bold text-blue-400">
                  V
                </div>

                <div className="rounded-2xl rounded-bl-md border border-slate-700 bg-slate-900 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
                    <span className="ml-2 text-xs text-slate-400">
                      Velora AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div
              role="alert"
              className="mx-5 mb-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          {/* MESSAGE INPUT */}
          <div className="border-t border-slate-800 bg-[#080f20] p-4 sm:p-5">
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-3 rounded-xl border border-slate-700 bg-[#0b1224] p-2 transition focus-within:border-blue-500/60"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Velora AI..."
                rows={1}
                disabled={loading}
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            </form>

            <p className="mt-3 text-center text-xs text-slate-500">
              Velora AI can make mistakes. Verify important information.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AIChat;

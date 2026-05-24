import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../../hooks/useLanguage";

// ═══════════════════════════════════════════════════════════
// InlineChat — lightweight, embedded AI chat box (web-Claude style)
// ═══════════════════════════════════════════════════════════
// Sits directly inside the Life dashboard (not a full-screen overlay).
// Reuses the shared `copilot` hook so habit actions returned by the AI
// (complete/skip/activate…) still execute. For the full experience
// (file upload, quest cards, check-in) the user taps "expand".

// Suggested starter prompts shown when the chat is empty.
const STARTERS = {
  zh: [
    { icon: "🌅", key: "habit.chat.starterPlan", text: "帮我安排一下今天" },
    { icon: "😮‍💨", key: "habit.chat.starterTired", text: "我今天很累，可以做点什么轻松的？" },
    { icon: "✨", key: "habit.chat.starterIdea", text: "给我一个新习惯的建议" },
  ],
  en: [
    { icon: "🌅", key: "habit.chat.starterPlan", text: "Help me plan today" },
    { icon: "😮‍💨", key: "habit.chat.starterTired", text: "I'm tired today — something easy?" },
    { icon: "✨", key: "habit.chat.starterIdea", text: "Suggest a new habit for me" },
  ],
};

export default function InlineChat({ copilot, theme, onExpand }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(true);
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  const { messages, isLoading, error, sendMessage } = copilot;

  // Auto-scroll to newest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-grow textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 96) + "px";
    }
  }, [input]);

  const send = useCallback(
    (text) => {
      const msg = (text ?? input).trim();
      if (!msg || isLoading) return;
      sendMessage(msg);
      setInput("");
      setCollapsed(false);
      if (taRef.current) taRef.current.style.height = "auto";
    },
    [input, isLoading, sendMessage]
  );

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const hasChat = messages.length > 0;
  const starters = STARTERS[lang === "zh" ? "zh" : "en"];

  return (
    <div className="rounded-2xl bg-white/85 border border-white/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: `linear-gradient(135deg, ${accent}14, ${accent}04)` }}
      >
        <span className="text-base">💬</span>
        <span className="text-[13px] font-black text-gray-800">{t("habit.chat.title")}</span>
        <span className="flex-1" />
        {hasChat && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-[11px] font-bold text-gray-400 hover:text-gray-600"
          >
            {collapsed ? `▸ ${t("habit.chat.show")}` : `▾ ${t("habit.chat.hide")}`}
          </button>
        )}
        {onExpand && (
          <button
            onClick={onExpand}
            className="text-[11px] font-bold ml-2"
            style={{ color: accent }}
            title={t("habit.chat.expand")}
          >
            ⛶
          </button>
        )}
      </div>

      {/* Conversation (collapsible once there's history) */}
      {hasChat && !collapsed && (
        <div ref={scrollRef} className="max-h-60 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50/50">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            // Strip any appended file block from the user's displayed text
            const text = isUser ? m.content.split("\n---\n")[0] || m.content : m.content;
            return (
              <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap ${
                    isUser ? "rounded-br-sm text-white" : "rounded-bl-sm text-gray-700 bg-white border border-gray-100"
                  }`}
                  style={isUser ? { background: accent } : undefined}
                >
                  {text}
                  {/* Habit action confirmation chip */}
                  {m.habitResult && (
                    <div className="mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: `${accent}18`, color: accent }}>
                      ✓ {t("habit.chat.actionDone")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white border border-gray-100 px-3 py-2 text-[12px] text-gray-400">
                <span className="inline-flex gap-0.5">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Starter chips when empty */}
      {!hasChat && (
        <div className="px-3 pt-3 flex flex-wrap gap-1.5">
          {starters.map((s) => (
            <button
              key={s.key}
              onClick={() => send(lang === "zh" ? s.text : s.text)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1.5 rounded-full font-medium transition-colors"
              style={{ background: `${accent}12`, color: accent }}
            >
              {s.icon} {t(s.key)}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-xl text-[11px] text-red-500 bg-red-50">
          {error === "noApiKey" ? t("habit.chat.noKey") : t("copilot.error")}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-3">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("habit.chat.placeholder")}
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-[13px] resize-none outline-none placeholder:text-gray-400 text-gray-700"
          style={{ maxHeight: 96 }}
        />
        <button
          onClick={() => send()}
          disabled={isLoading || !input.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white text-lg shrink-0 transition-all"
          style={{ background: input.trim() ? accent : "#cbd5e1" }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

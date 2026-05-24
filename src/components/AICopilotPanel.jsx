import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { ACCEPTED_MIME } from "../utils/fileExtractor";

// ═══════════════════════════════════════════
// AI Copilot Panel — Conversational AI Interface
// ═══════════════════════════════════════════

const MOOD_EMOJIS = ["😫", "😢", "😟", "😕", "😐", "🙂", "😊", "😄", "🤩", "🌟"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ── Sub-component: Welcome Card ──
function WelcomeCard({ game, theme, t }) {
  const levelInfo = game.levelInfo || { level: 1, name: "Novice" };
  const activeCount = (game.quests || []).filter(
    (q) => q.steps && q.steps.some((s) => !s.done)
  ).length;
  const contextStr = t("copilot.contextInfo", {
    level: levelInfo.level,
    xp: game.xp || 0,
    streak: game.streak || 0,
    questCount: activeCount,
  });

  return (
    <div
      className="mx-3 mb-3 p-4 rounded-xl border"
      style={{
        background: `${theme.accent}10`,
        borderColor: `${theme.accent}30`,
      }}
    >
      <div className="text-lg font-semibold mb-1">
        🤖 {t("copilot.title")}
      </div>
      <div className="text-sm opacity-70 mb-2">{t("copilot.welcome")}</div>
      <div
        className="text-xs px-2 py-1 rounded-lg inline-block"
        style={{ background: `${theme.accent}20`, color: theme.accent }}
      >
        {contextStr}
      </div>
    </div>
  );
}

// ── Sub-component: Chat Bubble ──
function ChatBubble({ role, content, file, theme, animate }) {
  const isUser = role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 px-3 ${
        animate ? "animate-fade-in" : ""
      }`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? "rounded-br-md" : "rounded-bl-md"
        }`}
        style={
          isUser
            ? { background: theme.accent, color: "#fff" }
            : { background: "rgba(255,255,255,0.08)", color: "inherit" }
        }
      >
        {file && (
          <div className="text-xs opacity-60 mb-1">📎 {file.name}</div>
        )}
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}

// ── Sub-component: Quest Preview Card ──
function QuestPreviewCard({ quest, onCreateClick, theme, t, created }) {
  const catEmoji = { learning: "📚", work: "💼", habit: "🔄", code: "💻" };
  const diffColors = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-red-400",
  };

  return (
    <div
      className="mx-3 mb-2 p-3 rounded-xl border"
      style={{
        background: "rgba(255,255,255,0.05)",
        borderColor: created ? "#22c55e40" : `${theme.accent}30`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{catEmoji[quest.category] || "📋"}</span>
          <span>{quest.name}</span>
        </div>
        {created ? (
          <span className="text-xs text-green-400">✅</span>
        ) : (
          <button
            onClick={() => onCreateClick(quest)}
            className="text-xs px-3 py-1 rounded-lg font-medium transition-colors"
            style={{ background: theme.accent, color: "#fff" }}
          >
            {t("copilot.createQuest")}
          </button>
        )}
      </div>
      <div className="space-y-1">
        {quest.steps.slice(0, 5).map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs opacity-70">
            <span className="opacity-40">{i + 1}.</span>
            <span className="flex-1 truncate">{step.text}</span>
            <span className={diffColors[step.difficulty] || ""}>
              {step.difficulty}
            </span>
          </div>
        ))}
        {quest.steps.length > 5 && (
          <div className="text-xs opacity-40">
            +{quest.steps.length - 5} more...
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: Check-In Card ──
function CheckInCard({ onSave, theme, t }) {
  const [mood, setMood] = useState(null);
  const [moment, setMoment] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (mood === null) return;
    onSave(mood + 1, moment.trim());
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="mx-3 mb-3 p-3 rounded-xl text-center text-sm" style={{ background: "#22c55e15", color: "#22c55e" }}>
        🎭 {t("copilot.checkInSaved")}
      </div>
    );
  }

  return (
    <div
      className="mx-3 mb-3 p-4 rounded-xl border"
      style={{
        background: "rgba(255,255,255,0.05)",
        borderColor: `${theme.accent}30`,
      }}
    >
      <div className="text-sm font-medium mb-3">{t("copilot.moodPrompt")}</div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {MOOD_EMOJIS.map((emoji, i) => (
          <button
            key={i}
            onClick={() => setMood(i)}
            className={`w-8 h-8 rounded-lg text-base transition-all ${
              mood === i
                ? "scale-125 ring-2"
                : "opacity-50 hover:opacity-80"
            }`}
            style={mood === i ? { ringColor: theme.accent } : {}}
          >
            {emoji}
          </button>
        ))}
      </div>
      {mood !== null && (
        <>
          <div className="text-sm opacity-70 mb-2">
            {t("copilot.momentPrompt")}
          </div>
          <input
            type="text"
            value={moment}
            onChange={(e) => setMoment(e.target.value)}
            placeholder="..."
            className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm outline-none mb-3"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <button
            onClick={handleSave}
            className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: theme.accent, color: "#fff" }}
          >
            {t("copilot.saveCheckin")}
          </button>
        </>
      )}
    </div>
  );
}

// ── Sub-component: Loading Dots ──
function LoadingDots({ t }) {
  return (
    <div className="flex justify-start mb-3 px-3 animate-fade-in">
      <div className="bg-white/5 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
        <span className="inline-flex gap-1">
          <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
          <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
          <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
        </span>
        <span className="ml-2 text-xs opacity-50">{t("copilot.loading")}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function AICopilotPanel({
  onClose,
  theme,
  copilot,
  onCreateQuest,
  onSaveCheckIn,
  game,
}) {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [createdQuestIds, setCreatedQuestIds] = useState(new Set());
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const { messages, isLoading, error, setError, sendMessage, quickCheckIn, clearHistory } = copilot;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // ── Handle send ──
  const handleSend = useCallback(() => {
    if ((!input.trim() && !pendingFile) || isLoading) return;
    sendMessage(input.trim(), pendingFile);
    setInput("");
    setPendingFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [input, pendingFile, isLoading, sendMessage]);

  // ── Handle file selection ──
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("fileTooLarge");
      return;
    }
    setPendingFile(file);
    // Focus textarea after file selection
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [setError]);

  // ── Handle quest creation (no navigation) ──
  const handleCreateQuest = useCallback(
    (questData) => {
      const newQuest = onCreateQuest(questData);
      if (newQuest?.id) {
        setCreatedQuestIds((prev) => new Set([...prev, questData.name]));
      }
    },
    [onCreateQuest]
  );

  // ── Handle create all quests ──
  const handleCreateAll = useCallback(
    (quests) => {
      quests.forEach((q) => {
        if (!createdQuestIds.has(q.name)) {
          handleCreateQuest(q);
        }
      });
    },
    [handleCreateQuest, createdQuestIds]
  );

  // ── Keyboard shortcut ──
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const accent = theme.accent;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: theme.pageBg || "#0f172a" }}>
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: `${accent}20` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-semibold">{t("copilot.title")}</span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs px-2 py-1 rounded-lg opacity-50 hover:opacity-80 transition-opacity"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              {t("copilot.clearHistory")}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Quick Action Chips ── */}
      <div className="flex gap-2 px-4 py-2 border-b" style={{ borderColor: `${accent}10` }}>
        <button
          onClick={quickCheckIn}
          disabled={isLoading}
          className="text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{ background: `${accent}15`, color: accent }}
        >
          🎭 {t("copilot.checkin")}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{ background: `${accent}15`, color: accent }}
        >
          📎 {t("copilot.upload")}
        </button>
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Welcome card (always shown at top) */}
        <WelcomeCard game={game} theme={theme} t={t} />

        {/* Message list */}
        {messages.map((msg, i) => (
          <div key={i}>
            {/* Chat bubble */}
            <ChatBubble
              role={msg.role}
              content={msg.role === "user" && msg.file
                ? msg.content.split("\n---\n")[0] || msg.content
                : msg.content}
              file={msg.file}
              theme={theme}
              animate={i === messages.length - 1}
            />

            {/* Render quest cards if AI message has quest actions */}
            {msg.role === "assistant" && msg.actions?.quests?.length > 0 && (
              <div className="mb-2">
                {msg.actions.quests.map((quest, qi) => (
                  <QuestPreviewCard
                    key={qi}
                    quest={quest}
                    onCreateClick={handleCreateQuest}
                    theme={theme}
                    t={t}
                    created={createdQuestIds.has(quest.name)}
                  />
                ))}
                {msg.actions.quests.length > 1 &&
                  !msg.actions.quests.every((q) => createdQuestIds.has(q.name)) && (
                    <div className="px-3 mb-2">
                      <button
                        onClick={() => handleCreateAll(msg.actions.quests)}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: `${accent}20`, color: accent }}
                      >
                        ✨ {t("copilot.createAll")}
                      </button>
                    </div>
                  )}
              </div>
            )}

            {/* Render check-in card if AI suggests check-in */}
            {msg.role === "assistant" && msg.actions?.checkin && (
              <CheckInCard onSave={onSaveCheckIn} theme={theme} t={t} />
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && <LoadingDots t={t} />}

        {/* Error display */}
        {error && (
          <div className="mx-3 mb-3 p-3 rounded-xl text-sm text-red-400 bg-red-500/10">
            {error === "noApiKey"
              ? t("copilot.noApiKey")
              : error === "fileTooLarge"
              ? t("copilot.fileTooLarge")
              : t("copilot.error")}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div
        className="border-t px-3 py-3"
        style={{ borderColor: `${accent}20` }}
      >
        {/* File attachment badge */}
        {pendingFile && (
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span
              className="px-2 py-1 rounded-lg flex items-center gap-1"
              style={{ background: `${accent}15`, color: accent }}
            >
              📎 {pendingFile.name}
              <button
                onClick={() => setPendingFile(null)}
                className="ml-1 opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </span>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors opacity-50 hover:opacity-80 flex-shrink-0"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIME}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("copilot.placeholder")}
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm resize-none outline-none placeholder:opacity-40"
            style={{ maxHeight: 120 }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !pendingFile)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
            style={{
              background:
                input.trim() || pendingFile ? accent : "rgba(255,255,255,0.05)",
              color: input.trim() || pendingFile ? "#fff" : "inherit",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

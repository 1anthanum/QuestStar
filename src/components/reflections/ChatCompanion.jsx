import { useState, useEffect, useRef } from "react";
import { CHAT_REPLIES, GUARDIAN_RESPONSES } from "../../utils/reflectionModes";

// ═══════════════════════════════════════════
// ③ Chat Companion — 聊天式对话
//
// Reflection as a chat window with a guardian character.
// Questions asked one by one, user types or taps preset.
// Non-judgmental responses after each answer.
// ═══════════════════════════════════════════

const QUESTIONS = [
  { key: "okMoment", icon: "🌿", en: "Hey there. Was there a moment today that felt OK?", zh: "嗨。今天有哪一刻感觉还行？" },
  { key: "hardMoment", icon: "🧭", en: "What was the toughest part? What did you do about it?", zh: "最难的部分是什么？你当时做了什么？" },
  { key: "minWin", icon: "🌱", en: "Last one — what's the smallest win for tomorrow?", zh: "最后一个——明天最小的一个赢？" },
];

function ChatBubble({ isUser, text, icon, animate }) {
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""} ${animate ? "animate-fade-in" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm">🦉</span>
        </div>
      )}
      <div
        className={`max-w-[260px] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed ${
          isUser
            ? "bg-indigo-500 text-white rounded-br-md"
            : "bg-gray-100 text-gray-700 rounded-bl-md"
        }`}
      >
        {icon && !isUser && <span className="mr-1">{icon}</span>}
        {text}
      </div>
    </div>
  );
}

export default function ChatCompanion({
  answers,
  mood,
  onAnswerChange,
  onMoodChange,
  onSave,
  theme,
  lang,
}) {
  const accent = theme?.accent || "#6366f1";
  const [messages, setMessages] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [inputText, setInputText] = useState("");
  const [waitingReply, setWaitingReply] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [moodSet, setMoodSet] = useState(!!mood);
  const scrollRef = useRef(null);

  // Start conversation
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = lang === "zh"
        ? "嘿，坐下来聊聊？今天怎么样？"
        : "Hey, want to chat? How was today?";
      setMessages([{ isUser: false, text: greeting, icon: "🦉" }]);
      // Ask for mood first
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            isUser: false,
            text: lang === "zh" ? "先给今天打个分？1-10" : "Rate today 1-10?",
            icon: "🎭",
          },
        ]);
      }, 800);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const pickGuardianReply = (key) => {
    const pool = GUARDIAN_RESPONSES[key] || GUARDIAN_RESPONSES.okMoment;
    const r = pool[Math.floor(Math.random() * pool.length)];
    return lang === "zh" ? r.zh : r.en;
  };

  const handleSend = (text) => {
    if (!text.trim()) return;
    const userMsg = text.trim();

    // Mood phase
    if (!moodSet) {
      const num = parseInt(userMsg, 10);
      const moodVal = num >= 1 && num <= 10 ? num : 5;
      onMoodChange(moodVal);
      setMoodSet(true);

      setMessages((prev) => [
        ...prev,
        { isUser: true, text: userMsg },
      ]);
      setInputText("");
      setWaitingReply(true);

      setTimeout(() => {
        const reply = moodVal >= 7
          ? (lang === "zh" ? "不错的一天 ✓" : "Solid day ✓")
          : moodVal >= 4
          ? (lang === "zh" ? "记录了。" : "Noted.")
          : (lang === "zh" ? "辛苦了。继续聊。" : "That's tough. Let's keep going.");
        setMessages((prev) => [...prev, { isUser: false, text: reply, icon: "🦉" }]);
        setWaitingReply(false);

        // Ask first question
        setTimeout(() => {
          const q = QUESTIONS[0];
          setMessages((prev) => [...prev, { isUser: false, text: lang === "zh" ? q.zh : q.en, icon: q.icon }]);
        }, 600);
      }, 800);
      return;
    }

    // Question phase
    const q = QUESTIONS[currentQ];
    if (!q) return;

    onAnswerChange(q.key, userMsg);
    setMessages((prev) => [...prev, { isUser: true, text: userMsg }]);
    setInputText("");
    setWaitingReply(true);

    setTimeout(() => {
      const reply = pickGuardianReply(q.key);
      setMessages((prev) => [...prev, { isUser: false, text: reply, icon: "🦉" }]);
      setWaitingReply(false);

      const nextQ = currentQ + 1;
      if (nextQ < QUESTIONS.length) {
        setTimeout(() => {
          const nq = QUESTIONS[nextQ];
          setMessages((prev) => [...prev, { isUser: false, text: lang === "zh" ? nq.zh : nq.en, icon: nq.icon }]);
          setCurrentQ(nextQ);
        }, 600);
      } else {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              isUser: false,
              text: lang === "zh" ? "聊完了。今天辛苦了。🌙" : "All done. Take care tonight. 🌙",
              icon: "🦉",
            },
          ]);
          setCompleted(true);
        }, 600);
      }
    }, 600 + Math.random() * 400);
  };

  const quickReplies = moodSet
    ? CHAT_REPLIES.map((r) => (lang === "zh" ? r.zh : r.en))
    : ["3", "5", "7", "9"];

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Chat header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100/80">
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-base">🦉</span>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-700">
            {lang === "zh" ? "守护者" : "Guardian"}
          </p>
          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            {lang === "zh" ? "在线" : "Online"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            isUser={msg.isUser}
            text={msg.text}
            icon={msg.icon}
            animate={i === messages.length - 1}
          />
        ))}
        {waitingReply && (
          <div className="flex items-start gap-2.5 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-sm">🦉</span>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3.5 py-2.5">
              <span className="text-gray-400 text-[12px] animate-pulse">...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick replies */}
      {!completed && !waitingReply && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {quickReplies.map((r) => (
            <button
              key={r}
              onClick={() => handleSend(r)}
              className="text-[11px] px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all font-medium"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Input or save */}
      {!completed ? (
        <div className="px-4 py-3 border-t border-gray-100/80 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 text-[12px] px-3.5 py-2 rounded-full border border-gray-200 focus:border-indigo-400 focus:outline-none bg-white"
            placeholder={lang === "zh" ? "输入回复..." : "Type a reply..."}
            onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
            disabled={waitingReply}
          />
          <button
            onClick={() => handleSend(inputText)}
            disabled={!inputText.trim() || waitingReply}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-30"
            style={{ background: accent }}
          >
            ↑
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-gray-100/80">
          <button
            onClick={onSave}
            className="w-full py-2.5 rounded-2xl text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: theme?.btnGrad || accent }}
          >
            {lang === "zh" ? "✓ 保存对话" : "✓ Save chat"}
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { XP_CONFIG } from "../utils/constants";
import MathText from "./MathText";
import { useLanguage } from "../hooks/useLanguage";

// ═══════════════════════════════════════
// Confetti burst — spawns particles at a point
// ═══════════════════════════════════════
function ConfettiBurst({ x, y, count = 18 }) {
  const colors = ["#f59e0b", "#10b981", "#6366f1", "#ec4899", "#3b82f6", "#f97316"];
  const particles = useRef(
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360 + (Math.random() * 30 - 15);
      const dist = 40 + Math.random() * 60;
      const rad = (angle * Math.PI) / 180;
      return {
        tx: Math.cos(rad) * dist,
        ty: Math.sin(rad) * dist - 20,
        rot: Math.random() * 720 - 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 5,
        delay: Math.random() * 80,
      };
    })
  ).current;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="confetti-particle"
          style={{
            left: x,
            top: y,
            width: p.size,
            height: p.size,
            background: p.color,
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            "--rot": `${p.rot}deg`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
// Floating XP Notification — with shimmer
// ═══════════════════════════════════════
export function XpPopup({ amount, visible }) {
  return (
    <div className={`fixed top-20 right-6 z-50 transition-all duration-500
      ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-6 scale-90 pointer-events-none"}`}
    >
      <div className="relative bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-white font-black text-xl px-7 py-3.5 rounded-2xl shadow-xl shadow-amber-300/40 flex items-center gap-2.5 overflow-hidden">
        <span className="text-2xl animate-bounce-slow">⚡</span>
        <span>+{amount} XP</span>
        <div className="absolute inset-0 rounded-2xl xp-bar-shimmer opacity-40" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Level Up — with confetti
// ═══════════════════════════════════════
export function LevelUpOverlay({ level, onClose }) {
  const { t } = useLanguage();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (level) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1500);
      return () => clearTimeout(t);
    }
  }, [level]);

  if (!level) return null;

  return (
    <>
      {showConfetti && <ConfettiBurst x="50%" y="40%" count={30} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm mx-4 animate-scale-in">
          <div className="text-6xl mb-4 animate-stamp">🎉</div>
          <div className="text-3xl font-black bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent mb-2">
            {t("celeb.levelUp")}
          </div>
          <div className="text-5xl font-black text-gray-800 mb-2 animate-pop">{t("header.lv")}{level.level}</div>
          <div className="text-lg text-gray-500 mb-6">{t("level." + level.level)}</div>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold px-8 py-3 rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            {t("celeb.continue")}
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════
// Quest Complete — with confetti
// ═══════════════════════════════════════
export function QuestCompleteOverlay({ quest, onClose }) {
  const { t } = useLanguage();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (quest) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1500);
      return () => clearTimeout(t);
    }
  }, [quest]);

  if (!quest) return null;

  return (
    <>
      {showConfetti && <ConfettiBurst x="50%" y="35%" count={36} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm mx-4 animate-scale-in">
          <div className="text-6xl mb-4 animate-stamp">🏆</div>
          <div className="text-2xl font-black text-gray-800 mb-2">{t("celeb.questComplete")}</div>
          <div className="text-lg text-gray-500 mb-1 max-w-[260px] mx-auto truncate"><MathText text={quest.name} /></div>
          <div className="text-amber-500 font-black text-xl mb-6 animate-pop">+{XP_CONFIG.questBonus} XP</div>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-emerald-400 to-green-500 text-white font-bold px-8 py-3 rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            {t("celeb.awesome")}
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════
// Inline step confetti — smaller burst
// ═══════════════════════════════════════
export function StepConfetti({ targetEl }) {
  const [burst, setBurst] = useState(null);

  useEffect(() => {
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      const t = setTimeout(() => setBurst(null), 1000);
      return () => clearTimeout(t);
    }
  }, [targetEl]);

  if (!burst) return null;
  return <ConfettiBurst x={burst.x} y={burst.y} count={12} />;
}

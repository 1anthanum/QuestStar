import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import RichModalBackdrop from "./RichModalBackdrop";

// ═══════════════════════════════════════════════════════════
// PRNEnactment — each Emergency Toolbox tool gets a real enactment.
// ═══════════════════════════════════════════════════════════
//
// R13-N1: tapping a tool button in PRNToolbox no longer just records a
// counter and falls silent. It opens this full-screen overlay with a
// tool-specific interaction:
//
//   prn_pause_90s   → 90-second box-breathing animation (4-4-6 cycle)
//   prn_go_outside  → 5-minute outdoor countdown with reminder text
//   prn_cold_water  → 30-second cold-water exposure timer
//   prn_change_room → instruction card + Done
//   prn_eye_drops   → instruction card + Done
//   prn_safe_person → list of saved safe contacts (localStorage) with
//                      tel: / sms: action; add/remove inline
//   prn_song        → saved song link (localStorage), tap to open;
//                      empty-state prompts to set the URL
//   prn_write_first → textarea for venting; Done closes (no save —
//                      the writing IS the regulation)

export default function PRNEnactment({ tool, onDone, theme }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  if (!tool) return null;
  const id = tool.id;

  let body = null;
  if (id === "prn_pause_90s") body = <BreathingPause onDone={onDone} accent={accent} />;
  else if (id === "prn_go_outside") body = <SimpleTimer seconds={5 * 60} labelKey="prn.act.outside.label" subKey="prn.act.outside.sub" onDone={onDone} accent={accent} />;
  else if (id === "prn_cold_water") body = <SimpleTimer seconds={30} labelKey="prn.act.cold.label" subKey="prn.act.cold.sub" onDone={onDone} accent={accent} />;
  else if (id === "prn_change_room") body = <Instruction icon="🚶" titleKey="prn.act.changeRoom.label" subKey="prn.act.changeRoom.sub" onDone={onDone} accent={accent} />;
  else if (id === "prn_eye_drops") body = <Instruction icon="💧" titleKey="prn.act.eye.label" subKey="prn.act.eye.sub" onDone={onDone} accent={accent} />;
  else if (id === "prn_safe_person") body = <SafePerson onDone={onDone} accent={accent} t={t} lang={lang} />;
  else if (id === "prn_song") body = <SongLink onDone={onDone} accent={accent} t={t} />;
  else if (id === "prn_write_first") body = <WriteVent onDone={onDone} accent={accent} t={t} />;
  else body = <Instruction icon={tool.icon} titleKey={null} title={lang === "zh" ? tool.text : (tool.textEn || tool.text)} onDone={onDone} accent={accent} />;

  return (
    <div className="fixed inset-0 z-[65] overflow-y-auto">
      <RichModalBackdrop accent={accent} zIndex={0} />
      <div className="relative min-h-full flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-md flex justify-end mb-2">
          <button onClick={onDone} className="text-[12px] font-bold text-gray-500 px-3 py-1.5 rounded-full bg-white/80 shadow-sm active:scale-95 transition-transform">
            {t("prn.act.close")}
          </button>
        </div>
        <div className="w-full max-w-md">{body}</div>
      </div>
    </div>
  );
}

// ── Box breathing — 4s inhale · 4s hold · 6s exhale (≈14s/cycle, ~6.4 cycles in 90s) ──
function BreathingPause({ onDone, accent }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const TOTAL = 90; // seconds
  const [left, setLeft] = useState(TOTAL);
  const [phase, setPhase] = useState("inhale"); // inhale | hold | exhale

  // Countdown tick
  useEffect(() => {
    if (left <= 0) { onDone(); return undefined; }
    const tm = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(tm);
  }, [left, onDone]);

  // Breathing-phase cycler
  useEffect(() => {
    if (reduce) return undefined;
    const cycle = () => {
      setPhase("inhale");
      setTimeout(() => setPhase("hold"), 4000);
      setTimeout(() => setPhase("exhale"), 8000);
    };
    cycle();
    const id = setInterval(cycle, 14000);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="text-center">
      <div className="text-[13px] font-bold text-gray-500 mb-2">{t("prn.act.pause.title")}</div>
      <div className="text-[11px] text-gray-400 mb-6">{t("prn.act.pause.sub")}</div>

      {/* Breath orb: scales between 0.55 (exhaled) and 1 (inhaled) over the cycle */}
      <div className="relative mx-auto mb-6" style={{ width: 220, height: 220 }}>
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${accent}55 0%, ${accent}22 50%, transparent 75%)` }}
          animate={reduce ? { scale: 0.8 } : { scale: [0.55, 1, 1, 0.55] }}
          transition={reduce ? { duration: 0 } : { duration: 14, repeat: Infinity, ease: "easeInOut", times: [0, 0.286, 0.572, 1] }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[40px] font-black tabular-nums" style={{ color: accent }}>{left}</div>
          <div className="text-[14px] font-bold text-gray-600 mt-1">{t(`prn.act.pause.${phase}`)}</div>
        </div>
      </div>

      <button
        onClick={onDone}
        className="text-[13px] font-bold px-5 py-2.5 rounded-full text-white shadow-md active:scale-95 transition-transform"
        style={{ background: accent }}
      >
        {t("prn.act.doneEarly")}
      </button>
    </div>
  );
}

// ── Generic countdown with progress + Done early ──
function SimpleTimer({ seconds, labelKey, subKey, onDone, accent }) {
  const { t } = useLanguage();
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onDone(); return undefined; }
    const tm = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(tm);
  }, [left, onDone]);
  const pct = ((seconds - left) / seconds) * 100;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="text-center">
      <div className="text-[15px] font-black text-gray-800 mb-1.5">{t(labelKey)}</div>
      {subKey && <div className="text-[12px] text-gray-500 mb-6">{t(subKey)}</div>}
      <div className="relative mx-auto mb-6" style={{ width: 220, height: 220 }}>
        <svg width="220" height="220" className="-rotate-90">
          <circle cx="110" cy="110" r="100" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx="110" cy="110" r="100" fill="none" stroke={accent} strokeWidth="8"
            strokeDasharray={2 * Math.PI * 100}
            strokeDashoffset={2 * Math.PI * 100 * (1 - pct / 100)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[42px] font-black tabular-nums" style={{ color: accent }}>
            {seconds >= 60 ? `${mm}:${ss}` : left}
          </div>
        </div>
      </div>
      <button onClick={onDone} className="text-[13px] font-bold px-5 py-2.5 rounded-full text-white shadow-md active:scale-95 transition-transform" style={{ background: accent }}>
        {t("prn.act.doneEarly")}
      </button>
    </div>
  );
}

// ── Single-step instruction (change room, eye drops) ──
function Instruction({ icon, titleKey, title, subKey, onDone, accent }) {
  const { t } = useLanguage();
  return (
    <div className="text-center">
      <div className="text-7xl mb-5">{icon}</div>
      <div className="text-[20px] font-black text-gray-800 mb-2 leading-snug">
        {titleKey ? t(titleKey) : title}
      </div>
      {subKey && <div className="text-[13px] text-gray-500 mb-7 leading-relaxed">{t(subKey)}</div>}
      <button onClick={onDone} className="px-6 py-3 rounded-full text-[14px] font-black text-white shadow-md active:scale-95 transition-transform" style={{ background: accent }}>
        ✓ {t("prn.act.done")}
      </button>
    </div>
  );
}

// ── Safe person: list of saved contacts with tel:/sms: actions, inline add/remove ──
function SafePerson({ onDone, accent, t, lang }) {
  const [contacts, setContacts] = useLocalStorage("qt_safe_contacts", []); // [{ name, phone }]
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const save = () => {
    const n = name.trim(); const p = phone.trim();
    if (!n || !p) return;
    setContacts((cs) => [...cs, { name: n, phone: p }]);
    setName(""); setPhone(""); setAdding(false);
  };
  return (
    <div>
      <div className="text-center mb-5">
        <div className="text-5xl mb-2">🫂</div>
        <div className="text-[18px] font-black text-gray-800">{t("prn.act.safe.title")}</div>
        <div className="text-[12px] text-gray-500 mt-1">{t("prn.act.safe.sub")}</div>
      </div>
      {contacts.length === 0 && !adding && (
        <div className="rounded-2xl bg-white shadow-sm p-4 text-center">
          <div className="text-[13px] text-gray-500 mb-3">{t("prn.act.safe.empty")}</div>
          <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-full text-[12.5px] font-bold text-white" style={{ background: accent }}>
            + {t("prn.act.safe.addFirst")}
          </button>
        </div>
      )}
      <div className="space-y-2 mb-3">
        {contacts.map((c, i) => (
          <div key={i} className="rounded-xl bg-white shadow-sm p-3 flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-gray-800 truncate">{c.name}</div>
              <div className="text-[11px] text-gray-400 truncate">{c.phone}</div>
            </div>
            <a href={`tel:${encodeURIComponent(c.phone)}`} className="text-[11px] font-bold px-2.5 py-1.5 rounded-full text-white" style={{ background: accent }} onClick={onDone}>
              📞 {t("prn.act.safe.call")}
            </a>
            <a href={`sms:${encodeURIComponent(c.phone)}`} className="text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-700" onClick={onDone}>
              💬 {t("prn.act.safe.sms")}
            </a>
            <button onClick={() => setContacts((cs) => cs.filter((_, j) => j !== i))} className="text-gray-300 hover:text-gray-500 text-[14px]">✕</button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="rounded-xl bg-white shadow-sm p-3 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("prn.act.safe.name")} className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("prn.act.safe.phone")} type="tel" className="w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none" />
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 py-2 rounded-lg text-[12.5px] font-bold text-white" style={{ background: accent }}>{t("prn.act.safe.save")}</button>
            <button onClick={() => { setAdding(false); setName(""); setPhone(""); }} className="px-3 py-2 rounded-lg text-[12.5px] font-bold text-gray-500 bg-gray-100">{t("prn.act.cancel")}</button>
          </div>
        </div>
      ) : contacts.length > 0 ? (
        <button onClick={() => setAdding(true)} className="w-full py-2 rounded-lg text-[12px] font-bold text-gray-500 bg-gray-100">+ {t("prn.act.safe.addMore")}</button>
      ) : null}
    </div>
  );
}

// ── Song link: opens a saved song URL; empty-state prompts to set one ──
function SongLink({ onDone, accent, t }) {
  const [url, setUrl] = useLocalStorage("qt_prn_song_url", "");
  const [draft, setDraft] = useState(url);
  const save = () => { setUrl(draft.trim()); };
  const valid = (s) => /^https?:\/\//i.test(s.trim());
  return (
    <div className="text-center">
      <div className="text-7xl mb-3">🎵</div>
      <div className="text-[18px] font-black text-gray-800 mb-1.5">{t("prn.act.song.title")}</div>
      {url ? (
        <>
          <div className="text-[12px] text-gray-500 mb-5 truncate">{url}</div>
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={onDone}
            className="inline-block px-5 py-2.5 rounded-full text-[14px] font-black text-white shadow-md" style={{ background: accent }}>
            🎵 {t("prn.act.song.open")}
          </a>
          <div className="mt-4 flex gap-2 items-center justify-center">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("prn.act.song.placeholder")} className="text-[12px] px-3 py-1.5 rounded-lg border border-gray-200 outline-none w-56" />
            <button onClick={save} disabled={!valid(draft)} className="text-[12px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: valid(draft) ? accent : "#cbd5e1" }}>{t("prn.act.song.change")}</button>
          </div>
        </>
      ) : (
        <>
          <div className="text-[12.5px] text-gray-500 mb-4 px-2">{t("prn.act.song.empty")}</div>
          <div className="flex gap-2 items-center justify-center">
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("prn.act.song.placeholder")} className="text-[13px] px-3 py-2 rounded-lg border border-gray-200 outline-none flex-1 max-w-xs" />
            <button onClick={save} disabled={!valid(draft)} className="text-[13px] font-bold px-3 py-2 rounded-full text-white" style={{ background: valid(draft) ? accent : "#cbd5e1" }}>{t("prn.act.song.save")}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Write before responding — venting space, intentionally not persisted ──
function WriteVent({ onDone, accent, t }) {
  const [text, setText] = useState("");
  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-5xl mb-2">📝</div>
        <div className="text-[18px] font-black text-gray-800">{t("prn.act.write.title")}</div>
        <div className="text-[12px] text-gray-500 mt-1 px-4">{t("prn.act.write.sub")}</div>
      </div>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("prn.act.write.placeholder")}
        rows={8}
        className="w-full text-[14px] leading-relaxed px-4 py-3 rounded-2xl border border-gray-200 outline-none bg-white shadow-sm resize-none"
      />
      <div className="text-[10.5px] text-gray-400 text-center mt-2 mb-4">{t("prn.act.write.note")}</div>
      <button onClick={onDone} className="w-full py-3 rounded-2xl text-[14px] font-black text-white shadow-md" style={{ background: accent }}>
        ✓ {t("prn.act.done")}
      </button>
    </div>
  );
}

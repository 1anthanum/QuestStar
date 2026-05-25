import { useState, useEffect } from "react";
import { useLanguage } from "../hooks/useLanguage";

// ── PWAInstallPrompt — dismissible "add to home screen" banner ──
// Uses the beforeinstallprompt event (Chrome/Edge/Android). Hidden if already
// installed or previously dismissed. iOS Safari has no event → no banner there
// (users install via Share → Add to Home Screen; QuickTrack covers native iOS).
export default function PWAInstallPrompt({ theme }) {
  const { t } = useLanguage();
  const accent = theme?.accent || "#6366f1";
  const [deferred, setDeferred] = useState(null);
  const [hidden, setHidden] = useState(
    () => localStorage.getItem("qt_pwa_dismissed") === "1"
  );

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred || hidden) return null;

  const install = async () => {
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* noop */ }
    setDeferred(null);
  };
  const dismiss = () => {
    localStorage.setItem("qt_pwa_dismissed", "1");
    setHidden(true);
  };

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[70] w-[min(92vw,420px)] animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow-2xl border border-gray-100">
        <span className="text-2xl">📲</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-black text-gray-800">{t("pwa.title")}</div>
          <div className="text-[11px] text-gray-500">{t("pwa.subtitle")}</div>
        </div>
        <button
          onClick={install}
          className="shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-full text-white"
          style={{ background: theme?.btnGrad || accent }}
        >
          {t("pwa.install")}
        </button>
        <button onClick={dismiss} className="shrink-0 text-gray-300 hover:text-gray-500 text-sm">✕</button>
      </div>
    </div>
  );
}

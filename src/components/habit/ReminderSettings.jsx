import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { requestNotifyPermission, notifySupported, notifyAll } from "../../utils/notify";

// ── ReminderSettings — configure habit reminder channels (browser + webhook) ──
export default function ReminderSettings({ onClose, theme, habits }) {
  const { t, lang } = useLanguage();
  const accent = theme?.accent || "#6366f1";

  const [enabled, setEnabled] = useLocalStorage("qt_notify_enabled", false);
  const [webhook, setWebhook] = useLocalStorage("qt_notify_webhook", "");
  const [time, setTime] = useLocalStorage("qt_notify_time", "20:00");
  const [weekly, setWeekly] = useLocalStorage("qt_notify_weekly", false);
  const [perm, setPerm] = useState(notifySupported() ? Notification.permission : "unsupported");
  const [tested, setTested] = useState(false);
  const [shared, setShared] = useState(false);

  const sendWeeklyNow = async () => {
    const r = habits?.getWeeklyReport?.() || {};
    const pct = Math.round((r.rate || 0) * 100);
    await notifyAll({
      title: lang === "zh" ? "🌱 本周回顾" : "🌱 Weekly recap",
      body: lang === "zh"
        ? `本周完成率 ${pct}% · ${r.totalCompleted || 0}/${r.totalPossible || 0}`
        : `This week: ${pct}% · ${r.totalCompleted || 0}/${r.totalPossible || 0}`,
      webhookUrl: webhook,
      tag: "qt-weekly-now",
    });
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  };

  const toggleBrowser = async () => {
    if (!enabled) {
      const result = await requestNotifyPermission();
      setPerm(result);
      setEnabled(result === "granted");
    } else {
      setEnabled(false);
    }
  };

  const sendTest = async () => {
    await notifyAll({
      title: lang === "zh" ? "🔔 测试提醒" : "🔔 Test reminder",
      body: lang === "zh" ? "提醒已配置成功。" : "Reminders are set up correctly.",
      webhookUrl: webhook,
      tag: "qt-test",
    });
    setTested(true);
    setTimeout(() => setTested(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-gray-800">🔔 {t("habit.notify.title")}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">✕</button>
        </div>

        {/* Browser notifications */}
        <button onClick={toggleBrowser} className="w-full flex items-center gap-2 px-3 py-3 rounded-xl bg-gray-50 mb-3">
          <span
            className="w-9 h-5 rounded-full relative transition-colors shrink-0"
            style={{ background: enabled ? accent : "#cbd5e1" }}
          >
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: enabled ? 18 : 2 }} />
          </span>
          <div className="flex-1 text-left">
            <div className="text-[13px] font-bold text-gray-700">{t("habit.notify.browser")}</div>
            <div className="text-[10.5px] text-gray-400">
              {perm === "unsupported" ? t("habit.notify.unsupported") : perm === "denied" ? t("habit.notify.denied") : t("habit.notify.browserHint")}
            </div>
          </div>
        </button>

        {/* Reminder time */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 mb-3">
          <span className="text-[13px] font-bold text-gray-700 flex-1">⏰ {t("habit.notify.time")}</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-[13px] outline-none"
          />
        </div>

        {/* Weekly digest */}
        <button onClick={() => setWeekly((w) => !w)} className="w-full flex items-center gap-2 px-3 py-3 rounded-xl bg-gray-50 mb-3">
          <span className="w-9 h-5 rounded-full relative transition-colors shrink-0" style={{ background: weekly ? accent : "#cbd5e1" }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: weekly ? 18 : 2 }} />
          </span>
          <div className="flex-1 text-left">
            <div className="text-[13px] font-bold text-gray-700">{t("habit.notify.weekly")}</div>
            <div className="text-[10.5px] text-gray-400">{t("habit.notify.weeklyHint")}</div>
          </div>
        </button>

        {/* Webhook */}
        <div className="mb-4">
          <label className="text-[13px] font-bold text-gray-700">🔗 {t("habit.notify.webhook")}</label>
          <input
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="https://hooks.slack.com/… / Zapier / Discord"
            className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2 text-[12px] outline-none"
            style={{ border: `1px solid ${accent}20` }}
          />
          <p className="text-[10.5px] text-gray-400 mt-1 leading-snug">{t("habit.notify.webhookHint")}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={sendTest}
            disabled={!enabled && !webhook}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40"
            style={{ background: `${accent}15`, color: accent }}
          >
            {tested ? `✓ ${t("habit.notify.sent")}` : t("habit.notify.test")}
          </button>
          {webhook && habits && (
            <button
              onClick={sendWeeklyNow}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold"
              style={{ background: `${accent}15`, color: accent }}
            >
              {shared ? `✓ ${t("habit.notify.sent")}` : `📤 ${t("habit.notify.shareNow")}`}
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-3 leading-snug">{t("habit.notify.limitation")}</p>
      </div>
    </div>
  );
}

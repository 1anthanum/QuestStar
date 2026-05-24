import { useEffect, useRef } from "react";
import { notifyAll } from "../utils/notify";

// ═══════════════════════════════════════════════════════════
// useHabitReminders — fires a daily habit reminder while the app is open
// ═══════════════════════════════════════════════════════════
//
// Reads qt_notify_* settings fresh from localStorage each tick (avoids stale
// closures). When the clock passes the configured time and habits remain
// incomplete, it fires browser + webhook channels once per day.
//
// Limitation: client-only, so it only fires while a tab is open. For true
// push you'd need a service worker / server — documented as future work.

const TICK_MS = 60000; // check once a minute

function readSettings() {
  const get = (k, d) => {
    try {
      const v = localStorage.getItem(k);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  };
  return {
    enabled: get("qt_notify_enabled", false),
    webhook: get("qt_notify_webhook", ""),
    time: get("qt_notify_time", "20:00"),
  };
}

const todayKey = () => new Date().toISOString().split("T")[0];

export function useHabitReminders({ habits, appMode, lang = "zh" }) {
  const firingRef = useRef(false);

  useEffect(() => {
    if (appMode !== "life") return undefined;

    const check = async () => {
      if (firingRef.current) return;
      const { enabled, webhook, time } = readSettings();
      if (!enabled && !webhook) return;

      // Already notified today?
      let last = null;
      try { last = JSON.parse(localStorage.getItem("qt_notify_last") || "null"); } catch { /* noop */ }
      const today = todayKey();
      if (last === today) return;

      // Past the configured time?
      const [h, m] = String(time).split(":").map((n) => parseInt(n, 10));
      const now = new Date();
      const target = new Date();
      target.setHours(h || 20, m || 0, 0, 0);
      if (now < target) return;

      // Anything left to do?
      const view = habits.getTodayView?.() || [];
      const remaining = view.filter((v) => !v.done).length;
      if (remaining === 0) return;

      firingRef.current = true;
      const title = lang === "zh" ? "🌱 今日习惯提醒" : "🌱 Habit reminder";
      const body =
        lang === "zh"
          ? `还有 ${remaining} 件没完成 —— 做一件小事也算数。`
          : `${remaining} habit(s) left — even one small step counts.`;
      try {
        await notifyAll({ title, body, webhookUrl: webhook, tag: "qt-habit-reminder" });
        localStorage.setItem("qt_notify_last", JSON.stringify(today));
      } finally {
        firingRef.current = false;
      }
    };

    check();
    const id = setInterval(check, TICK_MS);
    return () => clearInterval(id);
  }, [habits, appMode, lang]);
}

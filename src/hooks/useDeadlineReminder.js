import { useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysUntil(dateStr) {
  const today = new Date(getTodayStr());
  const target = new Date(dateStr);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

/**
 * 检查所有 Quest/Step 的 deadline，通过浏览器 Notification API 提醒用户
 * 提醒规则：到期前一天、当天、逾期（每个 deadline 每天只提醒一次）
 */
export function useDeadlineReminder(quests) {
  const [notified, setNotified] = useLocalStorage("qt_deadline_notified", {});

  const checkDeadlines = useCallback(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
      return;
    }
    if (Notification.permission !== "granted") return;

    const today = getTodayStr();
    const newNotified = { ...notified };
    let changed = false;

    const sendNotification = (title, body, itemKey) => {
      const notifKey = `${itemKey}_${today}`;
      if (newNotified[notifKey]) return; // 已通知过
      try {
        new Notification(title, {
          body,
          icon: "📅",
          tag: notifKey,
        });
      } catch {
        // Service worker not available fallback — silent
      }
      newNotified[notifKey] = true;
      changed = true;
    };

    for (const quest of quests) {
      const allDone = quest.steps.every((s) => s.done);

      // Quest-level deadline
      if (quest.deadline && !allDone) {
        const days = daysUntil(quest.deadline);
        if (days === 1) {
          sendNotification("⏰ Quest Due Tomorrow", `"${quest.name}" is due tomorrow!`, `q_${quest.id}`);
        } else if (days === 0) {
          sendNotification("🔔 Quest Due Today!", `"${quest.name}" is due today!`, `q_${quest.id}`);
        } else if (days < 0) {
          sendNotification("🔴 Quest Overdue!", `"${quest.name}" is ${Math.abs(days)} day(s) overdue!`, `q_${quest.id}`);
        }
      }

      // Step-level deadlines
      for (const step of quest.steps) {
        if (step.deadline && !step.done) {
          const days = daysUntil(step.deadline);
          if (days === 1) {
            sendNotification("⏰ Step Due Tomorrow", `"${step.text}" (${quest.name}) is due tomorrow!`, `s_${step.id}`);
          } else if (days === 0) {
            sendNotification("🔔 Step Due Today!", `"${step.text}" (${quest.name}) is due today!`, `s_${step.id}`);
          } else if (days < 0) {
            sendNotification("🔴 Step Overdue!", `"${step.text}" (${quest.name}) is ${Math.abs(days)} day(s) overdue!`, `s_${step.id}`);
          }
        }
      }
    }

    if (changed) {
      // 清理 7 天前的旧记录
      const cleanedNotified = {};
      for (const [key, val] of Object.entries(newNotified)) {
        const datePart = key.split("_").pop();
        if (datePart && daysUntil(datePart) >= -7) {
          cleanedNotified[key] = val;
        }
      }
      setNotified(cleanedNotified);
    }
  }, [quests, notified, setNotified]);

  // 启动时检查 + 每小时检查
  useEffect(() => {
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkDeadlines]);

  // 提供手动请求通知权限的方法
  const requestPermission = useCallback(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return { requestPermission };
}

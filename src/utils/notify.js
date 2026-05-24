// ═══════════════════════════════════════════════════════════
// notify.js — multi-channel reminders (in-app / browser / webhook)
// ═══════════════════════════════════════════════════════════
//
// Channels:
//   • browser  — Web Notifications API (works while a tab is open / backgrounded)
//   • webhook  — POST to a user-provided URL: Slack/Discord incoming webhooks,
//                or a relay (Zapier/Make/IFTTT) that forwards to EMAIL/SMS.
//                Cross-origin webhooks are sent fire-and-forget (no-cors).
//   • in-app   — handled by the caller (render a banner); not in this module.
//
// Email note: browsers can't send email directly. Configure a webhook that points
// at a relay (e.g. Zapier "Catch Hook" → Email by Zapier) to get email/Slack.

export function notifySupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotifyPermission() {
  if (!notifySupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function canNotifyBrowser() {
  return notifySupported() && Notification.permission === "granted";
}

export function notifyBrowser(title, body, { tag } = {}) {
  if (!canNotifyBrowser()) return false;
  try {
    new Notification(title, { body, tag, icon: "/icon.png" });
    return true;
  } catch {
    return false;
  }
}

/**
 * POST to a webhook. Slack/Discord incoming webhooks accept { text }.
 * Cross-origin endpoints usually block CORS reads, so we send no-cors
 * (fire-and-forget): the request is delivered but the response is opaque.
 */
export async function postWebhook(url, text, extra = {}) {
  if (!url) return false;
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, ...extra }),
    });
    return true;
  } catch {
    return false;
  }
}

/** Fire all configured channels for one reminder. Returns which fired. */
export async function notifyAll({ title, body, webhookUrl, tag }) {
  const browser = notifyBrowser(title, body, { tag });
  const webhook = webhookUrl ? await postWebhook(webhookUrl, `*${title}*\n${body}`) : false;
  return { browser, webhook };
}

/**
 * Claude API endpoint selection.
 *
 * Three modes (in priority order):
 *   1) PROXY mode  — VITE_PROXY_URL is set
 *      Calls our Cloudflare Worker. The worker injects the real Anthropic key.
 *      Browser sends X-Access-Password from localStorage or env var.
 *   2) DEV mode    — running under `vite dev`
 *      Calls /api/claude/v1/messages, which Vite proxies to api.anthropic.com.
 *   3) DIRECT mode — anything else (e.g. legacy `npm run build` without proxy)
 *      Calls api.anthropic.com directly with the user's own key.
 */

export function hasProxy() {
  return Boolean(import.meta.env.VITE_PROXY_URL);
}

export function getClaudeEndpoint() {
  if (hasProxy()) {
    return import.meta.env.VITE_PROXY_URL.replace(/\/$/, "") + "/v1/messages";
  }
  if (import.meta.env.DEV) {
    return "/api/claude/v1/messages";
  }
  return "https://api.anthropic.com/v1/messages";
}

function getAccessPassword() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage?.getItem("ofe_access_password") ||
    import.meta.env.VITE_ACCESS_PASSWORD ||
    ""
  );
}

export function getClaudeHeaders(resolvedKey) {
  if (hasProxy()) {
    return {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "X-Access-Password": getAccessPassword(),
    };
  }
  return {
    "Content-Type": "application/json",
    "x-api-key": resolvedKey,
    "anthropic-version": "2023-06-01",
    ...(import.meta.env.DEV ? {} : { "anthropic-dangerous-direct-browser-access": "true" }),
  };
}

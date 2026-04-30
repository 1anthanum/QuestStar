import { useState, useEffect } from "react";

/**
 * Lightweight password gate.
 *
 * Only active when VITE_PROXY_URL is set (i.e. shared-key deployment).
 * Stores the password in localStorage so users only enter it once per device.
 * No hashing — this is friction control, not a security boundary.
 * Real protection lives in the Cloudflare Worker.
 */
export default function PasswordGate({ children }) {
  const proxyEnabled = Boolean(import.meta.env.VITE_PROXY_URL);
  const stored =
    typeof window !== "undefined"
      ? window.localStorage.getItem("ofe_access_password")
      : "";

  const [unlocked, setUnlocked] = useState(!proxyEnabled || Boolean(stored));
  const [input, setInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  // Auto-unlock on env-injected password during dev or pre-shared link
  useEffect(() => {
    if (!proxyEnabled) return;
    if (stored) return;
    const fromEnv = import.meta.env.VITE_ACCESS_PASSWORD;
    if (fromEnv) {
      window.localStorage.setItem("ofe_access_password", fromEnv);
      setUnlocked(true);
    }
  }, []);

  if (unlocked) return children;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setVerifying(true);
    setError("");

    try {
      const proxy = import.meta.env.VITE_PROXY_URL.replace(/\/$/, "");
      // Lightweight ping: send a no-op to /v1/messages with the password.
      // Anthropic will likely 400 (bad body), but the proxy returns 401 first
      // if the password is wrong — so we can distinguish.
      const r = await fetch(proxy + "/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "X-Access-Password": input.trim(),
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1,
          messages: [{ role: "user", content: "." }],
        }),
      });

      if (r.status === 401) {
        setError("Wrong password. Ask Jacie for the right one.");
      } else {
        // 200, 400, 429 — all mean "password accepted, request reached Anthropic / hit rate"
        window.localStorage.setItem("ofe_access_password", input.trim());
        setUnlocked(true);
      }
    } catch (err) {
      setError("Network error. Is the proxy URL correct?");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 30% 30%, #1a1f3a 0%, #0a0e1f 80%)",
        color: "#e8ecff",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "min(420px, 90vw)",
          padding: "32px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          backdropFilter: "blur(16px)",
        }}
      >
        <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
          🌟 QuestStar
        </div>
        <div style={{ fontSize: "13px", opacity: 0.7, marginBottom: "20px" }}>
          Private alpha — enter the access password to continue.
        </div>

        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Access password"
          style={{
            width: "100%",
            padding: "12px 14px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            color: "#e8ecff",
            fontSize: "15px",
            outline: "none",
          }}
        />

        {error && (
          <div
            style={{
              marginTop: "10px",
              fontSize: "13px",
              color: "#ff8888",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={verifying || !input.trim()}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg,#6c63ff,#3aa0ff)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: verifying ? "wait" : "pointer",
            opacity: verifying || !input.trim() ? 0.6 : 1,
          }}
        >
          {verifying ? "Verifying…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

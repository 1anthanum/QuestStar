import { useState, useRef } from "react";
import { THEMES } from "../utils/constants";
import { AI_PROVIDERS, PROVIDER_ORDER } from "../utils/aiProviders";
import { useLanguage } from "../hooks/useLanguage";

export default function SettingsPanel({ ai, themeCtx, onExport, onImport, onReset, onClose }) {
  const { t, lang, setLang } = useLanguage();
  const [showKey, setShowKey] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const fileRef = useRef(null);

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quest-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const success = onImport(ev.target.result);
      setImportStatus(success ? t("settings.importSuccess") : t("settings.importFail"));
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleTestConnection = async () => {
    setTesting(true);
    await ai.testConnection();
    setTesting(false);
  };

  const currentProvider = AI_PROVIDERS[ai.aiProvider];
  const accent = themeCtx?.theme.accent || "#6366f1";
  const btnGrad = themeCtx?.theme.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)";
  const accentLight = themeCtx?.theme.accentLight || "#f5f3ff";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto animate-scale-in">
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
          {t("settings.title")}
        </h2>

        <div className="space-y-6">
          {/* ── Language Toggle ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2.5">{t("settings.language")}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setLang("en")}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                  lang === "en"
                    ? "text-white"
                    : "text-gray-500 border-gray-200 hover:border-gray-300 bg-white"
                }`}
                style={lang === "en" ? { borderColor: accent, background: btnGrad } : {}}
              >
                🇺🇸 English
              </button>
              <button
                onClick={() => setLang("zh")}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                  lang === "zh"
                    ? "text-white"
                    : "text-gray-500 border-gray-200 hover:border-gray-300 bg-white"
                }`}
                style={lang === "zh" ? { borderColor: accent, background: btnGrad } : {}}
              >
                🇨🇳 中文
              </button>
            </div>
          </div>

          {/* ── Theme Picker ── */}
          {themeCtx && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2.5">{t("settings.theme")}</label>
              <div className="flex gap-2.5 flex-wrap">
                {Object.values(THEMES).map((thm) => (
                  <button
                    key={thm.id}
                    onClick={() => themeCtx.setTheme(thm.id)}
                    className={`group relative w-12 h-12 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95
                      ${themeCtx.themeId === thm.id
                        ? "ring-2 ring-offset-2 scale-110 shadow-lg"
                        : "hover:shadow-md"
                      }
                    `}
                    style={{
                      background: thm.btnGrad,
                      ringColor: thm.accent,
                      "--tw-ring-color": thm.accent,
                    }}
                    title={`${thm.emoji} ${thm.name}`}
                  >
                    <span className="text-lg">{thm.emoji}</span>
                    {themeCtx.themeId === thm.id && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-[10px]">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {t("settings.themeCurrent")}: {themeCtx.theme.emoji} {themeCtx.theme.name}
              </p>
            </div>
          )}

          {/* ── AI Provider Selection ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">{t("settings.aiProvider")}</label>
            <div className="grid grid-cols-2 gap-2 mb-1.5">
              {PROVIDER_ORDER.map((pid) => {
                const prov = AI_PROVIDERS[pid];
                const isActive = ai.aiProvider === pid;
                return (
                  <button
                    key={pid}
                    onClick={() => ai.setAiProvider(pid)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border-2 text-left ${
                      isActive
                        ? "text-white shadow-md"
                        : "text-gray-500 border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                    style={isActive ? { borderColor: accent, background: btnGrad } : {}}
                  >
                    <span className="mr-1.5">{prov.icon}</span>
                    {prov.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400">{t("settings.providerHint")}</p>
          </div>

          {/* ── API Key for current provider ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              {currentProvider.icon} {currentProvider.label} — {t("settings.apiKey")}
            </label>

            {ai.keySource === "env" ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                  <span>✅</span> {t("settings.apiKeyLoaded")}
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  {t("settings.apiKeyEnvHint")}
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type={showKey ? "text" : "password"}
                    value={ai.manualApiKey}
                    onChange={(e) => ai.setManualApiKey(e.target.value)}
                    placeholder={ai.aiProvider === "claude" ? "sk-ant-..." : "your-api-key..."}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-violet-400 focus:outline-none text-sm font-mono"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="px-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    {showKey ? t("settings.apiKeyHide") : t("settings.apiKeyShow")}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {t("settings.apiKeyManualHint")}
                </p>
              </>
            )}

            {/* Test Connection */}
            {ai.hasApiKey && (
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  {testing ? t("settings.testing") : t("settings.testBtn")}
                </button>
                {ai.testResult && !testing && (
                  <span className={`text-xs font-semibold ${ai.testResult.success ? "text-emerald-600" : "text-red-500"}`}>
                    {ai.testResult.success ? t("settings.testSuccess") : `${t("settings.testFail")}: ${ai.testResult.error || ""}`}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Model selection for current provider ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t("settings.modelLabel")}</label>
            <div className="space-y-2">
              {currentProvider.models.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2"
                  style={ai.aiModel === m.id ? {
                    borderColor: accent,
                    background: accentLight,
                  } : {
                    borderColor: "#f3f4f6",
                  }}
                >
                  <input
                    type="radio"
                    name="model"
                    checked={ai.aiModel === m.id}
                    onChange={() => ai.setAiModel(m.id)}
                    style={{ accentColor: accent }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{m.label}</div>
                    <div className="text-xs text-gray-400">{m.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Known Domain */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              {t("settings.domainLabel")}
            </label>
            <input
              value={ai.knownDomain}
              onChange={(e) => ai.setKnownDomain(e.target.value)}
              placeholder={t("settings.domainPlaceholder")}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              {t("settings.domainHint")}
            </p>
          </div>

          {/* Data management */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-3">{t("settings.dataLabel")}</label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleExport}
                className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-all"
              >
                {t("settings.export")}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition-all"
              >
                {t("settings.import")}
              </button>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
            {importStatus && (
              <div className="text-xs text-center text-gray-500 mb-2">{importStatus}</div>
            )}
            <button
              onClick={() => {
                if (window.confirm(t("settings.resetConfirm"))) {
                  onReset();
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-all"
            >
              {t("settings.reset")}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl font-semibold transition-all text-white"
          style={{ background: btnGrad }}
        >
          {t("settings.close")}
        </button>
      </div>
    </div>
  );
}

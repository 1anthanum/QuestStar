import { useState, useRef } from "react";
import { AI_MODELS, THEMES } from "../utils/constants";

export default function SettingsPanel({ ai, themeCtx, onExport, onImport, onReset, onClose }) {
  const [showKey, setShowKey] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
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
      setImportStatus(success ? "导入成功！" : "导入失败，文件格式不正确");
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto animate-scale-in">
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <span>⚙️</span> 设置
        </h2>

        <div className="space-y-6">
          {/* ── Theme Picker ── */}
          {themeCtx && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2.5">🎨 主题色</label>
              <div className="flex gap-2.5 flex-wrap">
                {Object.values(THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => themeCtx.setTheme(t.id)}
                    className={`group relative w-12 h-12 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95
                      ${themeCtx.themeId === t.id
                        ? "ring-2 ring-offset-2 scale-110 shadow-lg"
                        : "hover:shadow-md"
                      }
                    `}
                    style={{
                      background: t.btnGrad,
                      ringColor: t.accent,
                      "--tw-ring-color": t.accent,
                    }}
                    title={`${t.emoji} ${t.name}`}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    {themeCtx.themeId === t.id && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-[10px]">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                当前：{themeCtx.theme.emoji} {themeCtx.theme.name}
              </p>
            </div>
          )}

          {/* API Key */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Claude API Key</label>

            {ai.keySource === "env" ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                  <span>✅</span> 已从 .env 文件读取
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  使用 VITE_CLAUDE_API_KEY 环境变量，无需手动输入
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type={showKey ? "text" : "password"}
                    value={ai.manualApiKey}
                    onChange={(e) => ai.setManualApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-violet-400 focus:outline-none text-sm font-mono"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="px-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    {showKey ? "隐藏" : "显示"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  推荐：在项目根目录创建 <code className="bg-gray-100 px-1 rounded">.env</code> 文件，添加 <code className="bg-gray-100 px-1 rounded">VITE_CLAUDE_API_KEY=你的key</code>
                </p>
              </>
            )}
          </div>

          {/* Known Domain */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              🔗 默认已知领域
            </label>
            <input
              value={ai.knownDomain}
              onChange={(e) => ai.setKnownDomain(e.target.value)}
              placeholder="例：烹饪、打游戏、音乐…"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              AI 拆解时会用你熟悉的领域做类比锚点，帮助理解新知识
            </p>
          </div>

          {/* Model selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">AI 模型</label>
            <div className="space-y-2">
              {Object.entries(AI_MODELS).map(([id, model]) => (
                <label
                  key={id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2"
                  style={ai.aiModel === id ? {
                    borderColor: themeCtx?.theme.accent || "#8b5cf6",
                    background: themeCtx?.theme.accentLight || "#f5f3ff",
                  } : {
                    borderColor: "#f3f4f6",
                  }}
                >
                  <input
                    type="radio"
                    name="model"
                    checked={ai.aiModel === id}
                    onChange={() => ai.setAiModel(id)}
                    style={{ accentColor: themeCtx?.theme.accent || "#8b5cf6" }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{model.label}</div>
                    <div className="text-xs text-gray-400">{model.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Data management */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-3">数据管理</label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleExport}
                className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-all"
              >
                📤 导出数据
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition-all"
              >
                📥 导入数据
              </button>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
            {importStatus && (
              <div className="text-xs text-center text-gray-500 mb-2">{importStatus}</div>
            )}
            <button
              onClick={() => {
                if (window.confirm("确定要重置所有数据吗？此操作不可撤销！")) {
                  onReset();
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-all"
            >
              🗑️ 重置所有数据
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl font-semibold transition-all text-white"
          style={{ background: themeCtx?.theme.btnGrad || "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          关闭
        </button>
      </div>
    </div>
  );
}

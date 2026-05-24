import { createContext, useContext, useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import translations from "../utils/translations";

// ID-18: 本文件刻意用 .jsx 扩展名 —— 它包含 JSX（LanguageProvider 组件）。
// 约定：含 JSX 的 hook 文件用 .jsx，纯逻辑 hook 用 .js；hook 一律具名导出。
const LanguageContext = createContext(null);

/**
 * Language Provider — wraps the app to provide i18n
 */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useLocalStorage("qt_language", "en");

  const t = useCallback(
    (key, params) => {
      const str = translations[lang]?.[key] || translations.en[key] || key;
      if (!params) return str;
      // Replace {param} placeholders
      return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
    },
    [lang]
  );

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "zh" : "en"));
  }, [setLang]);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

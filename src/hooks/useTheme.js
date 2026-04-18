import { useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { THEMES, DEFAULT_THEME } from "../utils/constants";

/**
 * 主题管理 Hook
 * - 从 localStorage 读取 / 保存主题选择
 * - 返回当前主题对象 + 切换方法
 * - 将 CSS 变量注入 :root，供全局使用
 */
export function useTheme() {
  const [themeId, setThemeId] = useLocalStorage("qt_theme", DEFAULT_THEME);

  // 确保 themeId 始终有效
  const safeId = THEMES[themeId] ? themeId : DEFAULT_THEME;
  const theme = THEMES[safeId];

  // 注入 CSS 变量到 :root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-hover", theme.accentHover);
    root.style.setProperty("--accent-light", theme.accentLight);
    root.style.setProperty("--accent-glow", theme.accentGlow);
    root.style.setProperty("--btn-grad", theme.btnGrad);
    root.style.setProperty("--btn-grad2", theme.btnGrad2);
    root.style.setProperty("--page-bg", theme.pageBg);
    // Orbs
    theme.orbs.forEach((c, i) => root.style.setProperty(`--orb-${i}`, c));
  }, [theme]);

  const cycleTheme = useCallback(() => {
    const ids = Object.keys(THEMES);
    const idx = ids.indexOf(safeId);
    const next = ids[(idx + 1) % ids.length];
    setThemeId(next);
  }, [safeId, setThemeId]);

  return {
    themeId: safeId,
    theme,
    setTheme: setThemeId,
    cycleTheme,
    allThemes: THEMES,
  };
}

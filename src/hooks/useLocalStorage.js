import { useState, useCallback } from "react";

/**
 * 带 localStorage 持久化的 useState
 * @param {string} key - localStorage 的 key
 * @param {*} initialValue - 初始值
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // ID-09 修复：用 item !== null 判定"键是否存在"，而非真值判断
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (err) {
      console.warn(`Error reading localStorage key "${key}":`, err);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(newValue));
        } catch (err) {
          console.warn(`Error saving to localStorage key "${key}":`, err);
        }
        return newValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

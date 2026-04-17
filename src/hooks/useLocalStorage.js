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
      return item ? JSON.parse(item) : initialValue;
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

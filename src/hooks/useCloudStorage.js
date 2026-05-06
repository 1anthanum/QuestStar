import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

/**
 * useCloudStorage — drop-in replacement for useLocalStorage when user is authenticated.
 *
 * API is identical to useLocalStorage: [value, setValue]
 *
 * Strategy:
 * - Guest mode: behaves exactly like useLocalStorage (reads/writes localStorage)
 * - Authenticated: reads from Supabase on mount, writes to both Supabase + local cache
 * - Debounces writes to Supabase (500ms) to avoid excessive API calls
 *
 * @param {string} table - Supabase table name
 * @param {string} column - Column to read/write (for single-column values)
 * @param {*} initialValue - Default value if nothing stored
 * @param {object} options - { localKey: string (localStorage fallback key) }
 */
export function useCloudStorage(table, column, initialValue, options = {}) {
  const { user, isAuthenticated } = useAuth();
  const { localKey } = options;

  // Local state (works for both guest and authenticated)
  const [value, setValueInternal] = useState(() => {
    if (localKey) {
      try {
        const item = window.localStorage.getItem(localKey);
        return item ? JSON.parse(item) : initialValue;
      } catch {
        return initialValue;
      }
    }
    return initialValue;
  });

  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef(null);
  const userIdRef = useRef(null);

  // Track user changes
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  // ── Load from Supabase on auth ──
  useEffect(() => {
    if (!isAuthenticated || !supabase) {
      setLoaded(true);
      return;
    }

    let cancelled = false;

    const loadFromCloud = async () => {
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;

      if (!error && data && data[column] !== undefined && data[column] !== null) {
        setValueInternal(data[column]);
        // Also update local cache
        if (localKey) {
          try {
            window.localStorage.setItem(localKey, JSON.stringify(data[column]));
          } catch {}
        }
      }
      setLoaded(true);
    };

    loadFromCloud();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id, table, column, localKey]);

  // ── Write function ──
  const setValue = useCallback(
    (newValueOrFn) => {
      setValueInternal((prev) => {
        const newValue =
          newValueOrFn instanceof Function ? newValueOrFn(prev) : newValueOrFn;

        // Always write to localStorage (local cache)
        if (localKey) {
          try {
            window.localStorage.setItem(localKey, JSON.stringify(newValue));
          } catch {}
        }

        // If authenticated, debounce write to Supabase
        if (isAuthenticated && supabase && userIdRef.current) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            supabase
              .from(table)
              .upsert(
                { user_id: userIdRef.current, [column]: newValue },
                { onConflict: "user_id" }
              )
              .then(({ error }) => {
                if (error) console.warn(`Cloud sync error (${table}.${column}):`, error.message);
              });
          }, 500);
        }

        return newValue;
      });
    },
    [isAuthenticated, table, column, localKey]
  );

  return [value, setValue, loaded];
}

/**
 * useCloudJSON — for tables where we store multiple columns as one JSON blob.
 * Syncs an entire row as a single object.
 *
 * @param {string} table - Supabase table name
 * @param {object} initialValue - Default row shape
 * @param {object} columnToLocalKey - Map of { columnName: "qt_local_key" }
 */
export function useCloudJSON(table, initialValue, columnToLocalKey = {}) {
  const { user, isAuthenticated } = useAuth();
  const [row, setRowInternal] = useState(() => {
    // Initialize from localStorage
    const restored = { ...initialValue };
    for (const [col, lk] of Object.entries(columnToLocalKey)) {
      try {
        const item = window.localStorage.getItem(lk);
        if (item !== null) restored[col] = JSON.parse(item);
      } catch {}
    }
    return restored;
  });

  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef(null);

  // Load from Supabase
  useEffect(() => {
    if (!isAuthenticated || !supabase) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    const load = async () => {
      const cols = Object.keys(columnToLocalKey).join(",");
      const { data, error } = await supabase
        .from(table)
        .select(cols || "*")
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;

      if (!error && data) {
        const merged = { ...initialValue };
        for (const [col, lk] of Object.entries(columnToLocalKey)) {
          if (data[col] !== undefined && data[col] !== null) {
            merged[col] = data[col];
            try {
              window.localStorage.setItem(lk, JSON.stringify(data[col]));
            } catch {}
          }
        }
        setRowInternal(merged);
      }
      setLoaded(true);
    };

    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id, table]);

  // Update a specific column
  const setColumn = useCallback(
    (column, newValueOrFn) => {
      setRowInternal((prev) => {
        const newValue =
          newValueOrFn instanceof Function ? newValueOrFn(prev[column]) : newValueOrFn;
        const updated = { ...prev, [column]: newValue };

        // Write to localStorage
        const lk = columnToLocalKey[column];
        if (lk) {
          try {
            window.localStorage.setItem(lk, JSON.stringify(newValue));
          } catch {}
        }

        // Debounced cloud write
        if (isAuthenticated && supabase && user?.id) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            supabase
              .from(table)
              .upsert(
                { user_id: user.id, [column]: newValue },
                { onConflict: "user_id" }
              )
              .then(({ error }) => {
                if (error) console.warn(`Cloud sync error (${table}.${column}):`, error.message);
              });
          }, 500);
        }

        return updated;
      });
    },
    [isAuthenticated, user?.id, table, columnToLocalKey]
  );

  return [row, setColumn, loaded];
}

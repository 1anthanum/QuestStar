import { useState, useCallback, useMemo } from "react";

/**
 * Centralized modal/panel visibility manager.
 * Replaces 22 individual `const [showX, setShowX] = useState(false)` in App.jsx.
 *
 * Why:
 *   - Avoids re-renders cascading through App.jsx on every modal toggle
 *   - Single source of truth for "is anything open"
 *   - Less prop drilling — return an object and pass relevant pieces
 *
 * Usage:
 *   const modals = useModalManager();
 *   modals.show("settings");          // open
 *   modals.hide("settings");          // close
 *   modals.toggle("addModal");
 *   modals.isOpen("settings");        // boolean
 *   modals.anyOpen;                   // true if any panel is open
 *   modals.close();                   // close ALL
 */
export function useModalManager() {
  const [openModals, setOpenModals] = useState({});

  const show = useCallback((name) => {
    setOpenModals((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }, []);

  const hide = useCallback((name) => {
    setOpenModals((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const toggle = useCallback((name) => {
    setOpenModals((prev) => {
      const next = { ...prev };
      if (next[name]) delete next[name];
      else next[name] = true;
      return next;
    });
  }, []);

  const close = useCallback(() => setOpenModals({}), []);

  const isOpen = useCallback((name) => !!openModals[name], [openModals]);

  const anyOpen = useMemo(() => Object.keys(openModals).length > 0, [openModals]);

  return useMemo(
    () => ({ show, hide, toggle, close, isOpen, anyOpen, _modals: openModals }),
    [show, hide, toggle, close, isOpen, anyOpen, openModals]
  );
}

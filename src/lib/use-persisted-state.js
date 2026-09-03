"use client";

import { useState, useEffect } from "react";

/**
 * useState wrapper that syncs to localStorage.
 *
 * @param {string} key       – localStorage key (must be unique per page context)
 * @param {any}    initialValue – default value when nothing is stored yet
 * @returns {[value, setValue]} same tuple as useState
 */
export default function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored);
    } catch {
      // corrupt or quota – fall through to default
    }
    return initialValue;
  });

  // Persist on every change
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded – silently ignore
    }
  }, [key, value]);

  return [value, setValue];
}

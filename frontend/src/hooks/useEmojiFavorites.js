import { useState, useCallback } from "react";

const STORAGE_KEY = "emoji-favorites";
const MAX_FAVORITES = 20;

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function useEmojiFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites);

  const trackUse = useCallback((emoji) => {
    setFavorites((prev) => {
      const next = { ...prev, [emoji]: (prev[emoji] || 0) + 1 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getFavorites = useCallback(() => {
    return Object.entries(favorites)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_FAVORITES)
      .map(([emoji]) => emoji);
  }, [favorites]);

  return { trackUse, getFavorites };
}

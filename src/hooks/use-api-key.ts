import { useEffect, useState, useCallback } from "react";
import { API_KEY_STORAGE, getApiKey, setApiKey as save } from "@/lib/api-client";

export function useApiKey() {
  const [apiKey, setKeyState] = useState<string | null>(null);

  useEffect(() => {
    setKeyState(getApiKey());
    const onStorage = (e: StorageEvent) => {
      if (e.key === API_KEY_STORAGE) setKeyState(getApiKey());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setApiKey = useCallback((k: string | null) => {
    save(k);
    setKeyState(k);
  }, []);

  return { apiKey, setApiKey, hasKey: !!apiKey };
}

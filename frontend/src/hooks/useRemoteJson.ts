import { useEffect, useState } from "react";

interface RemoteState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useRemoteJson<T>(url: string, refreshMs = 0): RemoteState<T> {
  const [state, setState] = useState<RemoteState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as T;
        if (!active) return;

        setState({
          data: payload,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (!active) return;

        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    load();
    if (!refreshMs) {
      return () => {
        active = false;
      };
    }

    const timer = window.setInterval(load, refreshMs);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [url, refreshMs]);

  return state;
}

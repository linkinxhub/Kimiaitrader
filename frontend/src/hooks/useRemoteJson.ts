import { useEffect, useState } from "react";

interface RemoteState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useRemoteJson<T>(url: string, refreshMs = 0): RemoteState<T> {
  const [state, setState] = useState<RemoteState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function load() {
      setState((current) => ({ ...current, isLoading: true }));

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        const text = await response.text();
        const data = JSON.parse(text) as T;

        if (!mounted) {
          return;
        }

        setState({
          data,
          error: null,
          isLoading: false,
        });
      } catch (error) {
        if (!mounted || controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unknown fetch error";
        setState({
          data: null,
          error: message,
          isLoading: false,
        });
      }
    }

    void load();

    let interval: number | null = null;
    if (refreshMs > 0) {
      interval = window.setInterval(() => {
        void load();
      }, refreshMs);
    }

    return () => {
      mounted = false;
      controller.abort();
      if (interval != null) {
        window.clearInterval(interval);
      }
    };
  }, [refreshMs, url]);

  return state;
}

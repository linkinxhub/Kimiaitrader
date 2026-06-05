import { useEffect, useRef, useState } from "react";

export function useWebSocketPrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<"connecting" | "open" | "closed">("connecting");
  const retryRef = useRef(0);

  useEffect(() => {
    if (!symbols.length) {
      return;
    }

    let socket: WebSocket | null = null;
    let cancelled = false;

    const connect = () => {
      const streams = symbols.map((symbol) => `${symbol.toLowerCase()}@trade`).join("/");
      socket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      setStatus("connecting");

      socket.onopen = () => {
        retryRef.current = 0;
        setStatus("open");
      };

      socket.onmessage = (event) => {
        const parsed = JSON.parse(event.data) as { data?: { s?: string; p?: string } };
        const symbol = parsed.data?.s;
        const price = parsed.data?.p;
        if (symbol && price) {
          setPrices((current) => ({ ...current, [symbol]: Number(price) }));
        }
      };

      socket.onclose = () => {
        if (cancelled) {
          return;
        }
        setStatus("closed");
        retryRef.current += 1;
        if (retryRef.current <= 10) {
          window.setTimeout(connect, Math.min(1000 * 2 ** retryRef.current, 20000));
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      socket?.close();
    };
  }, [symbols]);

  return { prices, status };
}

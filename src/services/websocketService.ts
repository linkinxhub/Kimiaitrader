/**
 * Binance WebSocket Service
 * Connexion directe aux WebSockets de Binance depuis le navigateur
 * Pas de backend nécessaire - données temps réel pures
 *
 * Streams disponibles :
 * - ws/!ticker@arr : Ticker 24h pour tous les symbols (~1000/s)
 * - ws/btcusdt@trade : Trades individuels
 * - ws/btcusdt@kline_1m : Candles temps réel
 * - ws/btcusdt@depth : Order book
 */

const WS_BASE = 'wss://stream.binance.com:9443/ws';

export interface WsPriceData {
  symbol: string;
  price: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdate: number;
  bidPrice: number;
  askPrice: number;
}

export interface WsTrade {
  symbol: string;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

type PriceCallback = (data: Record<string, WsPriceData>) => void;
type TradeCallback = (trade: WsTrade) => void;
type StatusCallback = (status: WsStatus) => void;

class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private symbols: string[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private priceCallbacks: PriceCallback[] = [];
  private tradeCallbacks: TradeCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private status: WsStatus = 'disconnected';
  private prices: Record<string, WsPriceData> = {};
  private subscribedTrades = false;

  private setStatus(s: WsStatus) {
    this.status = s;
    this.statusCallbacks.forEach(cb => cb(s));
  }

  getStatus(): WsStatus { return this.status; }
  getPrices(): Record<string, WsPriceData> { return { ...this.prices }; }

  onPrices(cb: PriceCallback) { this.priceCallbacks.push(cb); return () => { this.priceCallbacks = this.priceCallbacks.filter(c => c !== cb); }; }
  onTrades(cb: TradeCallback) { this.tradeCallbacks.push(cb); return () => { this.tradeCallbacks = this.tradeCallbacks.filter(c => c !== cb); }; }
  onStatus(cb: StatusCallback) { this.statusCallbacks.push(cb); return () => { this.statusCallbacks = this.statusCallbacks.filter(c => c !== cb); }; }

  connect(symbols: string[], includeTrades = false) {
    this.disconnect();
    this.symbols = symbols.map(s => s.replace('/', '').toLowerCase());
    this.subscribedTrades = includeTrades;
    this.reconnectAttempts = 0;
    this.doConnect();
  }

  private doConnect() {
    this.setStatus('connecting');

    const streams: string[] = [];
    this.symbols.forEach(s => {
      streams.push(`${s}@ticker`);
      if (this.subscribedTrades) streams.push(`${s}@trade`);
    });

    const url = streams.length === 1
      ? `${WS_BASE}/${streams[0]}`
      : `${WS_BASE}/stream?streams=${streams.join('/')}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.setStatus('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        // Combined stream wraps data
        const data = parsed.data || parsed;
        const stream = parsed.stream || '';

        if (data.e === '24hrTicker' || data.e === '24HrMiniTicker') {
          this.handleTicker(data);
        } else if (data.e === 'trade') {
          this.handleTrade(data);
        } else if (data.c !== undefined && data.s !== undefined) {
          // Direct single-stream ticker
          this.handleDirectTicker(data);
        }
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.setStatus('disconnected');
      this.ws?.close();
    };
  }

  private handleTicker(data: any) {
    const symbol = data.s || '';
    const displaySymbol = this.toDisplaySymbol(symbol);
    const price = parseFloat(data.c || 0);
    if (!price) return;

    this.prices[displaySymbol] = {
      symbol: displaySymbol,
      price,
      change24hPercent: parseFloat(data.P || 0),
      high24h: parseFloat(data.h || 0),
      low24h: parseFloat(data.l || 0),
      volume24h: parseFloat(data.v || 0),
      lastUpdate: data.E || Date.now(),
      bidPrice: parseFloat(data.b || price * 0.999),
      askPrice: parseFloat(data.a || price * 1.001),
    };

    this.priceCallbacks.forEach(cb => cb(this.prices));
  }

  private handleDirectTicker(data: any) {
    const symbol = data.s || '';
    const displaySymbol = this.toDisplaySymbol(symbol);
    const price = parseFloat(data.c || 0);
    if (!price) return;

    this.prices[displaySymbol] = {
      symbol: displaySymbol,
      price,
      change24hPercent: parseFloat(data.P || 0),
      high24h: parseFloat(data.h || 0),
      low24h: parseFloat(data.l || 0),
      volume24h: parseFloat(data.v || 0),
      lastUpdate: Date.now(),
      bidPrice: parseFloat(data.b || price * 0.999),
      askPrice: parseFloat(data.a || price * 1.001),
    };

    this.priceCallbacks.forEach(cb => cb(this.prices));
  }

  private handleTrade(data: any) {
    const trade: WsTrade = {
      symbol: this.toDisplaySymbol(data.s || ''),
      price: parseFloat(data.p || 0),
      quantity: parseFloat(data.q || 0),
      time: data.T || Date.now(),
      isBuyerMaker: data.m || false,
    };
    this.tradeCallbacks.forEach(cb => cb(trade));
  }

  private toDisplaySymbol(raw: string): string {
    const s = raw.toUpperCase();
    if (s.endsWith('USDT')) return s.replace('USDT', '/USD');
    if (s.endsWith('USD')) return s.replace('USD', '/USD');
    return s;
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.setStatus('reconnecting');
    this.reconnectAttempts++;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);

    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
    this.reconnectAttempts = 0;
  }
}

export const binanceWS = new BinanceWebSocket();

// ─── Hook for React ─────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';

export function useWebSocketPrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, WsPriceData>>({});
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const [latency, setLatency] = useState(0);
  const lastUpdateRef = useRef(Date.now());
  const pendingRef = useRef<Record<string, WsPriceData> | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Throttle price updates to max 1 per second to prevent re-render storms
  const flushPrices = useCallback(() => {
    throttleTimerRef.current = null;
    if (!pendingRef.current) return;
    setPrices(prev => {
      const next = pendingRef.current!;
      pendingRef.current = null;
      // Only update if prices actually changed
      let hasChange = false;
      for (const [sym, val] of Object.entries(next)) {
        const old = prev[sym];
        if (!old || old.price !== val.price) { hasChange = true; break; }
      }
      return hasChange ? { ...next } : prev;
    });
  }, []);

  useEffect(() => {
    const unsubPrice = binanceWS.onPrices((data) => {
      pendingRef.current = data;
      if (!throttleTimerRef.current) {
        const now = Date.now();
        setLatency(now - lastUpdateRef.current);
        lastUpdateRef.current = now;
        throttleTimerRef.current = setTimeout(flushPrices, 1000);
      }
    });

    const unsubStatus = binanceWS.onStatus((s) => {
      setStatus(s);
    });

    binanceWS.connect(symbols);

    return () => {
      unsubPrice();
      unsubStatus();
      binanceWS.disconnect();
    };
  }, [symbols.join(',')]);

  return { prices, status, latency };
}

export function useWebSocketTrades(symbol: string) {
  const [trades, setTrades] = useState<WsTrade[]>([]);

  useEffect(() => {
    const unsub = binanceWS.onTrades((trade) => {
      if (trade.symbol === symbol) {
        setTrades(prev => [trade, ...prev].slice(0, 100));
      }
    });

    binanceWS.connect([symbol], true);

    return () => {
      unsub();
      binanceWS.disconnect();
    };
  }, [symbol]);

  return trades;
}

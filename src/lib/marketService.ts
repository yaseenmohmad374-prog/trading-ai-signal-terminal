import { Candle } from '../types';

const BINANCE = 'https://api.binance.com';
const WS = 'wss://stream.binance.com:9443/ws';

export async function getSymbols(): Promise<string[]> {
  const res = await fetch(`${BINANCE}/api/v3/exchangeInfo`);
  if (!res.ok) throw new Error('Failed to fetch symbols');
  const data = await res.json();
  return data.symbols
    .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
    .filter((s: any) => ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'AVAX'].includes(s.baseAsset))
    .map((s: any) => s.symbol)
    .sort()
    .slice(0, 30);
}

export async function getCandles(symbol: string, tf: string, limit = 300): Promise<Candle[]> {
  const res = await fetch(`${BINANCE}/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch candles for ${symbol}`);
  const data = await res.json();
  return data.map((k: any[]) => ({
    time: Number(k[0]),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[7]),
  }));
}

export async function getTicker(symbol: string) {
  const res = await fetch(`${BINANCE}/api/v3/ticker/24hr?symbol=${symbol}`);
  if (!res.ok) throw new Error(`Failed to fetch ${symbol}`);
  const data = await res.json();
  return {
    symbol: data.symbol,
    price: Number(data.lastPrice),
    change: Number(data.priceChangePercent),
  };
}

export function watchTicker(symbol: string, onPrice: (price: number) => void): () => void {
  const ws = new WebSocket(`${WS}/${symbol.toLowerCase()}@ticker`);
  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    if (data?.c) onPrice(Number(data.c));
  };
  return () => ws.close();
}

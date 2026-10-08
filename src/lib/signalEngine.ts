import { Candle, MarketSymbol, Timeframe, TickerData } from '../types';

const BINANCE_BASE = 'https://api.binance.com';
const BINANCE_WS = 'wss://stream.binance.com:9443/ws';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '5m': '5m',
  '10m': '10m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

export async function fetchAvailableSymbols(): Promise<MarketSymbol[]> {
  const response = await fetch(`${BINANCE_BASE}/api/v3/exchangeInfo`);
  if (!response.ok) throw new Error('فشل في تحميل قائمة العملات');

  const data = await response.json();
  const major = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'AVAX', 'LINK', 'NEAR'];

  const filtered = data.symbols
    .filter((symbol: any) => symbol.status === 'TRADING')
    .filter((symbol: any) => {
      const { quoteAsset, baseAsset } = symbol;
      const validQuote = quoteAsset === 'USDT' || quoteAsset === 'USD';
      const isMajor = major.includes(baseAsset);
      return validQuote && isMajor;
    })
    .slice(0, 120)
    .map((symbol: any) => ({
      symbol: symbol.symbol,
      baseAsset: symbol.baseAsset,
      quoteAsset: symbol.quoteAsset,
    }));

  const extras = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'XAUUSD', 'EURUSD'];
  const combined = [...new Set([...extras, ...filtered.map((entry) => entry.symbol)])];

  return combined
    .filter((item) => !!item)
    .map((symbol) => ({
      symbol,
      baseAsset: symbol.replace(/USDT|USD/gi, ''),
      quoteAsset: symbol.endsWith('USDT') ? 'USDT' : 'USD',
    }))
    .slice(0, 50);
}

export async function fetchCandles(symbol: string, interval: Timeframe, limit = 240): Promise<Candle[]> {
  const safeSymbol = symbol.toUpperCase();
  const response = await fetch(
    `${BINANCE_BASE}/api/v3/klines?symbol=${safeSymbol}&interval=${TIMEFRAME_MAP[interval]}&limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(`فشل في تحميل الشموع لـ ${safeSymbol}`);
  }

  const data = await response.json();

  return data.map((entry: any[]) => ({
    time: Number(entry[0]),
    open: Number(entry[1]),
    high: Number(entry[2]),
    low: Number(entry[3]),
    close: Number(entry[4]),
    volume: Number(entry[5]),
  }));
}

export async function fetchTicker(symbol: string): Promise<TickerData> {
  const response = await fetch(`${BINANCE_BASE}/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`);
  if (!response.ok) {
    throw new Error(`فشل في تحديث السعر لـ ${symbol}`);
  }

  const data = await response.json();

  return {
    symbol: data.symbol,
    price: Number(data.lastPrice),
    changePercent: Number(data.priceChangePercent),
  };
}

export function subscribeTicker(symbol: string, onTick: (price: number, changePercent: number) => void) {
  const ws = new WebSocket(`${BINANCE_WS}/${symbol.toLowerCase()}@ticker`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (!data || !data.c) return;

    onTick(Number(data.c), Number(data.P || 0));
  };

  ws.onerror = () => {
    // Ignore transient websocket errors; app will still show REST-based price values.
  };

  return () => ws.close();
}

export function getMajorTimeframes(): Timeframe[] {
  return ['5m', '10m', '15m', '30m', '1h', '4h', '1d'];
}

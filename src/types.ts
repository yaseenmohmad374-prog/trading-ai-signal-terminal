export type Timeframe = '5m' | '10m' | '15m' | '30m' | '1h' | '4h' | '1d';
export type SignalStatus = 'شراء قوي' | 'شراء' | 'انتظار' | 'بيع' | 'بيع قوي' | 'لا توجد صفقة';
export type SignalDirection = 'buy' | 'sell' | 'neutral';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface Signal {
  id: string;
  symbol: string;
  status: SignalStatus;
  direction: SignalDirection;
  timeframe: string;
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  confidence: number;
  riskReward: number;
  tradeBias: 'شراء' | 'بيع' | 'محايد';
  timestamp: string;
  validForMinutes: number;
  reason: string;
}

export interface TickerData {
  symbol: string;
  price: number;
  changePercent: number;
}

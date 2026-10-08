export type SignalStatus = 'شراء قوي' | 'شراء' | 'لا توجد صفقة' | 'بيع' | 'بيع قوي';
export type Direction = 'buy' | 'sell' | 'neutral';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  id: string;
  symbol: string;
  status: SignalStatus;
  direction: Direction;
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  confidence: number;
  riskReward: number;
  tradeBias: string;
  timestamp: string;
  validForMinutes: number;
  reason: string;
  timeframe: string;
}

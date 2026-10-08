import { Candle } from '../types';

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function ema(values: number[], period: number): number[] {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];

  values.forEach((value, i) => {
    if (i === 0) {
      result.push(value);
      return;
    }
    const prev = result[i - 1] ?? value;
    result.push((value - prev) * k + prev);
  });

  return result;
}

export function rsi(values: number[], period = 14): number[] {
  if (values.length < period + 1) return values.map(() => 50);

  const result: number[] = new Array(values.length).fill(50);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) gains += delta;
    else losses -= delta;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) result[i] = 100;
    else result[i] = 100 - 100 / (1 + avgGain / avgLoss);
  }

  return result;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const macdLine = fastEma.map((v, i) => v - (slowEma[i] ?? v));
  const signalLine = ema(macdLine, signal);
  const histogram = macdLine.map((v, i) => v - (signalLine[i] ?? v));

  return { macdLine, signalLine, histogram };
}

export function atr(candles: Candle[], period = 14): number {
  if (candles.length < period) return 0;

  const trueRanges: number[] = [];
  candles.forEach((c, i) => {
    if (i === 0) return;
    const prev = candles[i - 1];
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - prev.close),
      Math.abs(c.low - prev.close)
    );
    trueRanges.push(tr);
  });

  return average(trueRanges.slice(-period));
}

export function vwap(candles: Candle[]): number {
  if (!candles.length) return 0;
  const latest = candles.slice(-20);
  const totalVol = latest.reduce((sum, c) => sum + c.volume, 0);
  if (!totalVol) return average(latest.map((c) => c.close));
  const pwv = latest.reduce((sum, c) => {
    const tp = (c.high + c.low + c.close) / 3;
    return sum + tp * c.volume;
  }, 0);
  return pwv / totalVol;
}

export function getTrend(candles: Candle[]): 'up' | 'down' | 'neutral' {
  if (candles.length < 3) return 'neutral';
  const closes = candles.map((c) => c.close).slice(-20);
  const avg = average(closes);
  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];

  const trend = last > prev && last > avg ? 'up' : last < prev && last < avg ? 'down' : 'neutral';
  return trend;
}

import { Candle } from '../types';

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, current) => sum + current, 0) / values.length;
}

export function ema(values: number[], period: number): number[] {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];

  values.forEach((value, index) => {
    if (index === 0) {
      result.push(value);
      return;
    }

    const previous = result[index - 1] ?? value;
    result.push((value - previous) * k + previous);
  });

  return result;
}

export function rsi(values: number[], period = 14): number[] {
  if (values.length < period + 1) {
    return values.map(() => 50);
  }

  const result: number[] = new Array(values.length).fill(50);
  let gains = 0;
  let losses = 0;

  for (let index = 1; index <= period; index += 1) {
    const delta = values[index] - values[index - 1];
    if (delta >= 0) gains += delta;
    else losses -= delta;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let index = period + 1; index < values.length; index += 1) {
    const delta = values[index] - values[index - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[index] = 100;
    } else {
      const relativeStrength = avgGain / avgLoss;
      result[index] = 100 - 100 / (1 + relativeStrength);
    }
  }

  return result;
}

export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9) {
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const macdLine = fastEma.map((value, index) => value - (slowEma[index] ?? value));
  const signalLine = ema(macdLine, signalPeriod);
  const histogram = macdLine.map((value, index) => value - (signalLine[index] ?? value));

  return { macdLine, signalLine, histogram };
}

export function atr(candles: Candle[], period = 14): number {
  if (candles.length < period) return 0;

  const trueRanges: number[] = [];

  candles.forEach((candle, index) => {
    if (index === 0) return;

    const previous = candles[index - 1];
    const tr = Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previous.close),
      Math.abs(candle.low - previous.close),
    );

    trueRanges.push(tr);
  });

  const values = trueRanges.slice(-period);
  return average(values) || 0;
}

export function vwap(candles: Candle[], period = 20): number {
  const latest = candles.slice(-period);
  if (!latest.length) return 0;

  const totalVolume = latest.reduce((sum, candle) => sum + candle.volume, 0);
  if (!totalVolume) return average(latest.map((candle) => candle.close));

  const priceWeightedVolume = latest.reduce((sum, candle) => {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    return sum + typicalPrice * candle.volume;
  }, 0);

  return priceWeightedVolume / totalVolume;
}

export function detectStructure(candles: Candle[], lookback = 30) {
  if (candles.length < 10) {
    return {
      bullish: false,
      bearish: false,
      trend: 'sideways' as const,
      bos: false,
      choch: false,
      liquiditySweep: false,
    };
  }

  const slice = candles.slice(-lookback);
  const closes = slice.map((candle) => candle.close);
  const highs = slice.map((candle) => candle.high);
  const lows = slice.map((candle) => candle.low);

  const currentClose = closes.at(-1) ?? 0;
  const previousClose = closes.at(-2) ?? currentClose;
  const recentHigh = Math.max(...highs);
  const recentLow = Math.min(...lows);
  const higherHigh = currentClose > Math.max(...closes.slice(-5, -1));
  const lowerLow = currentClose < Math.min(...closes.slice(-5, -1));

  const trend =
    currentClose > previousClose && currentClose > average(closes.slice(-10))
      ? 'up'
      : currentClose < previousClose && currentClose < average(closes.slice(-10))
        ? 'down'
        : 'sideways';

  return {
    bullish: trend === 'up' || higherHigh,
    bearish: trend === 'down' || lowerLow,
    trend,
    bos: trend === 'up' && recentHigh > Math.max(...highs.slice(0, -1)),
    choch: trend === 'down' && recentLow < Math.min(...lows.slice(0, -1)),
    liquiditySweep: recentHigh > currentClose && recentLow < currentClose,
  };
}

export function detectSupportResistance(candles: Candle[], lookback = 60) {
  const slice = candles.slice(-lookback);
  const highs = slice.map((candle) => candle.high);
  const lows = slice.map((candle) => candle.low);

  const resistance = Math.max(...highs);
  const support = Math.min(...lows);

  return { support, resistance };
}

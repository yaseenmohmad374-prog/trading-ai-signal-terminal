import { Candle, Signal } from '../types';
import { ema, rsi, macd, atr, vwap, getTrend } from './indicators';

function neutral(symbol: string, price: number): Signal {
  return {
    id: `${symbol}-${Date.now()}`,
    symbol,
    status: 'لا توجد صفقة',
    direction: 'neutral',
    entry: price,
    stopLoss: price,
    tp1: price,
    tp2: price,
    tp3: price,
    confidence: 0,
    riskReward: 0,
    tradeBias: 'محايد',
    timestamp: new Date().toISOString(),
    validForMinutes: 5,
    reason: 'السوق غير واضح - انتظر إشارة أقوى',
    timeframe: '-',
  };
}

export function analyze(symbol: string, candles5m: Candle[], candles1h: Candle[], candles4h: Candle[], price: number): Signal {
  if (!candles5m.length || !candles1h.length || !candles4h.length) return neutral(symbol, price);

  const c5 = candles5m.map((c) => c.close);
  const c1 = candles1h.map((c) => c.close);
  const c4 = candles4h.map((c) => c.close);

  // EMA التقاطعات (أقوى مؤشر)
  const ema9_5m = ema(c5, 9).at(-1) ?? price;
  const ema21_5m = ema(c5, 21).at(-1) ?? price;
  const ema9_1h = ema(c1, 9).at(-1) ?? price;
  const ema21_1h = ema(c1, 21).at(-1) ?? price;
  const ema9_4h = ema(c4, 9).at(-1) ?? price;
  const ema21_4h = ema(c4, 21).at(-1) ?? price;

  // RSI
  const rsi5m = rsi(c5).at(-1) ?? 50;
  const rsi1h = rsi(c1).at(-1) ?? 50;

  // MACD
  const macdData = macd(c5);
  const macdHist = macdData.histogram.at(-1) ?? 0;

  // ATR للستوب
  const atrVal = atr(candles5m, 14);
  const stopDist = Math.max(atrVal * 0.8, price * 0.01);
  const tp1Dist = stopDist * 1.5;
  const tp2Dist = stopDist * 2.5;
  const tp3Dist = stopDist * 4;

  // اتجاهات الفريمات
  const trend4h = getTrend(candles4h);
  const trend1h = getTrend(candles1h);

  // عدد الإشارات الصاعدة
  const bullPoints =
    (ema9_5m > ema21_5m ? 1 : 0) +
    (ema9_1h > ema21_1h ? 1 : 0) +
    (trend4h === 'up' ? 2 : 0) +
    (rsi5m > 50 && rsi5m < 70 ? 1 : 0) +
    (macdHist > 0 ? 1 : 0) +
    (price > vwap(candles5m) ? 1 : 0);

  // عدد الإشارات الهابطة
  const bearPoints =
    (ema9_5m < ema21_5m ? 1 : 0) +
    (ema9_1h < ema21_1h ? 1 : 0) +
    (trend4h === 'down' ? 2 : 0) +
    (rsi5m < 50 && rsi5m > 30 ? 1 : 0) +
    (macdHist < 0 ? 1 : 0) +
    (price < vwap(candles5m) ? 1 : 0);

  // تصفية قوية
  const strongBuy =
    bullPoints >= 6 && trend1h === 'up' && trend4h === 'up' && rsi5m > 45 && rsi5m < 75;
  const strongSell =
    bearPoints >= 6 && trend1h === 'down' && trend4h === 'down' && rsi5m < 55 && rsi5m > 25;
  const regularBuy = bullPoints >= 4 && trend1h === 'up';
  const regularSell = bearPoints >= 4 && trend1h === 'down';

  if (strongBuy) {
    return {
      id: `${symbol}-${Date.now()}`,
      symbol,
      status: 'شراء قوي',
      direction: 'buy',
      entry: price,
      stopLoss: price - stopDist,
      tp1: price + tp1Dist,
      tp2: price + tp2Dist,
      tp3: price + tp3Dist,
      confidence: Math.min(85 + (bullPoints - 6) * 2, 96),
      riskReward: Number((tp1Dist / stopDist).toFixed(2)),
      tradeBias: 'شراء',
      timestamp: new Date().toISOString(),
      validForMinutes: 20,
      reason: `✓ EMA صاعد | ✓ Trend قوي صاعد | RSI ${rsi5m.toFixed(0)} | ✓ MACD موجب | فرصة شراء قوية جداً`,
      timeframe: '5m/1h/4h',
    };
  }

  if (strongSell) {
    return {
      id: `${symbol}-${Date.now()}`,
      symbol,
      status: 'بيع قوي',
      direction: 'sell',
      entry: price,
      stopLoss: price + stopDist,
      tp1: price - tp1Dist,
      tp2: price - tp2Dist,
      tp3: price - tp3Dist,
      confidence: Math.min(85 + (bearPoints - 6) * 2, 96),
      riskReward: Number((tp1Dist / stopDist).toFixed(2)),
      tradeBias: 'بيع',
      timestamp: new Date().toISOString(),
      validForMinutes: 20,
      reason: `✓ EMA هابط | ✓ Trend قوي هابط | RSI ${rsi5m.toFixed(0)} | ✓ MACD سالب | فرصة بيع قوية جداً`,
      timeframe: '5m/1h/4h',
    };
  }

  if (regularBuy) {
    return {
      id: `${symbol}-${Date.now()}`,
      symbol,
      status: 'شراء',
      direction: 'buy',
      entry: price,
      stopLoss: price - stopDist,
      tp1: price + tp1Dist,
      tp2: price + tp2Dist,
      tp3: price + tp3Dist,
      confidence: Math.min(65 + (bullPoints - 4) * 2, 80),
      riskReward: Number((tp1Dist / stopDist).toFixed(2)),
      tradeBias: 'شراء',
      timestamp: new Date().toISOString(),
      validForMinutes: 15,
      reason: `اتجاه صاعد على 5m و 1h | RSI ${rsi5m.toFixed(0)} | فرصة شراء معقولة`,
      timeframe: '5m/1h/4h',
    };
  }

  if (regularSell) {
    return {
      id: `${symbol}-${Date.now()}`,
      symbol,
      status: 'بيع',
      direction: 'sell',
      entry: price,
      stopLoss: price + stopDist,
      tp1: price - tp1Dist,
      tp2: price - tp2Dist,
      tp3: price - tp3Dist,
      confidence: Math.min(65 + (bearPoints - 4) * 2, 80),
      riskReward: Number((tp1Dist / stopDist).toFixed(2)),
      tradeBias: 'بيع',
      timestamp: new Date().toISOString(),
      validForMinutes: 15,
      reason: `اتجاه هابط على 5m و 1h | RSI ${rsi5m.toFixed(0)} | فرصة بيع معقولة`,
      timeframe: '5m/1h/4h',
    };
  }

  return neutral(symbol, price);
}

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { fetchAvailableSymbols, fetchCandles, fetchTicker, getMajorTimeframes, subscribeTicker } from './lib/marketService';
import { buildSignal } from './lib/signalEngine';
import { Candle, MarketSymbol, Signal, Timeframe } from './types';

const timeframes: Timeframe[] = getMajorTimeframes();

const statusClassMap: Record<string, string> = {
  'شراء قوي': 'signal-buy',
  شراء: 'signal-buy',
  'بيع قوي': 'signal-sell',
  بيع: 'signal-sell',
  انتظار: 'signal-wait',
  'لا توجد صفقة': 'signal-neutral',
};

const historyClassMap: Record<string, string> = {
  'شراء قوي': 'status-buy',
  شراء: 'status-buy',
  'بيع قوي': 'status-sell',
  بيع: 'status-sell',
  انتظار: 'status-wait',
  'لا توجد صفقة': 'status-neutral',
};

function formatPrice(value: number) {
  return value.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function App() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [symbols, setSymbols] = useState<MarketSymbol[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');
  const [searchTerm, setSearchTerm] = useState('');
  const [candlesByTimeframe, setCandlesByTimeframe] = useState<Record<string, Candle[]>>({});
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [history, setHistory] = useState<Signal[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSymbols() {
      try {
        const data = await fetchAvailableSymbols();
        if (!isMounted) return;

        setSymbols(data);
        if (!data.some((item) => item.symbol === selectedSymbol)) {
          setSelectedSymbol(data[0]?.symbol ?? 'BTCUSDT');
        }
      } catch {
        setSymbols([{ symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' }]);
      }
    }

    loadSymbols();
    return () => {
      isMounted = false;
    };
  }, [selectedSymbol]);

  useEffect(() => {
    if (!selectedSymbol) return;

    let cancelled = false;

    async function refreshData() {
      setIsLoading(true);

      try {
        const entries = await Promise.all(
          timeframes.map(async (tf) => ({
            tf,
            candles: await fetchCandles(selectedSymbol, tf, 220),
          })),
        );

        if (!cancelled) {
          const nextMap: Record<string, Candle[]> = {};
          entries.forEach(({ tf, candles }) => {
            nextMap[tf] = candles;
          });

          setCandlesByTimeframe(nextMap);

          const ticker = await fetchTicker(selectedSymbol);
          setLastPrice(ticker.price);
          setPriceChange(ticker.changePercent);

          const nextSignal = buildSignal(selectedSymbol, nextMap, ticker.price);
          setSignal(nextSignal);

          if (nextSignal.status !== 'لا توجد صفقة' && nextSignal.status !== 'انتظار') {
            setHistory((current) => [nextSignal, ...current].slice(0, 6));
          }
        }
      } catch {
        // Ignore transient API failures and keep previous app state.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    refreshData();

    const timer = window.setInterval(() => {
      refreshData();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedSymbol]);

  useEffect(() => {
    if (!selectedSymbol) return;

    const cleanup = subscribeTicker(selectedSymbol, (price, changePercent) => {
      setLastPrice(price);
      setPriceChange(changePercent);

      if (candlesByTimeframe[selectedTimeframe]?.length) {
        setCandlesByTimeframe((current) => {
          const next = { ...current };
          const selectedCandles = [...(next[selectedTimeframe] ?? [])];
          if (!selectedCandles.length) return next;

          const last = selectedCandles[selectedCandles.length - 1];
          const updated = {
            ...last,
            time: Date.now(),
            close: price,
            high: Math.max(last.high, price),
            low: Math.min(last.low, price),
          };

          selectedCandles[selectedCandles.length - 1] = updated;
          next[selectedTimeframe] = selectedCandles;
          return next;
        });
      }
    });

    return () => cleanup();
  }, [selectedSymbol, selectedTimeframe, candlesByTimeframe]);

  const filteredSymbols = useMemo(() => {
    const term = searchTerm.trim().toUpperCase();
    return symbols.filter((item) => item.symbol.includes(term));
  }, [searchTerm, symbols]);

  const chartCandles = candlesByTimeframe[selectedTimeframe] ?? [];

  useEffect(() => {
    if (!chartContainerRef.current || !chartCandles.length) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#07131f' },
        textColor: '#dfeaff',
      },
      grid: {
        vertLines: { color: 'rgba(120,145,170,0.12)' },
        horzLines: { color: 'rgba(120,145,170,0.12)' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: 'rgba(120,145,170,0.22)',
      },
      timeScale: {
        borderColor: 'rgba(120,145,170,0.22)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#17b26a',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#17b26a',
      wickDownColor: '#ef4444',
      priceLineColor: '#8bc7ff',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    const candleData = chartCandles.map((candle) => ({
      time: (Math.floor(candle.time / 1000) || Date.now() / 1000) as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData = chartCandles.map((candle) => ({
      time: (Math.floor(candle.time / 1000) || Date.now() / 1000) as UTCTimestamp,
      value: candle.volume,
      color: candle.close >= candle.open ? 'rgba(22, 163, 74, 0.45)' : 'rgba(239, 68, 68, 0.45)',
    }));

    candleSeries.setData(candleData);
    volumeSeries.setData(volumeData);

    if (signal && signal.symbol === selectedSymbol) {
      candleSeries.createPriceLine({
        price: signal.entry,
        color: '#6cc0ff',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Entry',
      });

      candleSeries.createPriceLine({
        price: signal.stopLoss,
        color: '#ff6b6b',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: 'SL',
      });

      candleSeries.createPriceLine({
        price: signal.tp1,
        color: '#54d38a',
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: 'TP1',
      });

      candleSeries.createPriceLine({
        price: signal.tp2,
        color: '#4ed8d6',
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: 'TP2',
      });

      candleSeries.createPriceLine({
        price: signal.tp3,
        color: '#a78bfa',
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: 'TP3',
      });
    }

    chartRef.current = chart;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [chartCandles, selectedSymbol, selectedTimeframe, signal]);

  const activeSignal = signal ?? {
    status: 'انتظار',
    entry: lastPrice,
    stopLoss: lastPrice,
    tp1: lastPrice,
    tp2: lastPrice,
    tp3: lastPrice,
    confidence: 0,
    riskReward: 0,
    reason: 'جارٍ تحليل السوق…',
    timeframe: selectedTimeframe,
  } as Partial<Signal> as Signal;

  return (
    <div className="app-shell">
      <header className="topbar dark-panel">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div>
            <div className="brand-title">Trading AI Signal Terminal</div>
            <div className="brand-subtitle">محرك تحليل فني محلي ومباشر</div>
          </div>
        </div>

        <div className="topbar-controls">
          <input
            className="search-box"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="ابحث عن رمز…"
            aria-label="بحث الرمز"
          />

          <select
            className="symbol-select"
            value={selectedSymbol}
            onChange={(event) => setSelectedSymbol(event.target.value)}
            aria-label="اختيار الرمز"
          >
            {filteredSymbols.length ? filteredSymbols.map((item) => (
              <option key={item.symbol} value={item.symbol}>{item.symbol}</option>
            )) : <option value={selectedSymbol}>{selectedSymbol}</option>}
          </select>

          <select
            className="tf-select"
            value={selectedTimeframe}
            onChange={(event) => setSelectedTimeframe(event.target.value as Timeframe)}
            aria-label="اختيار الفريم"
          >
            {timeframes.map((tf) => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="main-grid">
        <section className="chart-card dark-panel">
          <div className="chart-header">
            <div className="symbol-meta">
              <span className="symbol-name">{selectedSymbol}</span>
              <span className={`price-tag ${priceChange >= 0 ? 'price-positive' : 'price-negative'}`}>
                {formatPrice(lastPrice)}
                <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
              </span>
            </div>
            <div className="symbol-meta">
              <span className="price-tag">الفريم: {selectedTimeframe}</span>
              <span className="price-tag">{isLoading ? 'جارٍ التحديث...' : 'LIVE'}</span>
            </div>
          </div>

          <div className="chart-wrap">
            <div ref={chartContainerRef} />
          </div>
        </section>

        <aside className="side-panel">
          <section className="signal-box dark-panel">
            <h3 className="section-title">الإشارة الحالية</h3>
            <div className={`signal-badge ${statusClassMap[activeSignal.status] ?? 'signal-neutral'}`}>{activeSignal.status}</div>

            <div className="stat-grid">
              <div className="stat-item">
                <span className="label">الدخول</span>
                <span className="value">{formatPrice(activeSignal.entry)}</span>
              </div>
              <div className="stat-item">
                <span className="label">وقف الخسارة</span>
                <span className="value">{formatPrice(activeSignal.stopLoss)}</span>
              </div>
              <div className="stat-item">
                <span className="label">TP1</span>
                <span className="value">{formatPrice(activeSignal.tp1)}</span>
              </div>
              <div className="stat-item">
                <span className="label">TP2</span>
                <span className="value">{formatPrice(activeSignal.tp2)}</span>
              </div>
              <div className="stat-item">
                <span className="label">TP3</span>
                <span className="value">{formatPrice(activeSignal.tp3)}</span>
              </div>
              <div className="stat-item">
                <span className="label">نسبة RR</span>
                <span className="value">{activeSignal.riskReward.toFixed(2)}x</span>
              </div>
              <div className="stat-item">
                <span className="label">الثقة</span>
                <span className="value">{activeSignal.confidence}%</span>
              </div>
              <div className="stat-item">
                <span className="label">الفريم</span>
                <span className="value">{activeSignal.timeframe}</span>
              </div>
            </div>

            <div className="reason-box">
              <strong>السبب:</strong> {activeSignal.reason}
            </div>
          </section>

          <section className="market-box dark-panel">
            <h3 className="section-title">مؤشرات السوق</h3>
            <div className="market-metrics">
              <div className="metric-box">
                <span className="label">الاتجاه</span>
                <span className="value">{priceChange >= 0 ? 'صاعد' : 'هابط'}</span>
              </div>
              <div className="metric-box">
                <span className="label">التقلب</span>
                <span className="value">{Math.abs(priceChange).toFixed(2)}%</span>
              </div>
              <div className="metric-box">
                <span className="label">السوق</span>
                <span className="value">{signal?.tradeBias ?? 'محايد'}</span>
              </div>
              <div className="metric-box">
                <span className="label">حالة LIVE</span>
                <span className="value">{isLoading ? 'تحديث' : 'مباشر'}</span>
              </div>
            </div>
          </section>

          <section className="history-box dark-panel">
            <h3 className="section-title">سجل الإشارات HISTORY</h3>
            <div className="history-list">
              {history.length ? history.map((item) => (
                <div key={item.id} className="history-item">
                  <div>
                    <strong>{item.symbol}</strong>
                    <div>{item.status}</div>
                  </div>
                  <div>
                    <div className={`history-status ${historyClassMap[item.status] ?? 'status-neutral'}`}>{item.status}</div>
                    <div>{formatDate(item.timestamp)}</div>
                  </div>
                </div>
              )) : (
                <div className="history-item">
                  <div>لا توجد إشارات سابقة حتى الآن.</div>
                </div>
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;

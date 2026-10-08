import { useEffect, useRef, useState } from 'react';
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  PriceLineSource,
  createChart,
  type IChartApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { getSymbols, getCandles, getTicker, watchTicker } from './lib/marketService';
import { analyze } from './lib/signalEngine';
import { Candle, Signal } from './types';

function formatPrice(val: number) {
  return val.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
}

function App() {
  const chartRef = useRef<IChartApi | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [tf, setTf] = useState('1h');
  const [search, setSearch] = useState('');

  const [signal, setSignal] = useState<Signal | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [change, setChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Signal[]>([]);

  const [candles5m, setCandles5m] = useState<Candle[]>([]);
  const [candles1h, setCandles1h] = useState<Candle[]>([]);
  const [candles4h, setCandles4h] = useState<Candle[]>([]);
  const [chartCandles, setChartCandles] = useState<Candle[]>([]);

  // تحميل الرموز
  useEffect(() => {
    (async () => {
      try {
        const syms = await getSymbols();
        setSymbols(syms);
      } catch (err) {
        console.error('Failed to load symbols:', err);
      }
    })();
  }, []);

  // تحميل البيانات والإشارات
  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      setLoading(true);
      try {
        const [c5, c1, c4, ticker] = await Promise.all([
          getCandles(symbol, '5m', 300),
          getCandles(symbol, '1h', 300),
          getCandles(symbol, '4h', 300),
          getTicker(symbol),
        ]);

        if (cancelled) return;

        setCandles5m(c5);
        setCandles1h(c1);
        setCandles4h(c4);

        // اختر الشموع للعرض بناءً على الفريم المختار
        const tfMap: Record<string, Candle[]> = { '5m': c5, '1h': c1, '4h': c4, '1d': c1 };
        setChartCandles(tfMap[tf] || c1);

        setPrice(ticker.price);
        setChange(ticker.change);

        const sig = analyze(symbol, c5, c1, c4, ticker.price);
        setSignal(sig);

        if (sig.direction !== 'neutral') {
          setHistory((prev) => [sig, ...prev].slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to refresh data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    refresh();
    const interval = setInterval(refresh, 12000); // تحديث كل 12 ثانية

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [symbol, tf]);

  // الاشتراك في تحديثات السعر الفورية
  useEffect(() => {
    if (!symbol) return;
    return watchTicker(symbol, (newPrice) => {
      setPrice(newPrice);
    });
  }, [symbol]);

  // رسم الشارت
  useEffect(() => {
    if (!containerRef.current || !chartCandles.length) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#050f1a' },
        textColor: '#8fa3c1',
      },
      grid: {
        vertLines: { color: 'rgba(76, 110, 160, 0.1)' },
        horzLines: { color: 'rgba(76, 110, 160, 0.1)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(76, 110, 160, 0.2)',
      },
      rightPriceScale: {
        borderColor: 'rgba(76, 110, 160, 0.2)',
        autoScale: true,
      },
      crosshair: { mode: 1 },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00d97e',
      downColor: '#ff4561',
      borderUpColor: '#00d97e',
      borderDownColor: '#ff4561',
      wickUpColor: '#00d97e',
      wickDownColor: '#ff4561',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceScaleId: '',
      lastValueVisible: false,
    });

    const candleData = chartCandles.map((c) => ({
      time: (Math.floor(c.time / 1000) || Math.floor(Date.now() / 1000)) as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = chartCandles.map((c) => ({
      time: (Math.floor(c.time / 1000) || Math.floor(Date.now() / 1000)) as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(0, 217, 126, 0.3)' : 'rgba(255, 69, 97, 0.3)',
    }));

    candleSeries.setData(candleData);
    volumeSeries.setData(volumeData);

    // رسم خطوط الإشارة
    if (signal && signal.direction !== 'neutral') {
      candleSeries.createPriceLine({
        price: signal.entry,
        color: '#00b7ff',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Entry',
        priceLineSource: PriceLineSource.LastBar,
      });

      candleSeries.createPriceLine({
        price: signal.stopLoss,
        color: '#ff4561',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'SL',
        priceLineSource: PriceLineSource.LastBar,
      });

      candleSeries.createPriceLine({
        price: signal.tp1,
        color: '#00d97e',
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: 'TP1',
        priceLineSource: PriceLineSource.LastBar,
      });

      candleSeries.createPriceLine({
        price: signal.tp2,
        color: '#00d97e',
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: 'TP2',
        priceLineSource: PriceLineSource.LastBar,
      });

      candleSeries.createPriceLine({
        price: signal.tp3,
        color: '#00d97e',
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: 'TP3',
        priceLineSource: PriceLineSource.LastBar,
      });
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [chartCandles, signal, tf]);

  const filteredSymbols = symbols.filter((s) => s.includes(search.toUpperCase()));

  const signalStatusClass = signal
    ? signal.status === 'شراء قوي'
      ? 'signal-strong-buy'
      : signal.status === 'شراء'
        ? 'signal-buy'
        : signal.status === 'بيع قوي'
          ? 'signal-strong-sell'
          : signal.status === 'بيع'
            ? 'signal-sell'
            : 'signal-neutral'
    : 'signal-neutral';

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo">AI</div>
          <div className="title">
            <h1>Trading AI Signal Terminal</h1>
            <p>محرك تحليل فني وإشارات سوق فعلية</p>
          </div>
        </div>

        <div className="controls">
          <input
            type="text"
            className="search"
            placeholder="ابحث عن رمز..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="select-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {filteredSymbols.length > 0
              ? filteredSymbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              : symbols.slice(0, 20).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
          </select>

          <select className="select-tf" value={tf} onChange={(e) => setTf(e.target.value)}>
            <option value="5m">5m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </div>
      </header>

      <main className="main">
        <section className="chart-section">
          <div className="chart-header">
            <div className="symbol-display">
              <span className="symbol-name">{symbol}</span>
              <span className={`price-display ${change >= 0 ? 'price-up' : 'price-down'}`}>
                {formatPrice(price)} {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
            <div className="chart-info">
              <span className="badge">الفريم: {tf}</span>
              <span className="badge">{loading ? '⟳ تحديث...' : '● مباشر'}</span>
            </div>
          </div>
          <div className="chart-container" ref={containerRef} />
        </section>

        <aside className="sidebar">
          <div className="panel">
            <div className="panel-title">الإشارة الحالية</div>
            {signal ? (
              <>
                <div className={`signal-badge ${signalStatusClass}`}>{signal.status}</div>

                <div className="stats-grid">
                  <div className="stat">
                    <div className="stat-label">الدخول</div>
                    <div className="stat-value">{formatPrice(signal.entry)}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">وقف الخسارة</div>
                    <div className="stat-value">{formatPrice(signal.stopLoss)}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">TP1</div>
                    <div className="stat-value">{formatPrice(signal.tp1)}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">TP2</div>
                    <div className="stat-value">{formatPrice(signal.tp2)}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">TP3</div>
                    <div className="stat-value">{formatPrice(signal.tp3)}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">RR</div>
                    <div className="stat-value">{signal.riskReward.toFixed(2)}x</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">ثقة</div>
                    <div className="stat-value">{signal.confidence}%</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">الفريم</div>
                    <div className="stat-value">{signal.timeframe}</div>
                  </div>
                </div>

                <div className="reason-box"><strong>السبب:</strong> {signal.reason}</div>
              </>
            ) : (
              <div className="loading">جاري التحليل...</div>
            )}
          </div>

          <div className="panel">
            <div className="panel-title">حالة السوق</div>
            <div className="metrics-grid">
              <div className="metric">
                <div className="metric-label">الاتجاه</div>
                <div className="metric-value">{change >= 0 ? '📈 صاعد' : '📉 هابط'}</div>
              </div>
              <div className="metric">
                <div className="metric-label">التغير</div>
                <div className="metric-value">{Math.abs(change).toFixed(2)}%</div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">السجل الأخير</div>
            <div className="history-list">
              {history.length > 0 ? (
                history.map((h) => (
                  <div key={h.id} className="history-item">
                    <div>
                      <strong>{h.symbol}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {formatTime(h.timestamp)}
                      </div>
                    </div>
                    <div
                      className={`history-status ${h.direction === 'buy' ? 'status-buy' : 'status-sell'}`}
                    >
                      {h.status}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                  لا توجد إشارات بعد
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;

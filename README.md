# Trading AI Signal Terminal

تطبيق تحليل فني واشارات شراء وبيع فوري للعملات الرقمية

## المميزات

✅ **إشارات شراء وبيع واضحة وسريعة**
✅ **تحليل AI محلي ومتقدم**
✅ **بيانات سوق حقيقية من Binance**
✅ **شارت Candlestick احترافي**
✅ **Entry / Stop Loss / TP1/TP2/TP3**
✅ **تصميم Dark احترافي RTL**
✅ **واجهة عربية 100%**
✅ **تحديثات مباشرة WebSocket**

## التثبيت

```bash
npm install
npm run dev
```

## البناء

```bash
npm run build
npm run preview
```

## الميزات التقنية

- **EMA Crossovers**: التقاطعات بين EMA9 و EMA21
- **Multi-Timeframe Analysis**: تحليل 5m, 1h, 4h معاً
- **RSI Oscillator**: لتحديد مستويات التشبع
- **MACD Histogram**: لتأكيد الزخم
- **ATR-based Stop Loss**: وقف خسارة ديناميكي
- **VWAP Level**: لتحديد مستويات الدعم والمقاومة

## خوارزمية الإشارات

التطبيق يحسب نقاط إشارات متعددة:
- إشارات صاعدة (Bullish): EMA cross, Trend, RSI, MACD, Price vs VWAP
- إشارات هابطة (Bearish): نفس العوامل لكن بالعكس

### شروط الشراء القوي:
- 6+ نقاط صاعدة
- H1 و H4 صاعد
- RSI بين 45-75
- Confidence ≥ 85%

### شروط البيع القوي:
- 6+ نقاط هابطة  
- H1 و H4 هابط
- RSI بين 25-55
- Confidence ≥ 85%

## الواجهة

- **الرموز المدعومة**: BTC, ETH, SOL, XRP, BNB, DOGE, ADA, AVAX (وآخرون)
- **الفريمات**: 5m, 1h, 4h, 1d
- **تحديثات السعر**: كل 12 ثانية
- **تحديثات اللايف**: WebSocket مباشر

## الرخصة

MIT

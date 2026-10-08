:root {
  font-family: "Tahoma", "Segoe UI", sans-serif;
  color: #e5f0ff;
  background: #07131f;
  line-height: 1.5;
  font-weight: 500;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  direction: rtl;
}

* {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  min-height: 100%;
  min-width: 320px;
  background:
    radial-gradient(circle at top, rgba(10, 79, 125, 0.28), transparent 32%),
    linear-gradient(180deg, #050d16 0%, #081722 100%);
}

body {
  min-height: 100vh;
  color: #edf5ff;
  direction: rtl;
}

button, input, select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 18px;
  color: #edf5ff;
}

.dark-panel {
  background: rgba(12, 20, 31, 0.92);
  border: 1px solid rgba(128, 170, 255, 0.14);
  border-radius: 16px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.28);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 18px;
  margin-bottom: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #00b7ff, #7a5cff);
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  font-weight: 700;
}

.brand-title {
  font-weight: 700;
  font-size: 1.1rem;
}

.brand-subtitle {
  font-size: 0.76rem;
  color: #98b4d4;
}

.topbar-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box, .symbol-select, .tf-select {
  background: rgba(16, 29, 39, 0.9);
  border: 1px solid rgba(129, 154, 188, 0.18);
  color: #edf5ff;
  border-radius: 10px;
  padding: 10px 12px;
}

.search-box {
  min-width: 200px;
}

.symbol-select {
  min-width: 160px;
}

.tf-select {
  min-width: 100px;
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.52fr);
  gap: 18px;
}

.chart-card {
  padding: 14px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.symbol-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.symbol-name {
  font-size: 1.6rem;
  font-weight: 800;
}

.price-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(68, 95, 131, 0.2);
  border: 1px solid rgba(98, 143, 196, 0.2);
}

.price-positive {
  color: #5ee7b7;
}

.price-negative {
  color: #ff7a7a;
}

.chart-wrap {
  position: relative;
  height: 640px;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(7, 17, 24, 0.98), rgba(8, 13, 21, 0.98));
  border: 1px solid rgba(130, 151, 172, 0.12);
}

.chart-wrap > div {
  width: 100%;
  height: 100%;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.signal-box,
.market-box,
.history-box,
.watchlist-box {
  padding: 16px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 0.9rem;
  color: #9cb4d3;
  letter-spacing: 0.04em;
}

.signal-badge {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-width: 140px;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 700;
  margin-bottom: 8px;
}

.signal-buy { background: rgba(21, 155, 111, 0.18); color: #79f5bf; border: 1px solid rgba(87, 214, 162, 0.4); }
.signal-sell { background: rgba(170, 49, 49, 0.18); color: #ff9f9f; border: 1px solid rgba(255, 120, 120, 0.4); }
.signal-wait { background: rgba(110, 135, 180, 0.14); color: #dfeafc; border: 1px solid rgba(146, 160, 192, 0.3); }
.signal-neutral { background: rgba(73, 88, 110, 0.15); color: #b8c7db; border: 1px solid rgba(129, 145, 168, 0.25); }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.stat-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(30, 42, 56, 0.65);
  border: 1px solid rgba(138, 160, 201, 0.1);
}

.label {
  display: block;
  color: #9cb4d3;
  font-size: 0.72rem;
  margin-bottom: 6px;
}

.value {
  font-size: 1.1rem;
  font-weight: 700;
}

.reason-box {
  margin-top: 14px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(23, 34, 48, 0.8);
  border: 1px solid rgba(144, 174, 226, 0.12);
  color: #cfe1ff;
  font-size: 0.95rem;
}

.market-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-box {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 29, 39, 0.8);
  border: 1px solid rgba(138, 160, 201, 0.12);
}

.history-list,
.watchlist-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item,
.watchlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 28, 38, 0.8);
  border: 1px solid rgba(135, 156, 190, 0.12);
}

.history-status {
  font-size: 0.8rem;
  padding: 5px 8px;
  border-radius: 999px;
}

.status-buy { background: rgba(30, 150, 100, 0.21); color: #73efb7; }
.status-sell { background: rgba(177, 57, 57, 0.22); color: #ff9d9d; }
.status-wait { background: rgba(126, 143, 178, 0.2); color: #dfe7f7; }
.status-neutral { background: rgba(97, 112, 141, 0.2); color: #d0d7e7; }

@media (max-width: 980px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .chart-wrap {
    height: 460px;
  }
}

@media (max-width: 640px) {
  .app-shell {
    padding: 12px;
  }

  .topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar-controls {
    width: 100%;
    justify-content: space-between;
  }

  .search-box,
  .symbol-select,
  .tf-select {
    width: 100%;
  }

  .brand {
    width: 100%;
    justify-content: center;
  }
}

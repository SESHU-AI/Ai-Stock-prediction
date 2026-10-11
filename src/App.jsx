import React, { useState, useEffect } from 'react';
import './App.css';
import { Activity, Search, BrainCircuit, Zap, ArrowRight, TrendingUp } from 'lucide-react';

const USD_TO_INR = 83.50;

function App() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [convertQty, setConvertQty] = useState(1);

  useEffect(() => {
    fetchStock('Accenture');
  }, []);

  const fetchStock = async (name) => {
    try {
      const res = await fetch(`https://stock-price-prediction-2i9f.onrender.com/api/stock/details?symbol=${encodeURIComponent(name)}`);
      const data = await res.json();
      setSelectedStock(data);
    } catch (err) {
      console.error("Backend fetch error:", err);
    }
  };

  const handleSearchInput = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://stock-price-prediction-2i9f.onrender.com/api/stock/search?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleSelect = (stock) => {
    setSelectedStock(stock);
    setSearchQuery('');
    setSuggestions([]);
  };

  if (!selectedStock) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#030806', color: '#00ff88' }}>
        <BrainCircuit size={48} className="animate-pulse" style={{ marginBottom: '16px' }} />
        <h2>Loading StockAI Terminal...</h2>
        <p style={{ color: '#86efac', marginTop: '8px', fontSize: '0.9rem' }}>Connecting to Backend at https://stock-price-prediction-2i9f.onrender.com/</p>
      </div>
    );
  }

  const isAlreadyINR = selectedStock.nativeCurrency === 'INR';
  const priceInINR = isAlreadyINR ? selectedStock.price : (selectedStock.price * USD_TO_INR);
  const totalConvertedINR = (convertQty * priceInINR).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const signalBg = selectedStock.isPositive ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 51, 102, 0.2)';
  const signalColor = selectedStock.isPositive ? '#00ff88' : '#ff3366';

  return (
    <div className="app-container">
      {/* Header & Navbar */}
      <header className="navbar">
        <div className="logo-group">
          <BrainCircuit className="logo-icon" size={32} />
          <div>
            <h1 className="logo-title">StockAI</h1>
          </div>
        </div>

        {/* Search Container with High z-index Layer */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px', zIndex: 9999 }}>
          <div className="search-box">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search ANY Company (e.g. Infosys, IBM, Apple)..."
              value={searchQuery}
              onChange={handleSearchInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  fetchStock(searchQuery);
                  setSuggestions([]);
                }
              }}
            />
          </div>

          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '115%',
              left: 0,
              right: 0,
              background: '#08140e',
              border: '1px solid rgba(0, 255, 136, 0.4)',
              borderRadius: '10px',
              zIndex: 9999,
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.9)',
              maxHeight: '260px',
              overflowY: 'auto'
            }}>
              {suggestions.map((item) => (
                <div
                  key={item.ticker}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(0, 255, 136, 0.1)',
                    color: '#f8fafc'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 255, 136, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '0.92rem', fontWeight: '600' }}>{item.fullName}</span>
                  <span style={{ color: '#00ff88', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{item.ticker}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="status-pill">
          <span className="dot animate-pulse"></span>
          Ready: Port 5000
        </div>
      </header>

      {/* Main Grid */}
      <main className="dashboard-grid">
        {/* Left Card: Price & Signal */}
        <section className="card price-card">
          <div className="flex justify-between items-start">
            <div>
              <span className="stock-ticker">{selectedStock.sector} • {selectedStock.ticker}</span>
              <h2 className="stock-name">{selectedStock.fullName}</h2>
            </div>
            <div
              className="signal-badge"
              style={{
                backgroundColor: signalBg,
                color: signalColor,
                borderColor: signalColor
              }}
            >
              <Zap size={16} />
              <span>{selectedStock.signal}</span>
            </div>
          </div>

          <div className="price-row">
            <span className="price-val">
              {selectedStock.currencySymbol}{Number(selectedStock.price).toFixed(2)}
            </span>
            <span className={`change-pill ${selectedStock.isPositive ? 'positive' : 'negative'}`}>
              {selectedStock.change}
            </span>
          </div>

          <div className="prediction-box">
            <div className="pred-item">
              <span className="label">AI 7-Day Target</span>
              <span className="val text-green-400">
                {selectedStock.currencySymbol}{Number(selectedStock.target).toFixed(2)} ({selectedStock.estGain})
              </span>
            </div>
            <div className="pred-item">
              <span className="label">AI Confidence</span>
              <span className="val text-green-400">{selectedStock.confidence}</span>
            </div>
          </div>
        </section>

        {/* Right Card: Trend Chart */}
        <section className="card chart-card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-cyan-400" />
              <h3>7-Day Price Trend & Trajectory</h3>
            </div>
            <div className="chart-header-tags">
              <span className="tag-up">High: {selectedStock.currencySymbol}{selectedStock.weekHigh}</span>
              <span className="tag-down">Low: {selectedStock.currencySymbol}{selectedStock.weekLow}</span>
            </div>
          </div>

          <div style={{ width: '100%', height: '185px', marginTop: '8px' }}>
            <svg viewBox="0 0 520 185" style={{ width: '100%', height: '100%' }}>
              <defs>
                <pattern id="marketGrid" width="45" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 45 0 L 0 0 0 24" fill="none" stroke="rgba(0, 255, 136, 0.15)" strokeWidth="0.8" strokeDasharray="2,2" />
                </pattern>
                <linearGradient id="bullGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <rect x="25" y="10" width="445" height="135" fill="url(#marketGrid)" />

              <g fill="#86efac" fontSize="9" fontFamily="monospace" textAnchor="start">
                <text x="475" y="24">{selectedStock.currencySymbol}{selectedStock.weekHigh}</text>
                <text x="475" y="75">{selectedStock.currencySymbol}{((selectedStock.weekHigh + selectedStock.weekLow) / 2).toFixed(1)}</text>
                <text x="475" y="140">{selectedStock.currencySymbol}{selectedStock.weekLow}</text>
              </g>

              {[45, 110, 175, 240, 305, 370, 435].map((vx, i) => {
                const volHeight = 12 + ((i * 7 + 13) % 22);
                return (
                  <rect
                    key={i}
                    x={vx - 14}
                    y={145 - volHeight}
                    width="28"
                    height={volHeight}
                    fill="rgba(0, 255, 136, 0.12)"
                    rx="1"
                  />
                );
              })}

              <polygon
                points={`35,145 ${selectedStock.weeklyHistory.map((item, idx) => {
                  const x = 35 + idx * 67;
                  const y = 130 - ((item.price - selectedStock.weekLow) / (selectedStock.weekHigh - selectedStock.weekLow || 1)) * 90;
                  return `${x},${y}`;
                }).join(' ')} 437,145`}
                fill="url(#bullGlow)"
              />

              <polyline
                fill="none"
                stroke="#00ff88"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={selectedStock.weeklyHistory.map((item, idx) => {
                  const x = 35 + idx * 67;
                  const y = 130 - ((item.price - selectedStock.weekLow) / (selectedStock.weekHigh - selectedStock.weekLow || 1)) * 90;
                  return `${x},${y}`;
                })}
              />

              {selectedStock.weeklyHistory.map((item, idx) => {
                const x = 35 + idx * 67;
                const y = 130 - ((item.price - selectedStock.weekLow) / (selectedStock.weekHigh - selectedStock.weekLow || 1)) * 90;
                const candleColor = item.isUp ? '#00ff88' : '#ff3366';

                return (
                  <g
                    key={idx}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredDay(item)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke={candleColor} strokeWidth="1.8" />
                    <rect
                      x={x - 6}
                      y={y - 8}
                      width="12"
                      height="16"
                      rx="2"
                      fill={candleColor}
                    />
                    <text
                      x={x}
                      y="168"
                      fill={hoveredDay && hoveredDay.day === item.day ? '#ffffff' : '#86efac'}
                      fontSize="12"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {item.day}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={{ minHeight: '20px', textAlign: 'center', fontSize: '0.85rem', marginTop: '2px' }}>
            {hoveredDay ? (
              <span style={{ color: hoveredDay.isUp ? '#00ff88' : '#ff3366', fontWeight: 'bold' }}>
                {hoveredDay.day}: {selectedStock.currencySymbol}{hoveredDay.price} ({hoveredDay.isUp ? '+' : ''}{hoveredDay.changePercent}%)
              </span>
            ) : (
              <span style={{ color: '#86efac' }}>Hover over any day node to inspect value</span>
            )}
          </div>
        </section>

        {/* Indicators */}
        <section className="indicators-grid">
          <div className="metric-box">
            <span className="label">RSI Indicator</span>
            <span className="metric-val">{selectedStock.rsi}</span>
          </div>
          <div className="metric-box">
            <span className="label">MACD Status</span>
            <span className="metric-val text-green-400">{selectedStock.macd}</span>
          </div>
          <div className="metric-box">
            <span className="label">Market Cap</span>
            <span className="metric-val">{selectedStock.marketCap}</span>
          </div>
          <div className="metric-box">
            <span className="label">52W High / Low</span>
            <span className="metric-val text-sm">
              {selectedStock.high52} / {selectedStock.low52}
            </span>
          </div>
        </section>

        {/* Currency Converter */}
        <section className="card" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isAlreadyINR ? <TrendingUp size={18} className="text-green-400" /> : <ArrowRight size={18} className="text-green-400" />}
                Indian Rupee (INR) Valuation Converter
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#86efac' }}>
                {isAlreadyINR 
                  ? `Native Indian Company — Trading natively in Indian Rupees (₹)`
                  : `1 USD = ₹83.50 INR benchmark exchange rate`}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(3, 10, 6, 0.65)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '8px', padding: '6px 12px' }}>
                <span style={{ fontSize: '0.8rem', color: '#86efac', marginRight: '8px' }}>Shares:</span>
                <input
                  type="number"
                  min="1"
                  value={convertQty}
                  onChange={(e) => setConvertQty(Math.max(1, Number(e.target.value)))}
                  style={{ background: 'transparent', border: 'none', color: '#fff', width: '50px', outline: 'none', fontWeight: 'bold' }}
                />
                <span style={{ fontWeight: 'bold', color: '#00ff88' }}>× {selectedStock.currencySymbol}{Number(selectedStock.price).toFixed(2)}</span>
              </div>

              <span style={{ color: '#86efac', fontWeight: 'bold' }}>=</span>

              <div style={{ background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', borderRadius: '8px', padding: '6px 16px', color: '#00ff88', fontSize: '1.25rem', fontWeight: '900' }}>
                ₹{totalConvertedINR} INR
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
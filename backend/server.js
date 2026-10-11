const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Base core companies
const baseStocks = {
  "accenture": { fullName: "Accenture plc", ticker: "ACN", sector: "IT Consulting", nativeCurrency: "USD", currencySymbol: "$", basePrice: 348.10, isIndian: false },
  "apple": { fullName: "Apple Inc.", ticker: "AAPL", sector: "Consumer Tech", nativeCurrency: "USD", currencySymbol: "$", basePrice: 224.23, isIndian: false },
  "tesla": { fullName: "Tesla, Inc.", ticker: "TSLA", sector: "Automotive & Clean Energy", nativeCurrency: "USD", currencySymbol: "$", basePrice: 248.50, isIndian: false },
  "nvidia": { fullName: "NVIDIA Corporation", ticker: "NVDA", sector: "Semiconductors", nativeCurrency: "USD", currencySymbol: "$", basePrice: 128.90, isIndian: false },
  "ibm": { fullName: "International Business Machines", ticker: "IBM", sector: "Enterprise Cloud & AI", nativeCurrency: "USD", currencySymbol: "$", basePrice: 218.40, isIndian: false },
  "microsoft": { fullName: "Microsoft Corporation", ticker: "MSFT", sector: "Software & Cloud", nativeCurrency: "USD", currencySymbol: "$", basePrice: 422.50, isIndian: false },
  "google": { fullName: "Alphabet Inc. (Google)", ticker: "GOOGL", sector: "Internet & AI", nativeCurrency: "USD", currencySymbol: "$", basePrice: 168.20, isIndian: false },
  "deloitte": { fullName: "Deloitte Touche Tohmatsu", ticker: "DTT.PVT", sector: "Audit & Advisory (Valuation)", nativeCurrency: "USD", currencySymbol: "$", basePrice: 185.00, isIndian: false },
  "reliance": { fullName: "Reliance Industries Limited", ticker: "RELIANCE.NS", sector: "Energy & Telecom", nativeCurrency: "INR", currencySymbol: "₹", basePrice: 1218.00, isIndian: true },
  "tcs": { fullName: "Tata Consultancy Services", ticker: "TCS.NS", sector: "IT Services", nativeCurrency: "INR", currencySymbol: "₹", basePrice: 3950.00, isIndian: true },
  "infosys": { fullName: "Infosys Limited", ticker: "INFY.NS", sector: "IT Services & Software", nativeCurrency: "INR", currencySymbol: "₹", basePrice: 1892.50, isIndian: true },
  "wipro": { fullName: "Wipro Limited", ticker: "WIPRO.NS", sector: "IT Consulting", nativeCurrency: "INR", currencySymbol: "₹", basePrice: 535.20, isIndian: true }
};

function generateStockData(query) {
  const clean = query.trim();
  const lower = clean.toLowerCase();

  for (const key of Object.keys(baseStocks)) {
    if (lower.includes(key)) {
      return buildMetrics(baseStocks[key]);
    }
  }

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const positiveHash = Math.abs(hash);

  const isIndian = lower.endsWith('.ns') || lower.endsWith('.bo') || lower.includes('india') || lower.includes('tata') || lower.includes('limited');
  const basePrice = (positiveHash % 800) + 45.50;
  const ticker = clean.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || "STK";

  return buildMetrics({
    fullName: clean.charAt(0).toUpperCase() + clean.slice(1),
    ticker: isIndian ? `${ticker}.NS` : ticker,
    sector: "Global Commercial Equities",
    nativeCurrency: isIndian ? "INR" : "USD",
    currencySymbol: isIndian ? "₹" : "$",
    basePrice: Number(basePrice.toFixed(2)),
    isIndian: isIndian
  });
}

function buildMetrics(item) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let currentPrice = item.basePrice;
  const history = [];

  days.forEach((day, idx) => {
    const dailyChangePercent = ((Math.sin(item.basePrice + idx * 1.5) * 2.8) + (idx > 3 ? 0.8 : -0.2));
    const openPrice = currentPrice;
    const closePrice = Number((openPrice * (1 + dailyChangePercent / 100)).toFixed(2));
    const isUp = closePrice >= openPrice;
    currentPrice = closePrice;

    history.push({
      day,
      price: closePrice,
      isUp: isUp,
      changePercent: dailyChangePercent.toFixed(2)
    });
  });

  const prices = history.map(h => h.price);
  const weekHigh = Math.max(...prices);
  const weekLow = Math.min(...prices);
  const firstPrice = history[0].price;
  const lastPrice = history[6].price;
  const totalChangePercent = (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2);
  const isPositive = totalChangePercent >= 0;

  const target = Number((lastPrice * (isPositive ? 1.058 : 1.022)).toFixed(2));
  const estGain = isPositive ? `+5.80%` : `+2.20%`;

  return {
    fullName: item.fullName,
    ticker: item.ticker,
    sector: item.sector,
    nativeCurrency: item.nativeCurrency,
    currencySymbol: item.currencySymbol,
    price: lastPrice,
    change: `${isPositive ? '+' : ''}${totalChangePercent}%`,
    isPositive: isPositive,
    target: target,
    estGain: estGain,
    confidence: "86.5%",
    signal: isPositive ? "STRONG BUY" : "HOLD",
    rsi: isPositive ? "58.2 (Neutral)" : "42.8 (Oversold)",
    macd: isPositive ? "Bullish Crossover" : "Consolidation",
    marketCap: item.currencySymbol === '₹' ? `₹${(item.basePrice * 13.5).toFixed(1)}T` : `$${(item.basePrice * 1.8).toFixed(1)}B`,
    high52: `${item.currencySymbol}${(weekHigh * 1.15).toFixed(2)}`,
    low52: `${item.currencySymbol}${(weekLow * 0.85).toFixed(2)}`,
    weekHigh: weekHigh,
    weekLow: weekLow,
    weeklyHistory: history
  };
}

app.get('/api/stock/search', (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  if (!query) {
    return res.json(Object.values(baseStocks).map(s => buildMetrics(s)));
  }

  const matches = Object.values(baseStocks)
    .filter(s => s.fullName.toLowerCase().includes(query) || s.ticker.toLowerCase().includes(query))
    .map(s => buildMetrics(s));

  if (matches.length === 0) {
    matches.push(generateStockData(query));
  }

  res.json(matches);
});

app.get('/api/stock/details', (req, res) => {
  const query = (req.query.symbol || 'Accenture').trim();
  res.json(generateStockData(query));
});

app.listen(PORT, () => {
  console.log(`Backend Server operational on http://localhost:${PORT}`);
});
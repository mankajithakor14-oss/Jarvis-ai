function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const symbol = String(
    req.query?.symbol || process.env.MARKET_SYMBOL_DEFAULT || "RELIANCE.NS"
  ).trim();

  if (!/^[A-Za-z0-9.^_-]{1,30}$/.test(symbol)) {
    return res.status(400).json({ error: "Invalid symbol" });
  }

  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
      `?range=6mo&interval=1d`;

    const response = await fetch(url, {
      headers: { "User-Agent": "Jarvis-AI/1.0" },
    });

    const data = await response.json();

    if (!response.ok || !data?.chart?.result?.[0]) {
      return res.status(502).json({ error: "Market data unavailable" });
    }

    const result = data.chart.result[0];
    const quote = result.indicators?.quote?.[0];
    const closes = (quote?.close || []).filter(
      (x) => typeof x === "number" && Number.isFinite(x)
    );

    if (!closes.length) {
      return res.status(502).json({ error: "No price data" });
    }

    const last = closes[closes.length - 1];
    const previous = closes.length > 1 ? closes[closes.length - 2] : last;
    const change = last - previous;
    const changePct = previous ? (change / previous) * 100 : 0;

    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);

    let trend = "NEUTRAL";
    if (sma20 && sma50) {
      if (last > sma20 && sma20 > sma50) trend = "UPTREND";
      else if (last < sma20 && sma20 < sma50) trend = "DOWNTREND";
    }

    return res.status(200).json({
      symbol,
      currency: result.meta?.currency || null,
      exchange: result.meta?.exchangeName || null,
      price: last,
      previousClose: previous,
      change,
      changePct,
      sma20,
      sma50,
      trend,
      asOf: new Date().toISOString(),
      source: "Yahoo Finance chart endpoint",
      note: "Informational market data; not financial advice.",
    });
  } catch (error) {
    console.error("MARKET ERROR:", error);
    return res.status(500).json({ error: "Market analysis failed" });
  }
}

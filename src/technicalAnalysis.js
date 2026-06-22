export function analyzeStock(candles) {
  if (!candles || candles.length < 50) return { error: 'Insufficient data' };

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const n = closes.length;
  const last = closes[n - 1];

  function calcRSI(data, period = 14) {
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = data[i] - data[i - 1];
      if (diff > 0) gains += diff; else losses -= diff;
    }
    let avgGain = gains / period, avgLoss = losses / period;
    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    }
    return avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  function calcEMA(data, period) {
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) ema = data[i] * k + ema * (1 - k);
    return ema;
  }

  function calcADX(period = 14) {
    let trSum = 0, dmPlusSum = 0, dmMinusSum = 0;
    for (let i = 1; i <= period; i++) {
      const tr = Math.max(highs[n-i] - lows[n-i], Math.abs(highs[n-i] - closes[n-i-1]), Math.abs(lows[n-i] - closes[n-i-1]));
      const dmPlus = Math.max(highs[n-i] - highs[n-i-1], 0);
      const dmMinus = Math.max(lows[n-i-1] - lows[n-i], 0);
      trSum += tr; dmPlusSum += dmPlus; dmMinusSum += dmMinus;
    }
    const diPlus = (dmPlusSum / trSum) * 100;
    const diMinus = (dmMinusSum / trSum) * 100;
    const adx = Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;
    return { adx: Math.round(adx), diPlus: Math.round(diPlus), diMinus: Math.round(diMinus) };
  }

  function calcSupertrend(period = 10, multiplier = 3) {
    const atr = closes.slice(-period).reduce((sum, _, i) => {
      const idx = n - period + i;
      return sum + Math.max(highs[idx] - lows[idx], Math.abs(highs[idx] - (closes[idx-1] || closes[idx])), Math.abs(lows[idx] - (closes[idx-1] || closes[idx])));
    }, 0) / period;
    const lowerBand = (highs[n-1] + lows[n-1]) / 2 - multiplier * atr;
    return last > lowerBand ? 'Bullish' : 'Bearish';
  }

  const rsi = Math.round(calcRSI(closes));
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macd = ema12 - ema26;
  const { adx, diPlus, diMinus } = calcADX();
  const supertrend = calcSupertrend();
  const momentum = macd > 0 ? 'Bullish' : 'Bearish';
  const trend = last > closes[n - 20] ? 'Bullish' : 'Bearish';
  const trendStrength = adx > 25 ? 'Strong' : adx > 20 ? 'Moderate' : 'Weak';

  const week52High = Math.max(...closes.slice(-252));
  const week52Low = Math.min(...closes.slice(-252));
  const distFromHighPct = (((week52High - last) / week52High) * 100).toFixed(1);

  let longScore = 0, shortScore = 0;
  if (trend === 'Bullish') longScore += 25; else shortScore += 25;
  if (momentum === 'Bullish') longScore += 20; else shortScore += 20;
  if (supertrend === 'Bullish') longScore += 20; else shortScore += 20;
  if (rsi > 50 && rsi < 70) longScore += 15; else if (rsi < 50 && rsi > 30) shortScore += 15;
  if (adx > 20) { longScore += 10; shortScore += 10; }
  if (diPlus > diMinus) longScore += 10; else shortScore += 10;

  const signal = longScore >= 70 ? 'LONG' : shortScore >= 70 ? 'SHORT' : null;
  const atr = closes.slice(-14).reduce((s, _, i) => s + Math.abs((closes[n-1-i] || 0) - (closes[n-2-i] || 0)), 0) / 14;

  return {
    lastClose: last,
    trend, momentum, rsi, adx, trendStrength, supertrend,
    longScore, shortScore, signal,
    week52High, week52Low, distFromHighPct,
    entry: last,
    stopLoss: trend === 'Bullish' ? last * 0.97 : last * 1.03,
    targets: [last * 1.03, last * 1.06, last * 1.10],
    suggestedHold: '~2 months',
    atr,
  };
}

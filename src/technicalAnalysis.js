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

  // FIX 1: ADX — corrected to walk forward through time (oldest -> newest)
  // instead of the old reversed-index loop which could swap DI+ / DI-.
  function calcADX(period = 14) {
    let trSum = 0, dmPlusSum = 0, dmMinusSum = 0;
    const start = n - period;
    for (let i = start; i < n; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];
      const dmPlus = (upMove > downMove && upMove > 0) ? upMove : 0;
      const dmMinus = (downMove > upMove && downMove > 0) ? downMove : 0;
      trSum += tr;
      dmPlusSum += dmPlus;
      dmMinusSum += dmMinus;
    }
    const diPlus = trSum === 0 ? 0 : (dmPlusSum / trSum) * 100;
    const diMinus = trSum === 0 ? 0 : (dmMinusSum / trSum) * 100;
    const diSum = diPlus + diMinus;
    const adx = diSum === 0 ? 0 : Math.abs(diPlus - diMinus) / diSum * 100;
    return { adx: Math.round(adx), diPlus: Math.round(diPlus), diMinus: Math.round(diMinus) };
  }

  // True ATR (Wilder's): true range over period, smoothed with RMA.
  // Walks oldest -> newest, used by both Supertrend and stopLoss/targets.
  function calcATR(period = 14) {
    const trs = [];
    for (let i = n - period - 1; i < n; i++) {
      if (i <= 0) continue;
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trs.push(tr);
    }
    if (trs.length === 0) return 0;
    let atr = trs[0];
    for (let i = 1; i < trs.length; i++) {
      atr = (atr * (period - 1) + trs[i]) / period;
    }
    return atr;
  }

  // FIX 2: Supertrend — proper banded calculation with trend continuity,
  // walked forward through the recent window instead of a single-candle check.
  function calcSupertrend(period = 10, multiplier = 3) {
    const lookback = Math.min(100, n - 1);
    const start = n - lookback;

    let prevUpperBand = null;
    let prevLowerBand = null;
    let trendUp = true; // assume starting trend; will self-correct as it walks forward

    for (let i = start; i < n; i++) {
      // ATR at this point in time, using the same Wilder method, period-sized window
      let trSum = 0;
      const trStart = Math.max(1, i - period + 1);
      let count = 0;
      for (let j = trStart; j <= i; j++) {
        trSum += Math.max(
          highs[j] - lows[j],
          Math.abs(highs[j] - closes[j - 1]),
          Math.abs(lows[j] - closes[j - 1])
        );
        count++;
      }
      const atrLocal = count === 0 ? 0 : trSum / count;

      const mid = (highs[i] + lows[i]) / 2;
      let basicUpper = mid + multiplier * atrLocal;
      let basicLower = mid - multiplier * atrLocal;

      const finalUpper = (prevUpperBand === null || closes[i - 1] > prevUpperBand)
        ? basicUpper
        : Math.min(basicUpper, prevUpperBand);

      const finalLower = (prevLowerBand === null || closes[i - 1] < prevLowerBand)
        ? basicLower
        : Math.max(basicLower, prevLowerBand);

      if (trendUp) {
        if (closes[i] < finalLower) trendUp = false;
      } else {
        if (closes[i] > finalUpper) trendUp = true;
      }

      prevUpperBand = finalUpper;
      prevLowerBand = finalLower;
    }

    return trendUp ? 'Bullish' : 'Bearish';
  }

  const rsi = Math.round(calcRSI(closes));
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macd = ema12 - ema26;
  const { adx, diPlus, diMinus } = calcADX();
  const atr = calcATR(14);
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

  // FIX 3: ATR-based stop loss & targets instead of fixed 3%/6%/10%.
  // Stop = 1.5x ATR away from entry (volatility-adjusted).
  // Targets = 1x, 2x, 3x the stop distance (risk-multiple based).
  const stopDistance = atr * 1.5;
  const stopLoss = trend === 'Bullish' ? last - stopDistance : last + stopDistance;
  const targets = trend === 'Bullish'
    ? [last + stopDistance * 1, last + stopDistance * 2, last + stopDistance * 3]
    : [last - stopDistance * 1, last - stopDistance * 2, last - stopDistance * 3];

  return {
    lastClose: last,
    trend, momentum, rsi, adx, trendStrength, supertrend,
    longScore, shortScore, signal,
    week52High, week52Low, distFromHighPct,
    entry: last,
    stopLoss,
    targets,
    suggestedHold: '~2 months',
    atr,
  };
}

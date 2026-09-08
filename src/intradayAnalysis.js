// Intraday version of technicalAnalysis.js — 5-15 min candles ke liye tuned.
// Swing wale analyzeStock() se alag hai kyunki:
// - Sab indicator periods chhote hain (fast-moving intraday ke liye)
// - Stop loss aur targets bahut tight hain (same-din square-off, bade % moves nahi hote)
// - "Suggested Hold" ki jagah "Square-off by 3:15 PM" jaisa note hota hai

export function analyzeIntraday(candles) {
  if (!candles || candles.length < 30) return { error: 'Insufficient intraday data' };

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume || 0);
  const n = closes.length;
  const last = closes[n - 1];

  function calcRSI(data, period) {
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

  function calcADX(period) {
    let trSum = 0, dmPlusSum = 0, dmMinusSum = 0;
    const start = Math.max(1, n - period);
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

  function calcATR(period) {
    const trs = [];
    for (let i = Math.max(1, n - period - 1); i < n; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trs.push(tr);
    }
    if (trs.length === 0) return 0;
    let atr = trs[0];
    for (let i = 1; i < trs.length; i++) atr = (atr * (period - 1) + trs[i]) / period;
    return atr;
  }

  function calcSupertrend(period, multiplier) {
    const lookback = Math.min(60, n - 1);
    const start = n - lookback;
    let prevUpperBand = null, prevLowerBand = null, trendUp = true;

    for (let i = start; i < n; i++) {
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
      const basicUpper = mid + multiplier * atrLocal;
      const basicLower = mid - multiplier * atrLocal;
      const finalUpper = (prevUpperBand === null || closes[i - 1] > prevUpperBand) ? basicUpper : Math.min(basicUpper, prevUpperBand);
      const finalLower = (prevLowerBand === null || closes[i - 1] < prevLowerBand) ? basicLower : Math.max(basicLower, prevLowerBand);
      if (trendUp) { if (closes[i] < finalLower) trendUp = false; }
      else { if (closes[i] > finalUpper) trendUp = true; }
      prevUpperBand = finalUpper;
      prevLowerBand = finalLower;
    }
    return trendUp ? 'Bullish' : 'Bearish';
  }

  // Intraday-tuned periods — chhote timeframe pe fast-reacting indicators chahiye
  const rsi = Math.round(calcRSI(closes, 9));
  const ema5 = calcEMA(closes, 5);
  const ema13 = calcEMA(closes, 13);
  const macd = ema5 - ema13;
  const { adx, diPlus, diMinus } = calcADX(9);
  const atr = calcATR(9);
  const supertrend = calcSupertrend(7, 2);

  const trendLookback = Math.min(10, n - 1);
  const trend = last > closes[n - 1 - trendLookback] ? 'Bullish' : 'Bearish';
  const momentum = macd > 0 ? 'Bullish' : 'Bearish';
  const trendStrength = adx > 25 ? 'Strong' : adx > 20 ? 'Moderate' : 'Weak';

  const dayHigh = Math.max(...highs.slice(-Math.min(75, n)));
  const dayLow = Math.min(...lows.slice(-Math.min(75, n)));

  let longScore = 0, shortScore = 0;
  if (trend === 'Bullish') longScore += 25; else shortScore += 25;
  if (momentum === 'Bullish') longScore += 20; else shortScore += 20;
  if (supertrend === 'Bullish') longScore += 20; else shortScore += 20;
  if (rsi > 50 && rsi < 70) longScore += 15; else if (rsi < 50 && rsi > 30) shortScore += 15;
  if (adx > 20) { longScore += 10; shortScore += 10; }
  if (diPlus > diMinus) longScore += 10; else shortScore += 10;

  const longCoreAgree = trend === 'Bullish' && momentum === 'Bullish' && supertrend === 'Bullish';
  const shortCoreAgree = trend === 'Bearish' && momentum === 'Bearish' && supertrend === 'Bearish';

  const volPeriod = Math.min(20, n - 1);
  const avgVolume = volumes.slice(n - volPeriod, n - 1).reduce((a, b) => a + b, 0) / volPeriod;
  const lastVolume = volumes[n - 1];
  const volumeConfirmed = avgVolume > 0 && lastVolume >= avgVolume;

  const diGap = Math.abs(diPlus - diMinus);
  const diGapConfirmed = diGap >= 4; // intraday mein thoda relaxed gap, chhota timeframe hai

  const signal = (adx > 22 && volumeConfirmed && diGapConfirmed)
    ? (longCoreAgree && longScore >= 85 ? 'LONG' : shortCoreAgree && shortScore >= 85 ? 'SHORT' : null)
    : null;

  // Intraday stop loss/targets — same-din square-off hai isliye bahut tight rakhte hain.
  // Stop = 1x ATR (swing ke 1.5x se chhota), Targets = 1x/1.5x/2x stop distance
  // (swing ke 1x/2x/3x se chhote — intraday mein utna bada move expect nahi karte)
  const stopDistance = atr * 1.0;
  const stopLoss = trend === 'Bullish' ? last - stopDistance : last + stopDistance;
  const targets = trend === 'Bullish'
    ? [last + stopDistance * 1, last + stopDistance * 1.5, last + stopDistance * 2]
    : [last - stopDistance * 1, last - stopDistance * 1.5, last - stopDistance * 2];

  return {
    lastClose: last,
    trend, momentum, rsi, adx, trendStrength, supertrend,
    longScore, shortScore, signal,
    dayHigh, dayLow,
    entry: last,
    stopLoss,
    targets,
    squareOffNote: '⏰ Intraday hai — 3:15 PM tak zaroor square-off karo, chahe target/SL na laga ho',
    atr,
  };
}

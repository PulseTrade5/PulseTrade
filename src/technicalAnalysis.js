function sma(values, period) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

function ema(values, period) {
  const out = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) continue;
    if (prev == null) {
      prev = values[i];
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out[i] = prev;
  }
  return out;
}

function rsi(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
  }
  return out;
}

function macd(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = closes.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i] - emaSlow[i] : null
  );
  const signalLine = ema(
    macdLine.map((v) => (v == null ? 0 : v)),
    signal
  );
  const hist = macdLine.map((v, i) => (v != null && signalLine[i] != null ? v - signalLine[i] : null));
  return { macdLine, signalLine, hist };
}

function trueRange(candles) {
  return candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
  });
}

function atr(candles, period = 14) {
  const tr = trueRange(candles);
  const out = new Array(candles.length).fill(null);
  let prevAtr = null;
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) continue;
    if (i === period - 1) {
      const sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
      prevAtr = sum / period;
    } else {
      prevAtr = (prevAtr * (period - 1) + tr[i]) / period;
    }
    out[i] = prevAtr;
  }
  return out;
}

function dmiAdx(candles, period = 14) {
  const len = candles.length;
  const plusDM = new Array(len).fill(0);
  const minusDM = new Array(len).fill(0);
  for (let i = 1; i < len; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
  }
  const tr = trueRange(candles);

  const smoothedTR = wilderSmooth(tr, period);
  const smoothedPlusDM = wilderSmooth(plusDM, period);
  const smoothedMinusDM = wilderSmooth(minusDM, period);

  const diPlus = smoothedTR.map((v, i) => (v ? (smoothedPlusDM[i] / v) * 100 : null));
  const diMinus = smoothedTR.map((v, i) => (v ? (smoothedMinusDM[i] / v) * 100 : null));

  const dx = diPlus.map((p, i) => {
    const m = diMinus[i];
    if (p == null || m == null || p + m === 0) return null;
    return (Math.abs(p - m) / (p + m)) * 100;
  });

  const adx = wilderSmooth(
    dx.map((v) => (v == null ? 0 : v)),
    period
  );

  return { diPlus, diMinus, adx };
}

function wilderSmooth(values, period) {
  const out = new Array(values.length).fill(null);
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) continue;
    if (i === period - 1) {
      const sum = values.slice(0, period).reduce((a, b) => a + b, 0);
      prev = sum / period;
    } else {
      prev = (prev * (period - 1) + values[i]) / period;
    }
    out[i] = prev;
  }
  return out;
}

function supertrend(candles, factor = 3, atrPeriod = 10) {
  const atrVals = atr(candles, atrPeriod);
  const len = candles.length;
  const st = new Array(len).fill(null);
  const dir = new Array(len).fill(null);

  let upperBand = null;
  let lowerBand = null;
  let prevSt = null;
  let prevDir = -1;

  for (let i = 0; i < len; i++) {
    if (atrVals[i] == null) continue;
    const mid = (candles[i].high + candles[i].low) / 2;
    let basicUpper = mid + factor * atrVals[i];
    let basicLower = mid - factor * atrVals[i];

    if (upperBand == null) {
      upperBand = basicUpper;
      lowerBand = basicLower;
    } else {
      upperBand = basicUpper < upperBand || candles[i - 1].close > upperBand ? basicUpper : upperBand;
      lowerBand = basicLower > lowerBand || candles[i - 1].close < lowerBand ? basicLower : lowerBand;
    }

    let curDir = prevDir;
    if (prevSt === upperBand) {
      curDir = candles[i].close > upperBand ? -1 : 1;
    } else if (prevSt === lowerBand) {
      curDir = candles[i].close < lowerBand ? 1 : -1;
    } else {
      curDir = candles[i].close > upperBand ? -1 : candles[i].close < lowerBand ? 1 : prevDir;
    }

    const curSt = curDir === -1 ? lowerBand : upperBand;
    st[i] = curSt;
    dir[i] = curDir;
    prevSt = curSt;
    prevDir = curDir;
  }

  return { st, dir };
}

export function analyzeStock(candles, options = {}) {
  const {
    emaFastLen = 20,
    emaMedLen = 50,
    emaSlowLen = 200,
    rsiLen = 14,
    macdFast = 12,
    macdSlow = 26,
    macdSig = 9,
    adxLen = 14,
    adxThreshold = 20,
    atrLen = 14,
    atrMult = 2.0,
    stFactor = 3.0,
    stAtrLen = 10,
    minScore = 65,
  } = options;

  if (!candles || candles.length < emaSlowLen + 5) {
    return { error: 'Not enough candles for analysis (need at least ' + (emaSlowLen + 5) + ')' };
  }

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const last = candles.length - 1;

  const emaFastArr = ema(closes, emaFastLen);
  const emaMedArr = ema(closes, emaMedLen);
  const emaSlowArr = ema(closes, emaSlowLen);

  const rsiArr = rsi(closes, rsiLen);
  const { macdLine, signalLine } = macd(closes, macdFast, macdSlow, macdSig);

  const { diPlus, diMinus, adx } = dmiAdx(candles, adxLen);
  const atrArr = atr(candles, atrLen);
  const { st, dir } = supertrend(candles, stFactor, stAtrLen);
  const volAvgArr = sma(volumes, 20);

  const last20High = Math.max(...candles.slice(Math.max(0, last - 19), last + 1).map((c) => c.high));
  const last20Low = Math.min(...candles.slice(Math.max(0, last - 19), last + 1).map((c) => c.low));
  const high252 = Math.max(...candles.slice(Math.max(0, last - 251), last + 1).map((c) => c.high));
  const low252 = Math.min(...candles.slice(Math.max(0, last - 251), last + 1).map((c) => c.low));

  const close = closes[last];
  const trendUp = emaFastArr[last] > emaMedArr[last] && emaMedArr[last] > emaSlowArr[last];
  const trendDown = emaFastArr[last] < emaMedArr[last] && emaMedArr[last] < emaSlowArr[last];
  const macdBullish = macdLine[last] > signalLine[last];
  const macdBearish = macdLine[last] < signalLine[last];
  const strongTrend = adx[last] > adxThreshold;
  const stBullish = dir[last] === -1;
  const stBearish = dir[last] === 1;
  const aboveAvgVolume = volumes[last] > volAvgArr[last];

  let longScore = 0;
  longScore += trendUp ? 25 : 0;
  longScore += macdBullish ? 20 : 0;
  longScore += rsiArr[last] >= 40 && rsiArr[last] <= 68 ? 15 : rsiArr[last] < 30 ? 10 : 0;
  longScore += stBullish ? 20 : 0;
  longScore += strongTrend ? 10 : 0;
  longScore += aboveAvgVolume ? 10 : 0;

  let shortScore = 0;
  shortScore += trendDown ? 25 : 0;
  shortScore += macdBearish ? 20 : 0;
  shortScore += rsiArr[last] <= 60 && rsiArr[last] >= 32 ? 15 : rsiArr[last] > 70 ? 10 : 0;
  shortScore += stBearish ? 20 : 0;
  shortScore += strongTrend ? 10 : 0;
  shortScore += aboveAvgVolume ? 10 : 0;

  let fBull = 0, fBear = 0, fNeut = 0;
  if (trendUp) fBull++; else if (trendDown) fBear++; else fNeut++;
  if (macdBullish) fBull++; else fBear++;
  if (stBullish) fBull++; else fBear++;
  if (rsiArr[last] > 55) fBull++; else if (rsiArr[last] < 45) fBear++; else fNeut++;
  if (strongTrend && trendUp) fBull++; else if (strongTrend && trendDown) fBear++; else fNeut++;
  const totalF = fBull + fBear + fNeut;
  const bullPct = totalF > 0 ? Math.round((fBull / totalF) * 100) : 0;
  const bearPct = totalF > 0 ? Math.round((fBear / totalF) * 100) : 0;

  const gaugePct =
    last20High > last20Low ? Math.min(100, Math.max(0, ((close - last20Low) / (last20High - last20Low)) * 100)) : 50;

  const longSignal = trendUp && stBullish && macdBullish && longScore >= minScore;
  const shortSignal = trendDown && stBearish && macdBearish && shortScore >= minScore;

  let entry = null, stopLoss = null, target1 = null, target2 = null, target3 = null, direction = null;
  const atrPercent = atrArr[last] ? (atrArr[last] / close) * 100 : null;
  const holdGuess = atrPercent > 4 ? '3-5 din' : atrPercent > 2 ? '5-10 din' : '10-20 din';

  if (longSignal) {
    direction = 'LONG';
    entry = close;
    stopLoss = close - atrArr[last] * atrMult;
    const risk = entry - stopLoss;
    target1 = entry + risk * 1;
    target2 = entry + risk * 2;
    target3 = entry + risk * 3;
  } else if (shortSignal) {
    direction = 'SHORT';
    entry = close;
    stopLoss = close + atrArr[last] * atrMult;
    const risk = stopLoss - entry;
    target1 = entry - risk * 1;
    target2 = entry - risk * 2;
    target3 = entry - risk * 3;
  }

  return {
    lastClose: close,
    trend: trendUp ? 'Bullish' : trendDown ? 'Bearish' : 'Sideways',
    momentum: macdBullish ? 'Bullish' : 'Bearish',
    rsi: rsiArr[last] != null ? Number(rsiArr[last].toFixed(1)) : null,
    adx: adx[last] != null ? Number(adx[last].toFixed(1)) : null,
    trendStrength: strongTrend ? 'Strong' : 'Weak',
    supertrend: stBullish ? 'Bullish' : 'Bearish',
    technicalAlignment: { bullPct, bearPct, neutralPct: 100 - bullPct - bearPct },
    supportResistanceGaugePct: Math.round(gaugePct),
    longScore,
    shortScore,
    signal: direction,
    entry: entry != null ? Number(entry.toFixed(2)) : null,
    stopLoss: stopLoss != null ? Number(stopLoss.toFixed(2)) : null,
    targets: entry != null ? [Number(target1.toFixed(2)), Number(target2.toFixed(2)), Number(target3.toFixed(2))] : null,
    suggestedHold: holdGuess,
    week52High: Number(high252.toFixed(2)),
    week52Low: Number(low252.toFixed(2)),
    distFromHighPct: Number((((close - high252) / high252) * 100).toFixed(2)),
  };
}

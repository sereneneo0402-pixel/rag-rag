import { CandleData, TimeFrame, VolumeProfileBucket, TimeAndSalesPrint } from '../types/market';

/**
 * Generates realistic historical OHLCV candlestick data for any ticker and timeframe
 */
export function generateCandles(
  basePrice: number,
  timeframe: TimeFrame = '1D',
  count: number = 90
): CandleData[] {
  const candles: CandleData[] = [];
  const now = Date.now();
  
  const timeframeMs: Record<TimeFrame, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1H': 60 * 60 * 1000,
    '4H': 4 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000,
    '1W': 7 * 24 * 60 * 60 * 1000,
  };

  const interval = timeframeMs[timeframe] || 24 * 60 * 60 * 1000;
  let currentPrice = basePrice * (0.88 + Math.random() * 0.08);

  const volatility = basePrice > 10000 ? 0.012 : basePrice > 1000 ? 0.009 : basePrice < 2 ? 0.004 : 0.014;

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - i * interval;
    const dateObj = new Date(timestamp);
    const timeStr = timeframe === '1D' || timeframe === '1W'
      ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    const cycle = Math.sin(i / 5.5) * 0.008;
    const changePct = (Math.random() - 0.485) * volatility * 2 + cycle;
    const open = currentPrice;
    const close = Math.max(0.0001, open * (1 + changePct));
    
    const maxVal = Math.max(open, close);
    const minVal = Math.min(open, close);
    const high = maxVal + Math.random() * maxVal * (volatility * 0.65);
    const low = Math.max(0.0001, minVal - Math.random() * minVal * (volatility * 0.65));

    const baseVol = basePrice > 1000 ? 2500 : 150000;
    const volume = Math.round(baseVol * (0.6 + Math.random() * 0.8 + Math.abs(changePct) * 20));

    candles.push({
      time: timeStr,
      timestamp,
      open: Number(open.toFixed(basePrice < 2 ? 4 : 2)),
      high: Number(high.toFixed(basePrice < 2 ? 4 : 2)),
      low: Number(low.toFixed(basePrice < 2 ? 4 : 2)),
      close: Number(close.toFixed(basePrice < 2 ? 4 : 2)),
      volume,
    });

    currentPrice = close;
  }

  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = basePrice;
    last.high = Math.max(last.high, basePrice);
    last.low = Math.min(last.low, basePrice);
  }

  return candles;
}

/**
 * Calculates Simple Moving Average
 */
export function calculateSMA(data: CandleData[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push(Number((sum / period).toFixed(2)));
  }
  return result;
}

/**
 * Calculates Exponential Moving Average
 */
export function calculateEMA(data: CandleData[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (prevEma === null) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      prevEma = sum / period;
    } else {
      prevEma = data[i].close * k + prevEma * (1 - k);
    }
    result.push(Number(prevEma.toFixed(2)));
  }
  return result;
}

/**
 * Calculates Bollinger Bands (Upper, Middle, Lower)
 */
export function calculateBollingerBands(data: CandleData[], period: number = 20, multiplier: number = 2) {
  const middle = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    const mid = middle[i];
    if (mid === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let sumSquares = 0;
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - mid;
      sumSquares += diff * diff;
    }
    const stdDev = Math.sqrt(sumSquares / period);
    upper.push(Number((mid + multiplier * stdDev).toFixed(2)));
    lower.push(Number((mid - multiplier * stdDev).toFixed(2)));
  }

  return { middle, upper, lower };
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(data: CandleData[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (data.length <= period) {
    return data.map(() => null);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(Number((100 - 100 / (1 + rs)).toFixed(1)));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(Number((100 - 100 / (1 + rs)).toFixed(1)));
  }

  return result;
}

/**
 * Calculates MACD (MACD line, signal line, histogram)
 */
export function calculateMACD(data: CandleData[]) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine.push(Number((ema12[i]! - ema26[i]!).toFixed(2)));
    } else {
      macdLine.push(null);
    }
  }

  const validMacd = macdLine.filter((v): v is number => v !== null);
  const signalLineRaw: (number | null)[] = [];
  const k = 2 / (9 + 1);
  let prevSignal: number | null = null;

  for (let i = 0; i < validMacd.length; i++) {
    if (i < 8) {
      signalLineRaw.push(null);
      continue;
    }
    if (prevSignal === null) {
      let sum = 0;
      for (let j = 0; j < 9; j++) sum += validMacd[i - j];
      prevSignal = sum / 9;
    } else {
      prevSignal = validMacd[i] * k + prevSignal * (1 - k);
    }
    signalLineRaw.push(Number(prevSignal.toFixed(2)));
  }

  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];
  const offset = data.length - validMacd.length;

  for (let i = 0; i < data.length; i++) {
    if (i < offset) {
      signalLine.push(null);
      histogram.push(null);
    } else {
      const sigVal = signalLineRaw[i - offset] ?? null;
      const macdVal = macdLine[i];
      signalLine.push(sigVal);
      if (sigVal !== null && macdVal !== null) {
        histogram.push(Number((macdVal - sigVal).toFixed(2)));
      } else {
        histogram.push(null);
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Converts regular candles to Heikin-Ashi candlesticks
 */
export function convertToHeikinAshi(candles: CandleData[]): CandleData[] {
  if (candles.length === 0) return [];
  const haCandles: CandleData[] = [];

  for (let i = 0; i < candles.length; i++) {
    const current = candles[i];
    const haClose = (current.open + current.high + current.low + current.close) / 4;
    let haOpen: number;
    if (i === 0) {
      haOpen = (current.open + current.close) / 2;
    } else {
      haOpen = (haCandles[i - 1].open + haCandles[i - 1].close) / 2;
    }

    const haHigh = Math.max(current.high, haOpen, haClose);
    const haLow = Math.min(current.low, haOpen, haClose);

    haCandles.push({
      ...current,
      open: Number(haOpen.toFixed(2)),
      high: Number(haHigh.toFixed(2)),
      low: Number(haLow.toFixed(2)),
      close: Number(haClose.toFixed(2)),
    });
  }

  return haCandles;
}

/**
 * Calculates Visible Range Volume Profile (VRVP) - TradingView PRO Signature Feature!
 * Divides price range into 24 horizontal bins and distributes candle volume,
 * finding POC (Point of Control) and Value Area (70% highest volume range).
 */
export function calculateVolumeProfile(candles: CandleData[], binsCount: number = 24): VolumeProfileBucket[] {
  if (candles.length === 0) return [];

  const min = Math.min(...candles.map(c => c.low));
  const max = Math.max(...candles.map(c => c.high));
  const range = max - min || 1;
  const binStep = range / binsCount;

  const buckets: { price: number; volume: number }[] = [];
  for (let i = 0; i < binsCount; i++) {
    buckets.push({
      price: min + (i + 0.5) * binStep,
      volume: 0,
    });
  }

  let totalVol = 0;
  candles.forEach((c) => {
    // Distribute volume into bins between low and high
    const lowBin = Math.max(0, Math.min(binsCount - 1, Math.floor((c.low - min) / binStep)));
    const highBin = Math.max(0, Math.min(binsCount - 1, Math.floor((c.high - min) / binStep)));
    const count = highBin - lowBin + 1;
    const volPerBin = c.volume / count;

    for (let b = lowBin; b <= highBin; b++) {
      buckets[b].volume += volPerBin;
      totalVol += volPerBin;
    }
  });

  // Find POC (Point of Control)
  let maxVol = 0;
  let pocIndex = 0;
  buckets.forEach((b, idx) => {
    if (b.volume > maxVol) {
      maxVol = b.volume;
      pocIndex = idx;
    }
  });

  // Find 70% Value Area
  const sortedBins = [...buckets].sort((a, b) => b.volume - a.volume);
  let accumulated = 0;
  const target70 = totalVol * 0.7;
  const valueAreaPrices = new Set<number>();

  for (const sb of sortedBins) {
    valueAreaPrices.add(sb.price);
    accumulated += sb.volume;
    if (accumulated >= target70) break;
  }

  return buckets.map((b, idx) => ({
    price: Number(b.price.toFixed(2)),
    volume: Math.round(b.volume),
    isPOC: idx === pocIndex,
    isValueArea: valueAreaPrices.has(b.price),
  }));
}

/**
 * Calculates Fibonacci Retracement Levels between high and low
 */
export function calculateFibonacciLevels(highPrice: number, lowPrice: number) {
  const diff = highPrice - lowPrice;
  return [
    { ratio: '0.0 (High)', price: highPrice, color: '#787b86' },
    { ratio: '0.236', price: highPrice - diff * 0.236, color: '#f23645' },
    { ratio: '0.382', price: highPrice - diff * 0.382, color: '#f59e0b' },
    { ratio: '0.500 (Mid)', price: highPrice - diff * 0.5, color: '#089981' },
    { ratio: '0.618 (Golden)', price: highPrice - diff * 0.618, color: '#2962ff' },
    { ratio: '0.786', price: highPrice - diff * 0.786, color: '#a855f7' },
    { ratio: '1.0 (Low)', price: lowPrice, color: '#787b86' },
  ];
}

/**
 * Generates institutional streaming Time & Sales trade prints
 */
export function generateInitialTimeAndSales(currentPrice: number): TimeAndSalesPrint[] {
  const prints: TimeAndSalesPrint[] = [];
  const now = Date.now();

  for (let i = 12; i >= 0; i--) {
    const isBuy = Math.random() > 0.47;
    const delta = (Math.random() * 0.001) * (isBuy ? 1 : -1);
    const p = currentPrice * (1 + delta);
    const date = new Date(now - i * 1800);
    prints.push({
      id: `print-${now}-${i}`,
      time: date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: Number(p.toFixed(currentPrice < 2 ? 4 : 2)),
      size: Math.round(10 + Math.random() * 250),
      side: isBuy ? 'buy' : 'sell',
    });
  }

  return prints;
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MarketTicker, TimeFrame, ChartType, IndicatorSettings, CandleData } from '../../types/market';
import { 
  generateCandles, calculateEMA, calculateSMA, calculateBollingerBands, 
  calculateRSI, calculateMACD, convertToHeikinAshi 
} from '../../utils/chartGenerators';
import { 
  Maximize2, RotateCcw, Sliders, TrendingUp, TrendingDown,
  BarChart2, Activity, Eye, EyeOff, Layers, Trash2, Crosshair, 
  Minus, Percent, DollarSign, PenTool, Check
} from 'lucide-react';

interface SuperChartProps {
  ticker: MarketTicker;
  onOpenTrading: (side: 'buy' | 'sell') => void;
  onOpenSearch: () => void;
}

interface DrawnLine {
  id: string;
  type: 'horizontal' | 'trend';
  y1: number;
  y2?: number;
  price: number;
}

export const SuperChart: React.FC<SuperChartProps> = ({
  ticker,
  onOpenTrading,
  onOpenSearch,
}) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1D');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    showEma20: true,
    showEma50: false,
    showSma200: false,
    showBollinger: false,
    showVolume: true,
    showRsi: true,
    showMacd: false,
    showVolumeProfile: false,
    showStochastic: false,
  });

  const [activeDrawingTool, setActiveDrawingTool] = useState<'crosshair' | 'horizontal' | 'trend' | null>('crosshair');
  const [drawnLines, setDrawnLines] = useState<DrawnLine[]>([]);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Generate historical candles
  const rawCandles = useMemo(() => {
    return generateCandles(ticker.price, timeframe, 70);
  }, [ticker.symbol, ticker.price, timeframe]);

  // Handle Heikin-Ashi conversion if selected
  const candles = useMemo(() => {
    if (chartType === 'heikinAshi') {
      return convertToHeikinAshi(rawCandles);
    }
    return rawCandles;
  }, [rawCandles, chartType]);

  // Technical Indicators calculations
  const ema20 = useMemo(() => calculateEMA(candles, 20), [candles]);
  const ema50 = useMemo(() => calculateEMA(candles, 50), [candles]);
  const sma200 = useMemo(() => calculateSMA(candles, 200), [candles]);
  const bollinger = useMemo(() => calculateBollingerBands(candles, 20, 2), [candles]);
  const rsi = useMemo(() => calculateRSI(candles, 14), [candles]);
  const macd = useMemo(() => calculateMACD(candles), [candles]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Min and Max price for scaling
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 100 };
    let min = Math.min(...candles.map(c => c.low));
    let max = Math.max(...candles.map(c => c.high));
    const maxVol = Math.max(...candles.map(c => c.volume));

    // Pad by 3% for clean breathing room
    const padding = (max - min) * 0.05 || max * 0.05;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      maxVolume: maxVol,
    };
  }, [candles]);

  const priceRange = maxPrice - minPrice || 1;

  // Chart Dimensions
  const chartHeight = indicators.showRsi || indicators.showMacd ? 340 : 460;
  const subChartHeight = 110;
  const candleCount = candles.length;
  const candleWidth = 9;
  const candleGap = 5;
  const totalWidth = Math.max(800, candleCount * (candleWidth + candleGap) + 100);

  // Coordinate helper: price to Y
  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * (chartHeight - 40) - 20;
  };

  // Coordinate helper: Y to price
  const getPriceFromY = (y: number) => {
    const ratio = (chartHeight - 20 - y) / (chartHeight - 40);
    return minPrice + ratio * priceRange;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Determine which candle is hovered
    const candleIndex = Math.floor(x / (candleWidth + candleGap));
    if (candleIndex >= 0 && candleIndex < candles.length) {
      setHoveredCandle(candles[candleIndex]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredCandle(null);
  };

  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeDrawingTool === 'horizontal' && mousePos) {
      const price = getPriceFromY(mousePos.y);
      setDrawnLines([
        ...drawnLines,
        {
          id: `line-${Date.now()}`,
          type: 'horizontal',
          y1: mousePos.y,
          price,
        },
      ]);
      setActiveDrawingTool('crosshair');
    }
  };

  const clearDrawings = () => setDrawnLines([]);

  const currentDisplayCandle = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null);
  const isUp = ticker.change >= 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 flex flex-col gap-3 select-none">
      
      {/* 1. SuperChart Header Strip */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Symbol identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-[#131722] border border-[#2a2e39] hover:border-[#2962ff] transition-all text-left group"
          >
            <div className="w-7 h-7 rounded bg-[#2962ff] flex items-center justify-center font-mono font-bold text-xs text-white">
              {ticker.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm group-hover:text-[#2962ff]">
                  {ticker.symbol}
                </span>
                <span className="text-[10px] text-[#787b86] uppercase font-semibold">
                  {ticker.assetClass}
                </span>
              </div>
              <span className="text-[11px] text-[#787b86] hidden sm:inline">{ticker.name}</span>
            </div>
          </button>

          {/* Live Price and Change */}
          <div className="font-mono tabular-nums">
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {ticker.price < 2
                ? ticker.price.toFixed(4)
                : ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div
              className={`text-xs font-semibold flex items-center ${
                isUp ? 'text-[#089981]' : 'text-[#f23645]'
              }`}
            >
              {isUp ? '+' : ''}{ticker.change.toFixed(2)} ({isUp ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* OHLC readout of active candle */}
        {currentDisplayCandle && (
          <div className="hidden md:flex items-center gap-3 text-xs font-mono tabular-nums text-[#787b86] bg-[#131722] px-3 py-1.5 rounded-lg border border-[#2a2e39]">
            <div>O: <span className="text-white font-semibold">{currentDisplayCandle.open}</span></div>
            <div>H: <span className="text-[#089981] font-semibold">{currentDisplayCandle.high}</span></div>
            <div>L: <span className="text-[#f23645] font-semibold">{currentDisplayCandle.low}</span></div>
            <div>C: <span className="text-white font-semibold">{currentDisplayCandle.close}</span></div>
            <div>Vol: <span className="text-white font-semibold">{currentDisplayCandle.volume.toLocaleString()}</span></div>
          </div>
        )}

        {/* Quick Order Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenTrading('sell')}
            className="px-3.5 py-1.5 rounded-md bg-[#f23645] hover:bg-[#d92231] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
          >
            Sell
          </button>
          <button
            onClick={() => onOpenTrading('buy')}
            className="px-3.5 py-1.5 rounded-md bg-[#089981] hover:bg-[#067a67] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
          >
            Buy
          </button>
        </div>
      </div>

      {/* 2. Chart Toolbar Controls */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Timeframes */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(['1m', '5m', '15m', '1H', '4H', '1D', '1W'] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                timeframe === tf
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Style Switcher */}
        <div className="flex items-center gap-1 bg-[#131722] p-1 rounded-lg border border-[#2a2e39]">
          <button
            onClick={() => setChartType('candlestick')}
            title="Candlesticks"
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              chartType === 'candlestick' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
            }`}
          >
            Candles
          </button>
          <button
            onClick={() => setChartType('heikinAshi')}
            title="Heikin Ashi"
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              chartType === 'heikinAshi' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
            }`}
          >
            Heikin Ashi
          </button>
          <button
            onClick={() => setChartType('area')}
            title="Area"
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              chartType === 'area' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('line')}
            title="Line"
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              chartType === 'line' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
            }`}
          >
            Line
          </button>
        </div>

        {/* Indicators Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setIndicators(prev => ({ ...prev, showEma20: !prev.showEma20 }))}
            className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors ${
              indicators.showEma20
                ? 'bg-[#2962ff]/20 text-[#2962ff] border-[#2962ff]'
                : 'text-[#787b86] border-[#2a2e39] hover:text-white'
            }`}
          >
            EMA 20
          </button>
          <button
            onClick={() => setIndicators(prev => ({ ...prev, showEma50: !prev.showEma50 }))}
            className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors ${
              indicators.showEma50
                ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                : 'text-[#787b86] border-[#2a2e39] hover:text-white'
            }`}
          >
            EMA 50
          </button>
          <button
            onClick={() => setIndicators(prev => ({ ...prev, showBollinger: !prev.showBollinger }))}
            className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors ${
              indicators.showBollinger
                ? 'bg-purple-500/20 text-purple-400 border-purple-500'
                : 'text-[#787b86] border-[#2a2e39] hover:text-white'
            }`}
          >
            Bollinger
          </button>
          <button
            onClick={() => setIndicators(prev => ({ ...prev, showRsi: !prev.showRsi }))}
            className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors ${
              indicators.showRsi
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500'
                : 'text-[#787b86] border-[#2a2e39] hover:text-white'
            }`}
          >
            RSI 14
          </button>
          <button
            onClick={() => setIndicators(prev => ({ ...prev, showMacd: !prev.showMacd }))}
            className={`px-2 py-1 rounded border text-[11px] font-semibold transition-colors ${
              indicators.showMacd
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                : 'text-[#787b86] border-[#2a2e39] hover:text-white'
            }`}
          >
            MACD
          </button>
        </div>
      </div>

      {/* 3. Main Chart Viewport + Left Drawing Tools */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl overflow-hidden flex relative">
        
        {/* Left Drawing Tools Column (Signature TradingView dock) */}
        <div className="w-10 sm:w-12 bg-[#131722] border-r border-[#2a2e39] py-3 flex flex-col items-center gap-2 text-[#787b86] shrink-0">
          <button
            onClick={() => setActiveDrawingTool('crosshair')}
            title="Crosshair tool"
            className={`p-2 rounded hover:text-white transition-colors ${
              activeDrawingTool === 'crosshair' ? 'bg-[#2a2e39] text-[#2962ff]' : ''
            }`}
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveDrawingTool('horizontal')}
            title="Draw Horizontal Price Ray (Click on chart)"
            className={`p-2 rounded hover:text-white transition-colors ${
              activeDrawingTool === 'horizontal' ? 'bg-[#2a2e39] text-amber-400' : ''
            }`}
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={clearDrawings}
            title="Clear all drawings"
            disabled={drawnLines.length === 0}
            className="p-2 rounded hover:text-rose-400 disabled:opacity-30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Main Chart SVG Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-x-auto relative cursor-crosshair no-scrollbar bg-[#131722]"
        >
          <svg
            width={totalWidth}
            height={chartHeight + (indicators.showRsi || indicators.showMacd ? subChartHeight : 0)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleChartClick}
            className="block"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2962ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2962ff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
              const y = chartHeight * ratio;
              const priceAtLine = maxPrice - ratio * priceRange;
              return (
                <g key={ratio}>
                  <line
                    x1="0"
                    y1={y}
                    x2={totalWidth}
                    y2={y}
                    stroke="#2a2e39"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  {/* Price label on right */}
                  <text
                    x={totalWidth - 65}
                    y={y - 4}
                    fill="#787b86"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {priceAtLine.toFixed(ticker.price < 2 ? 4 : 2)}
                  </text>
                </g>
              );
            })}

            {/* Vertical Time Grid Lines */}
            {candles.map((candle, idx) => {
              if (idx % 12 !== 0) return null;
              const x = idx * (candleWidth + candleGap) + candleWidth / 2;
              return (
                <g key={`tgrid-${idx}`}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={chartHeight}
                    stroke="#2a2e39"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.4"
                  />
                  <text
                    x={x - 15}
                    y={chartHeight - 6}
                    fill="#787b86"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {candle.time}
                  </text>
                </g>
              );
            })}

            {/* Volume Histogram Bars (at bottom of main chart) */}
            {indicators.showVolume &&
              candles.map((candle, idx) => {
                const x = idx * (candleWidth + candleGap);
                const isGreen = candle.close >= candle.open;
                const barHeight = (candle.volume / maxVolume) * 70;
                const y = chartHeight - barHeight;

                return (
                  <rect
                    key={`vol-${idx}`}
                    x={x}
                    y={y}
                    width={candleWidth}
                    height={barHeight}
                    fill={isGreen ? '#089981' : '#f23645'}
                    opacity="0.25"
                  />
                );
              })}

            {/* Bollinger Bands Shaded Area */}
            {indicators.showBollinger && (
              <path
                d={candles
                  .map((_, idx) => {
                    const up = bollinger.upper[idx];
                    if (up === null) return '';
                    const x = idx * (candleWidth + candleGap) + candleWidth / 2;
                    const y = getY(up);
                    return `${idx === 20 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.8"
              />
            )}
            {indicators.showBollinger && (
              <path
                d={candles
                  .map((_, idx) => {
                    const low = bollinger.lower[idx];
                    if (low === null) return '';
                    const x = idx * (candleWidth + candleGap) + candleWidth / 2;
                    const y = getY(low);
                    return `${idx === 20 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.8"
              />
            )}

            {/* EMA 20 Line (Blue) */}
            {indicators.showEma20 && (
              <path
                d={candles
                  .map((_, idx) => {
                    const val = ema20[idx];
                    if (val === null) return '';
                    const x = idx * (candleWidth + candleGap) + candleWidth / 2;
                    const y = getY(val);
                    return `${idx === 19 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#2962ff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* EMA 50 Line (Amber) */}
            {indicators.showEma50 && (
              <path
                d={candles
                  .map((_, idx) => {
                    const val = ema50[idx];
                    if (val === null) return '';
                    const x = idx * (candleWidth + candleGap) + candleWidth / 2;
                    const y = getY(val);
                    return `${idx === 49 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Area or Line Chart mode */}
            {chartType === 'area' && (
              <polygon
                points={`
                  0,${chartHeight}
                  ${candles
                    .map((c, idx) => {
                      const x = idx * (candleWidth + candleGap) + candleWidth / 2;
                      const y = getY(c.close);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  ${(candles.length - 1) * (candleWidth + candleGap) + candleWidth / 2},${chartHeight}
                `}
                fill="url(#areaGradient)"
              />
            )}

            {chartType === 'line' || chartType === 'area' ? (
              <polyline
                fill="none"
                stroke="#2962ff"
                strokeWidth="2"
                points={candles
                  .map((c, idx) => {
                    const x = idx * (candleWidth + candleGap) + candleWidth / 2;
                    const y = getY(c.close);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            ) : (
              /* Candlesticks & Heikin-Ashi */
              candles.map((candle, idx) => {
                const x = idx * (candleWidth + candleGap);
                const isGreen = candle.close >= candle.open;
                const candleColor = isGreen ? '#089981' : '#f23645';

                const openY = getY(candle.open);
                const closeY = getY(candle.close);
                const highY = getY(candle.high);
                const lowY = getY(candle.low);

                const bodyY = Math.min(openY, closeY);
                const bodyHeight = Math.max(1.5, Math.abs(openY - closeY));
                const midX = x + candleWidth / 2;

                return (
                  <g key={`candle-${idx}`}>
                    {/* Wick */}
                    <line
                      x1={midX}
                      y1={highY}
                      x2={midX}
                      y2={lowY}
                      stroke={candleColor}
                      strokeWidth="1.2"
                    />
                    {/* Candle Body */}
                    <rect
                      x={x}
                      y={bodyY}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={candleColor}
                      rx="1"
                    />
                  </g>
                );
              })
            )}

            {/* User Drawn Horizontal Lines */}
            {drawnLines.map((line) => (
              <g key={line.id}>
                <line
                  x1="0"
                  y1={line.y1}
                  x2={totalWidth}
                  y2={line.y1}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
                <rect
                  x={totalWidth - 75}
                  y={line.y1 - 10}
                  width="70"
                  height="18"
                  fill="#f59e0b"
                  rx="3"
                />
                <text
                  x={totalWidth - 40}
                  y={line.y1 + 3}
                  textAnchor="middle"
                  fill="#000"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  ${line.price.toFixed(2)}
                </text>
              </g>
            ))}

            {/* Interactive Crosshair & Cursor tracking */}
            {mousePos && mousePos.y <= chartHeight && (
              <g>
                {/* Horizontal line */}
                <line
                  x1="0"
                  y1={mousePos.y}
                  x2={totalWidth}
                  y2={mousePos.y}
                  stroke="#787b86"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {/* Vertical line */}
                <line
                  x1={mousePos.x}
                  y1="0"
                  x2={mousePos.x}
                  y2={chartHeight + (indicators.showRsi || indicators.showMacd ? subChartHeight : 0)}
                  stroke="#787b86"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {/* Price tag on right edge */}
                <rect
                  x={totalWidth - 75}
                  y={mousePos.y - 10}
                  width="70"
                  height="20"
                  fill="#2962ff"
                  rx="3"
                />
                <text
                  x={totalWidth - 40}
                  y={mousePos.y + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {getPriceFromY(mousePos.y).toFixed(ticker.price < 2 ? 4 : 2)}
                </text>
              </g>
            )}

            {/* Sub-Chart Divider & RSI / MACD Pane */}
            {(indicators.showRsi || indicators.showMacd) && (
              <g transform={`translate(0, ${chartHeight})`}>
                {/* Panel divider */}
                <line x1="0" y1="0" x2={totalWidth} y2="0" stroke="#2a2e39" strokeWidth="2" />
                <rect x="0" y="0" width={totalWidth} height={subChartHeight} fill="#0e111a" />

                {/* Sub-panel Title */}
                <text x="12" y="16" fill="#787b86" fontSize="10" fontWeight="bold">
                  {indicators.showRsi ? 'RSI (14) · Standard' : 'MACD (12, 26, 9)'}
                </text>

                {indicators.showRsi && (
                  <>
                    {/* RSI Overbought 70 Line */}
                    <line x1="0" y1="30" x2={totalWidth} y2="30" stroke="#f23645" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                    <text x={totalWidth - 30} y="33" fill="#f23645" fontSize="9" fontFamily="monospace">70</text>

                    {/* RSI Neutral 50 Line */}
                    <line x1="0" y1="55" x2={totalWidth} y2="55" stroke="#787b86" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />

                    {/* RSI Oversold 30 Line */}
                    <line x1="0" y1="80" x2={totalWidth} y2="80" stroke="#089981" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                    <text x={totalWidth - 30} y="83" fill="#089981" fontSize="9" fontFamily="monospace">30</text>

                    {/* RSI Curve */}
                    <path
                      d={candles
                        .map((_, idx) => {
                          const val = rsi[idx];
                          if (val === null) return '';
                          const x = idx * (candleWidth + candleGap) + candleWidth / 2;
                          // 0 to 100 mapped to subChartHeight
                          const y = subChartHeight - (val / 100) * (subChartHeight - 20) - 10;
                          return `${idx === 14 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="1.8"
                    />
                  </>
                )}

                {indicators.showMacd && !indicators.showRsi && (
                  <>
                    {/* Zero line */}
                    <line x1="0" y1="55" x2={totalWidth} y2="55" stroke="#787b86" strokeWidth="1" opacity="0.5" />
                    {/* MACD Histogram */}
                    {candles.map((_, idx) => {
                      const hist = macd.histogram[idx];
                      if (hist === null) return null;
                      const x = idx * (candleWidth + candleGap);
                      const barH = Math.min(45, Math.abs(hist) * 8);
                      const y = hist >= 0 ? 55 - barH : 55;
                      return (
                        <rect
                          key={`mhist-${idx}`}
                          x={x}
                          y={y}
                          width={candleWidth}
                          height={barH}
                          fill={hist >= 0 ? '#089981' : '#f23645'}
                          opacity="0.8"
                        />
                      );
                    })}
                  </>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* 4. Bottom Chart Key Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs bg-[#1e222d] border border-[#2a2e39] rounded-xl p-3 font-mono">
        <div>
          <span className="text-[#787b86] text-[11px] block">24h High</span>
          <span className="text-white font-semibold tabular-nums">{ticker.high24h.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[#787b86] text-[11px] block">24h Low</span>
          <span className="text-white font-semibold tabular-nums">{ticker.low24h.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[#787b86] text-[11px] block">24h Volume</span>
          <span className="text-white font-semibold tabular-nums">{ticker.volume}</span>
        </div>
        <div>
          <span className="text-[#787b86] text-[11px] block">Market Cap</span>
          <span className="text-white font-semibold tabular-nums">{ticker.marketCap || 'N/A'}</span>
        </div>
        <div>
          <span className="text-[#787b86] text-[11px] block">P/E Ratio</span>
          <span className="text-white font-semibold tabular-nums">{ticker.peRatio || 'N/A'}</span>
        </div>
        <div>
          <span className="text-[#787b86] text-[11px] block">Technical Rating</span>
          <span className="text-emerald-400 font-semibold">{ticker.rating}</span>
        </div>
      </div>

    </div>
  );
};

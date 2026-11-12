import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MarketTicker, TimeFrame, ChartType, IndicatorSettings, CandleData, 
  MultiChartLayout, DrawingTool, VolumeProfileBucket 
} from '../../types/market';
import { 
  generateCandles, calculateEMA, calculateSMA, calculateBollingerBands, 
  calculateRSI, calculateMACD, convertToHeikinAshi, calculateVolumeProfile,
  calculateFibonacciLevels 
} from '../../utils/chartGenerators';
import { 
  Maximize2, RotateCcw, Sliders, TrendingUp, TrendingDown,
  BarChart2, Activity, Eye, EyeOff, Layers, Trash2, Crosshair, 
  Minus, Percent, DollarSign, PenTool, Check, Grid, Play, Pause,
  SkipForward, ChevronDown, Split, HelpCircle, X
} from 'lucide-react';
import { TimeAndSalesDOM } from './TimeAndSalesDOM';

interface ProMultiChartStudioProps {
  primaryTicker: MarketTicker;
  allTickers: MarketTicker[];
  onOpenTrading: (side: 'buy' | 'sell', ticker?: MarketTicker, price?: number, qty?: number) => void;
  onOpenSearch: () => void;
}

interface ChartPaneState {
  id: string;
  ticker: MarketTicker;
  timeframe: TimeFrame;
  chartType: ChartType;
  compareTickerSymbol: string | null;
}

export const ProMultiChartStudio: React.FC<ProMultiChartStudioProps> = ({
  primaryTicker,
  allTickers,
  onOpenTrading,
  onOpenSearch,
}) => {
  // Multi-chart layout
  const [layout, setLayout] = useState<MultiChartLayout>('1x1');
  const [activePaneIndex, setActivePaneIndex] = useState<number>(0);
  const [showDOM, setShowDOM] = useState<boolean>(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Replay Simulator state
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);

  // Pane configurations
  const [panes, setPanes] = useState<ChartPaneState[]>([
    { id: 'pane-0', ticker: primaryTicker, timeframe: '1D', chartType: 'candlestick', compareTickerSymbol: null },
    { id: 'pane-1', ticker: allTickers.find(t => t.symbol === 'BTCUSD') || allTickers[1], timeframe: '4H', chartType: 'candlestick', compareTickerSymbol: null },
    { id: 'pane-2', ticker: allTickers.find(t => t.symbol === 'SPX') || allTickers[2], timeframe: '1D', chartType: 'candlestick', compareTickerSymbol: null },
    { id: 'pane-3', ticker: allTickers.find(t => t.symbol === 'TSLA') || allTickers[3], timeframe: '15m', chartType: 'candlestick', compareTickerSymbol: null },
  ]);

  // Keep primary ticker in sync with pane 0 if changed externally
  useEffect(() => {
    setPanes(prev => {
      const updated = [...prev];
      if (updated[0].ticker.symbol !== primaryTicker.symbol) {
        updated[0] = { ...updated[0], ticker: primaryTicker };
      }
      return updated;
    });
  }, [primaryTicker]);

  // Active pane
  const activePane = panes[activePaneIndex] || panes[0];

  // Indicators toggle state
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    showEma20: true,
    showEma50: false,
    showSma200: false,
    showBollinger: false,
    showVolume: true,
    showRsi: true,
    showMacd: false,
    showVolumeProfile: true, // Pro VRVP
    showStochastic: false,
  });

  // Drawing state
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('crosshair');
  const [showFibonacci, setShowFibonacci] = useState<boolean>(false);
  const [horizontalLines, setHorizontalLines] = useState<number[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Generate historical candles for active pane
  const rawCandles = useMemo(() => {
    return generateCandles(activePane.ticker.price, activePane.timeframe, 90);
  }, [activePane.ticker.symbol, activePane.ticker.price, activePane.timeframe]);

  // Handle Replay slice if active
  const visibleCandles = useMemo(() => {
    let c = rawCandles;
    if (replayIndex !== null) {
      c = rawCandles.slice(0, replayIndex);
    }
    if (activePane.chartType === 'heikinAshi') {
      return convertToHeikinAshi(c);
    }
    return c;
  }, [rawCandles, replayIndex, activePane.chartType]);

  // Technical Calculations
  const ema20 = useMemo(() => calculateEMA(visibleCandles, 20), [visibleCandles]);
  const ema50 = useMemo(() => calculateEMA(visibleCandles, 50), [visibleCandles]);
  const sma200 = useMemo(() => calculateSMA(visibleCandles, 200), [visibleCandles]);
  const bollinger = useMemo(() => calculateBollingerBands(visibleCandles, 20, 2), [visibleCandles]);
  const rsi = useMemo(() => calculateRSI(visibleCandles, 14), [visibleCandles]);
  const macd = useMemo(() => calculateMACD(visibleCandles), [visibleCandles]);
  const volumeProfile = useMemo(() => calculateVolumeProfile(visibleCandles, 22), [visibleCandles]);

  // Min/Max for Scaling
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 100 };
    const min = Math.min(...visibleCandles.map(c => c.low));
    const max = Math.max(...visibleCandles.map(c => c.high));
    const maxVol = Math.max(...visibleCandles.map(c => c.volume));
    const pad = (max - min) * 0.05 || max * 0.05;
    return {
      minPrice: min - pad,
      maxPrice: max + pad,
      maxVolume: maxVol,
    };
  }, [visibleCandles]);

  const priceRange = maxPrice - minPrice || 1;

  // Fibonacci levels calculated from peak to trough
  const fibLevels = useMemo(() => {
    if (visibleCandles.length === 0) return [];
    const min = Math.min(...visibleCandles.map(c => c.low));
    const max = Math.max(...visibleCandles.map(c => c.high));
    return calculateFibonacciLevels(max, min);
  }, [visibleCandles]);

  // Coordinate helper: price to Y
  const chartHeight = (indicators.showRsi || indicators.showMacd) ? 330 : 440;
  const subChartHeight = 110;
  const candleCount = visibleCandles.length;
  const candleWidth = Math.max(4, Math.floor(9 * zoomLevel));
  const candleGap = Math.max(2, Math.floor(5 * zoomLevel));
  const totalWidth = Math.max(760, candleCount * (candleWidth + candleGap) + 120);

  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * (chartHeight - 40) - 20;
  };

  const getPriceFromY = (y: number) => {
    const ratio = (chartHeight - 20 - y) / (chartHeight - 40);
    return minPrice + ratio * priceRange;
  };

  // Crosshair hover state
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const idx = Math.floor(x / (candleWidth + candleGap));
    if (idx >= 0 && idx < visibleCandles.length) {
      setHoveredCandle(visibleCandles[idx]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleChartClick = () => {
    if (drawingTool === 'horizontal' && mousePos) {
      const p = getPriceFromY(mousePos.y);
      setHorizontalLines(prev => [...prev, Number(p.toFixed(2))]);
      setDrawingTool('crosshair');
    }
  };

  // Bar Replay interval
  useEffect(() => {
    let timer: any = null;
    if (isReplaying) {
      timer = setInterval(() => {
        setReplayIndex(prev => {
          if (prev === null) return 40;
          if (prev >= rawCandles.length) {
            setIsReplaying(false);
            return null;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isReplaying, rawCandles.length]);

  // Update active pane property
  const updateActivePane = (updater: Partial<ChartPaneState>) => {
    setPanes(prev => {
      const copy = [...prev];
      copy[activePaneIndex] = { ...copy[activePaneIndex], ...updater };
      return copy;
    });
  };

  const currentDisplayCandle = hoveredCandle || (visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : null);
  const isUp = activePane.ticker.change >= 0;

  // Render pane count based on layout
  const numPanes = layout === '1x1' ? 1 : layout === '2x1' || layout === '1x2' ? 2 : 4;
  const gridClasses = {
    '1x1': 'grid-cols-1',
    '2x1': 'grid-cols-1 md:grid-cols-2',
    '1x2': 'grid-cols-1 grid-rows-2',
    '2x2': 'grid-cols-1 md:grid-cols-2 grid-rows-2',
  }[layout];

  return (
    <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 py-3 space-y-2.5 select-none font-sans">
      
      {/* 1. TOP PRO CONTROLS BAR */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Active Ticker & Quick Comparison */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#131722] border border-[#2a2e39] hover:border-[#2962ff] transition-all font-mono"
          >
            <div className="w-6 h-6 rounded bg-[#2962ff] flex items-center justify-center font-bold text-white text-[11px]">
              {activePane.ticker.symbol.slice(0, 3)}
            </div>
            <span className="font-bold text-white text-sm tracking-tight">{activePane.ticker.symbol}</span>
            <span className="text-[10px] text-[#787b86] font-semibold">{activePane.ticker.assetClass}</span>
          </button>

          {/* Live Price Tag */}
          <div className="font-mono tabular-nums">
            <span className="text-base font-bold text-white mr-1.5">
              ${activePane.ticker.price < 2 ? activePane.ticker.price.toFixed(4) : activePane.ticker.price.toLocaleString()}
            </span>
            <span className={`text-xs font-semibold ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
              {isUp ? '+' : ''}{activePane.ticker.changePercent.toFixed(2)}%
            </span>
          </div>

          {/* Timeframes */}
          <div className="hidden sm:flex items-center gap-0.5 bg-[#131722] p-0.5 rounded-lg border border-[#2a2e39]">
            {(['1m', '5m', '15m', '1H', '4H', '1D', '1W'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => updateActivePane({ timeframe: tf })}
                className={`px-2 py-1 rounded font-semibold text-[11px] transition-colors ${
                  activePane.timeframe === tf
                    ? 'bg-[#2962ff] text-white'
                    : 'text-[#787b86] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Chart Type & Indicators Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#131722] p-0.5 rounded-lg border border-[#2a2e39] text-[11px]">
            <button
              onClick={() => updateActivePane({ chartType: 'candlestick' })}
              className={`px-2 py-1 rounded font-semibold ${
                activePane.chartType === 'candlestick' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => updateActivePane({ chartType: 'heikinAshi' })}
              className={`px-2 py-1 rounded font-semibold ${
                activePane.chartType === 'heikinAshi' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
              }`}
            >
              Heikin Ashi
            </button>
            <button
              onClick={() => updateActivePane({ chartType: 'area' })}
              className={`px-2 py-1 rounded font-semibold ${
                activePane.chartType === 'area' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
              }`}
            >
              Area
            </button>
          </div>

          {/* Pro VRVP & Fib Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIndicators(prev => ({ ...prev, showVolumeProfile: !prev.showVolumeProfile }))}
              title="Visible Range Volume Profile (VRVP with Point of Control)"
              className={`px-2 py-1 rounded border text-[11px] font-bold transition-colors ${
                indicators.showVolumeProfile
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                  : 'text-[#787b86] border-[#2a2e39] hover:text-white'
              }`}
            >
              VRVP Profile
            </button>

            <button
              onClick={() => setShowFibonacci(!showFibonacci)}
              title="Toggle Fibonacci Retracement Levels"
              className={`px-2 py-1 rounded border text-[11px] font-bold transition-colors ${
                showFibonacci
                  ? 'bg-[#2962ff]/20 text-[#2962ff] border-[#2962ff]'
                  : 'text-[#787b86] border-[#2a2e39] hover:text-white'
              }`}
            >
              Fib Levels
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

        {/* Right: Multi-Chart Layout Switcher & Replay & DOM Toggle */}
        <div className="flex items-center gap-2">
          
          {/* Bar Replay Toolbar */}
          <div className="flex items-center gap-1 bg-[#131722] px-2 py-1 rounded-lg border border-[#2a2e39]">
            <button
              onClick={() => setIsReplaying(!isReplaying)}
              title={isReplaying ? "Pause Bar Replay" : "Start Historical Bar Replay"}
              className="text-[#787b86] hover:text-amber-400 p-0.5"
            >
              {isReplaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setReplayIndex(prev => (prev === null ? 50 : prev + 1))}
              title="Step forward 1 candle"
              className="text-[#787b86] hover:text-white p-0.5"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            {replayIndex !== null && (
              <button
                onClick={() => {
                  setReplayIndex(null);
                  setIsReplaying(false);
                }}
                title="Exit Replay mode"
                className="text-[10px] text-rose-400 hover:underline ml-1"
              >
                Exit
              </button>
            )}
          </div>

          {/* Multi-Chart Split Layout Picker */}
          <div className="flex items-center gap-0.5 bg-[#131722] p-0.5 rounded-lg border border-[#2a2e39]">
            {(['1x1', '2x1', '1x2', '2x2'] as MultiChartLayout[]).map((l) => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                title={`Layout ${l}`}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold ${
                  layout === l ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Toggle Level 2 DOM Ladder */}
          <button
            onClick={() => setShowDOM(!showDOM)}
            title="Toggle Level 2 DOM Ladder"
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
              showDOM ? 'bg-[#2a2e39] text-white border-[#434651]' : 'text-[#787b86] border-[#2a2e39]'
            }`}
          >
            DOM
          </button>

          {/* Keyboard Shortcuts Dialog */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard shortcuts & Pro features"
            className="p-1.5 rounded text-[#787b86] hover:text-white bg-[#131722] border border-[#2a2e39]"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN PRO VIEWPORT: Split Chart Panes + DOM Column */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
        
        {/* Charts Grid (Spans 3 cols if DOM open, or full 4 cols if closed) */}
        <div className={`${showDOM ? 'xl:col-span-3' : 'xl:col-span-4'} flex flex-col gap-2`}>
          
          <div className={`grid ${gridClasses} gap-2`}>
            {panes.slice(0, numPanes).map((pane, index) => {
              const isActive = activePaneIndex === index;

              return (
                <div
                  key={pane.id}
                  onClick={() => setActivePaneIndex(index)}
                  className={`bg-[#1e222d] border rounded-xl overflow-hidden flex flex-col relative transition-all ${
                    isActive
                      ? 'border-[#2962ff] shadow-lg ring-1 ring-[#2962ff]/30'
                      : 'border-[#2a2e39] opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Pane Mini Header */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#171b26] border-b border-[#2a2e39] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{pane.ticker.symbol}</span>
                      <span className="text-[10px] text-[#787b86]">{pane.timeframe}</span>
                      <span className={`text-[11px] font-mono font-semibold ${pane.ticker.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        ${pane.ticker.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Quick Buy / Sell Buttons */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTrading('sell', pane.ticker);
                        }}
                        className="px-2 py-0.5 rounded bg-[#f23645] hover:bg-[#d92231] text-white text-[10px] font-bold"
                      >
                        Sell
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTrading('buy', pane.ticker);
                        }}
                        className="px-2 py-0.5 rounded bg-[#089981] hover:bg-[#067a67] text-white text-[10px] font-bold"
                      >
                        Buy
                      </button>
                    </div>
                  </div>

                  {/* If this is the active pane, render the full interactive SVG Canvas */}
                  {isActive ? (
                    <div className="flex flex-1 relative bg-[#131722] overflow-hidden">
                      
                      {/* Left Drawing Tools Rail */}
                      <div className="w-10 bg-[#131722] border-r border-[#2a2e39] py-2 flex flex-col items-center gap-2 text-[#787b86] shrink-0">
                        <button
                          onClick={() => setDrawingTool('crosshair')}
                          className={`p-1.5 rounded hover:text-white ${
                            drawingTool === 'crosshair' ? 'bg-[#2a2e39] text-[#2962ff]' : ''
                          }`}
                          title="Crosshair mode"
                        >
                          <Crosshair className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDrawingTool('horizontal')}
                          className={`p-1.5 rounded hover:text-white ${
                            drawingTool === 'horizontal' ? 'bg-[#2a2e39] text-amber-400' : ''
                          }`}
                          title="Horizontal Support/Resistance Ray"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.25))}
                          className="p-1.5 rounded hover:text-white font-mono text-xs font-bold"
                          title="Zoom In"
                        >
                          +
                        </button>
                        <button
                          onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.25))}
                          className="p-1.5 rounded hover:text-white font-mono text-xs font-bold"
                          title="Zoom Out"
                        >
                          −
                        </button>
                        <button
                          onClick={() => {
                            setHorizontalLines([]);
                            setShowFibonacci(false);
                            setZoomLevel(1);
                          }}
                          className="p-1.5 rounded hover:text-rose-400 text-xs"
                          title="Clear drawings"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* SVG Chart Engine */}
                      <div className="flex-1 overflow-x-auto relative cursor-crosshair no-scrollbar bg-[#131722]">
                        <svg
                          width={totalWidth}
                          height={chartHeight + (indicators.showRsi || indicators.showMacd ? subChartHeight : 0)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={() => {
                            setMousePos(null);
                            setHoveredCandle(null);
                          }}
                          onClick={handleChartClick}
                          className="block"
                        >
                          <defs>
                            <linearGradient id="proAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2962ff" stopOpacity="0.45" />
                              <stop offset="100%" stopColor="#2962ff" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid lines */}
                          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                            const y = chartHeight * ratio;
                            const priceVal = maxPrice - ratio * priceRange;
                            return (
                              <g key={`grid-${ratio}`}>
                                <line x1="0" y1={y} x2={totalWidth} y2={y} stroke="#2a2e39" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                                <text x={totalWidth - 65} y={y - 4} fill="#787b86" fontSize="10" fontFamily="monospace">
                                  {priceVal.toFixed(pane.ticker.price < 2 ? 4 : 2)}
                                </text>
                              </g>
                            );
                          })}

                          {/* VISIBLE RANGE VOLUME PROFILE (VRVP) - Signature Pro Feature */}
                          {indicators.showVolumeProfile && (
                            <g opacity="0.85">
                              {volumeProfile.map((bucket, bIdx) => {
                                const y = getY(bucket.price);
                                const maxV = Math.max(...volumeProfile.map(b => b.volume));
                                const barWidth = (bucket.volume / maxV) * 110;
                                const x = totalWidth - 85 - barWidth;

                                return (
                                  <g key={`vp-${bIdx}`}>
                                    <rect
                                      x={x}
                                      y={y - 4}
                                      width={barWidth}
                                      height={7}
                                      fill={bucket.isPOC ? '#f59e0b' : bucket.isValueArea ? '#2962ff' : '#434651'}
                                      opacity={bucket.isPOC ? 0.9 : 0.4}
                                      rx="1"
                                    />
                                    {bucket.isPOC && (
                                      <>
                                        <line x1="0" y1={y} x2={totalWidth - 85} y2={y} stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4 2" />
                                        <text x={totalWidth - 120} y={y - 6} fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="monospace">
                                          POC ${bucket.price.toFixed(2)}
                                        </text>
                                      </>
                                    )}
                                  </g>
                                );
                              })}
                            </g>
                          )}

                          {/* FIBONACCI RETRACEMENT BANDS */}
                          {showFibonacci && (
                            <g>
                              {fibLevels.map((fib) => {
                                const y = getY(fib.price);
                                return (
                                  <g key={fib.ratio}>
                                    <line x1="0" y1={y} x2={totalWidth - 75} y2={y} stroke={fib.color} strokeWidth="1.2" strokeDasharray="5 3" />
                                    <text x="12" y={y - 3} fill={fib.color} fontSize="9" fontFamily="monospace" fontWeight="bold">
                                      Fib {fib.ratio}: ${fib.price.toFixed(2)}
                                    </text>
                                  </g>
                                );
                              })}
                            </g>
                          )}

                          {/* Volume histogram */}
                          {indicators.showVolume && visibleCandles.map((c, i) => {
                            const x = i * (candleWidth + candleGap);
                            const barH = (c.volume / maxVolume) * 65;
                            const y = chartHeight - barH;
                            return (
                              <rect
                                key={`v-${i}`}
                                x={x}
                                y={y}
                                width={candleWidth}
                                height={barH}
                                fill={c.close >= c.open ? '#089981' : '#f23645'}
                                opacity="0.25"
                              />
                            );
                          })}

                          {/* EMA 20 (Blue) */}
                          {indicators.showEma20 && (
                            <path
                              d={visibleCandles.map((_, i) => {
                                const val = ema20[i];
                                if (val === null) return '';
                                const x = i * (candleWidth + candleGap) + candleWidth / 2;
                                return `${i === 19 ? 'M' : 'L'} ${x} ${getY(val)}`;
                              }).join(' ')}
                              fill="none"
                              stroke="#2962ff"
                              strokeWidth="1.8"
                            />
                          )}

                          {/* Candlesticks */}
                          {activePane.chartType === 'area' ? (
                            <>
                              <polygon
                                points={`
                                  0,${chartHeight}
                                  ${visibleCandles.map((c, i) => {
                                    const x = i * (candleWidth + candleGap) + candleWidth / 2;
                                    return `${x},${getY(c.close)}`;
                                  }).join(' ')}
                                  ${(visibleCandles.length - 1) * (candleWidth + candleGap)},${chartHeight}
                                `}
                                fill="url(#proAreaGrad)"
                              />
                              <polyline
                                fill="none"
                                stroke="#2962ff"
                                strokeWidth="2"
                                points={visibleCandles.map((c, i) => {
                                  const x = i * (candleWidth + candleGap) + candleWidth / 2;
                                  return `${x},${getY(c.close)}`;
                                }).join(' ')}
                              />
                            </>
                          ) : (
                            visibleCandles.map((c, i) => {
                              const x = i * (candleWidth + candleGap);
                              const isGreen = c.close >= c.open;
                              const color = isGreen ? '#089981' : '#f23645';
                              const openY = getY(c.open);
                              const closeY = getY(c.close);
                              const highY = getY(c.high);
                              const lowY = getY(c.low);
                              const midX = x + candleWidth / 2;
                              const bodyY = Math.min(openY, closeY);
                              const bodyH = Math.max(1.5, Math.abs(openY - closeY));

                              return (
                                <g key={`c-${i}`}>
                                  <line x1={midX} y1={highY} x2={midX} y2={lowY} stroke={color} strokeWidth="1.2" />
                                  <rect x={x} y={bodyY} width={candleWidth} height={bodyH} fill={color} rx="1" />
                                </g>
                              );
                            })
                          )}

                          {/* Horizontal Lines */}
                          {horizontalLines.map((price, idx) => {
                            const y = getY(price);
                            return (
                              <g key={`hl-${idx}`}>
                                <line x1="0" y1={y} x2={totalWidth} y2={y} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
                                <rect x={totalWidth - 75} y={y - 9} width="70" height="18" fill="#f59e0b" rx="2" />
                                <text x={totalWidth - 40} y={y + 3} textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold" fontFamily="monospace">
                                  ${price.toFixed(2)}
                                </text>
                              </g>
                            );
                          })}

                          {/* Crosshair tracking */}
                          {mousePos && mousePos.y <= chartHeight && (
                            <g>
                              <line x1="0" y1={mousePos.y} x2={totalWidth} y2={mousePos.y} stroke="#787b86" strokeWidth="1" strokeDasharray="3 3" />
                              <line x1={mousePos.x} y1="0" x2={mousePos.x} y2={chartHeight + (indicators.showRsi || indicators.showMacd ? subChartHeight : 0)} stroke="#787b86" strokeWidth="1" strokeDasharray="3 3" />
                              <rect x={totalWidth - 75} y={mousePos.y - 10} width="70" height="20" fill="#2962ff" rx="2" />
                              <text x={totalWidth - 40} y={mousePos.y + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="monospace">
                                ${getPriceFromY(mousePos.y).toFixed(pane.ticker.price < 2 ? 4 : 2)}
                              </text>
                            </g>
                          )}

                          {/* RSI Sub-pane */}
                          {indicators.showRsi && (
                            <g transform={`translate(0, ${chartHeight})`}>
                              <line x1="0" y1="0" x2={totalWidth} y2="0" stroke="#2a2e39" strokeWidth="2" />
                              <rect x="0" y="0" width={totalWidth} height={subChartHeight} fill="#0d1017" />
                              <text x="12" y="18" fill="#787b86" fontSize="10" fontWeight="bold">RSI (14) · Pro</text>
                              <line x1="0" y1="30" x2={totalWidth} y2="30" stroke="#f23645" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                              <text x={totalWidth - 30} y="33" fill="#f23645" fontSize="9" fontFamily="monospace">70</text>
                              <line x1="0" y1="80" x2={totalWidth} y2="80" stroke="#089981" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                              <text x={totalWidth - 30} y="83" fill="#089981" fontSize="9" fontFamily="monospace">30</text>
                              <path
                                d={visibleCandles.map((_, i) => {
                                  const val = rsi[i];
                                  if (val === null) return '';
                                  const x = i * (candleWidth + candleGap) + candleWidth / 2;
                                  const y = subChartHeight - (val / 100) * (subChartHeight - 20) - 10;
                                  return `${i === 14 ? 'M' : 'L'} ${x} ${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="#06b6d4"
                                strokeWidth="1.8"
                              />
                            </g>
                          )}
                        </svg>
                      </div>
                    </div>
                  ) : (
                    /* Inactive pane simplified preview */
                    <div className="flex-1 bg-[#131722] p-4 flex flex-col justify-between cursor-pointer min-h-[220px]">
                      <div className="flex items-center justify-between text-xs text-[#787b86]">
                        <span>Click to focus pane</span>
                        <span className="font-mono">{pane.timeframe}</span>
                      </div>
                      <div className="text-center py-8">
                        <BarChart2 className="w-8 h-8 text-[#787b86] mx-auto opacity-50 mb-2" />
                        <span className="text-white font-bold text-sm">{pane.ticker.name}</span>
                        <div className="text-xs text-[#787b86] font-mono mt-1">
                          Vol: {pane.ticker.volume} · Rating: {pane.ticker.rating}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-[#2962ff] font-semibold">
                        Switch Focus →
                      </div>
                    </div>
                  )}

                  {/* Active OHLC readout */}
                  {isActive && currentDisplayCandle && (
                    <div className="px-3 py-1.5 bg-[#171b26] border-t border-[#2a2e39] flex items-center justify-between text-[11px] font-mono tabular-nums text-[#787b86]">
                      <div className="flex items-center gap-3">
                        <span>O: <strong className="text-white">{currentDisplayCandle.open}</strong></span>
                        <span>H: <strong className="text-[#089981]">{currentDisplayCandle.high}</strong></span>
                        <span>L: <strong className="text-[#f23645]">{currentDisplayCandle.low}</strong></span>
                        <span>C: <strong className="text-white">{currentDisplayCandle.close}</strong></span>
                        <span>Vol: <strong className="text-white">{currentDisplayCandle.volume.toLocaleString()}</strong></span>
                      </div>
                      <span className="text-emerald-400 font-bold">{pane.ticker.rating}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Level 2 DOM Ladder Column */}
        {showDOM && (
          <div className="xl:col-span-1 h-full min-h-[500px]">
            <TimeAndSalesDOM
              ticker={activePane.ticker}
              onQuickOrder={(side, price, qty) => onOpenTrading(side, activePane.ticker, price, qty)}
            />
          </div>
        )}

      </div>

      {/* 3. KEYBOARD SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2e39] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#2962ff] flex items-center justify-center text-white font-bold text-xs">
                  PRO
                </div>
                <h3 className="font-bold text-white text-sm">TradingView PRO Power User Guide</h3>
              </div>
              <button onClick={() => setShowShortcutsModal(false)} className="text-[#787b86] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#2a2e39]/50">
                <span className="text-[#d1d4dc]">Quick Symbol Search</span>
                <kbd className="bg-[#131722] text-[#2962ff] px-2 py-0.5 rounded font-mono border border-[#2a2e39]">⌘K or Ctrl+K</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#2a2e39]/50">
                <span className="text-[#d1d4dc]">Multi-Chart Layouts</span>
                <span className="font-mono text-white">1x1, 2x1, 1x2, 2x2</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#2a2e39]/50">
                <span className="text-[#d1d4dc]">Volume Profile (VRVP)</span>
                <span className="text-amber-400 font-semibold">Point of Control (POC)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#2a2e39]/50">
                <span className="text-[#d1d4dc]">Fibonacci Retracement</span>
                <span className="text-cyan-400 font-semibold">0.236 to 0.786 Ratios</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#2a2e39]/50">
                <span className="text-[#d1d4dc]">Bar Replay Engine</span>
                <span className="text-white">Play / Pause / Step</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#d1d4dc]">Level 2 DOM 1-Click Orders</span>
                <span className="text-emerald-400 font-semibold">Direct on Price Ladder</span>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2 bg-[#2962ff] text-white font-bold rounded-lg text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

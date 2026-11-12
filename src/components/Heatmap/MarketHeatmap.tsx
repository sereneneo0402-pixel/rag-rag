import React, { useState } from 'react';
import { MarketTicker } from '../../types/market';
import { HEATMAP_DATA } from '../../data/mockMarketData';
import { BarChart2, Layers, Info } from 'lucide-react';

interface MarketHeatmapProps {
  onOpenChart: (ticker: MarketTicker) => void;
  tickers: MarketTicker[];
}

export const MarketHeatmap: React.FC<MarketHeatmapProps> = ({
  onOpenChart,
  tickers,
}) => {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [filterSector, setFilterSector] = useState<string>('all');

  const filteredData = filterSector === 'all'
    ? HEATMAP_DATA
    : HEATMAP_DATA.filter((item) => item.sector === filterSector);

  // Group by sector
  const sectors = Array.from(new Set(filteredData.map((d) => d.sector)));

  // Color generator based on changePercent
  const getCellColor = (change: number) => {
    if (change >= 5) return 'bg-[#089981] hover:bg-[#067a67] text-white';
    if (change >= 2.5) return 'bg-[#0bb095] hover:bg-[#09967e] text-white';
    if (change >= 1) return 'bg-[#188065] hover:bg-[#126650] text-white';
    if (change >= 0) return 'bg-[#1e4a3d] hover:bg-[#183d32] text-emerald-200';
    if (change >= -1) return 'bg-[#59272d] hover:bg-[#4a1f25] text-rose-200';
    if (change >= -2.5) return 'bg-[#a3222d] hover:bg-[#851b24] text-white';
    return 'bg-[#f23645] hover:bg-[#d92231] text-white';
  };

  const handleCellClick = (symbol: string) => {
    const fullTicker = tickers.find((t) => t.symbol === symbol);
    if (fullTicker) {
      onOpenChart(fullTicker);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 select-none">
      
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Market Heatmap</h1>
          <p className="text-xs text-[#787b86] mt-0.5">
            S&P 500 Market Capitalization Treemap colored by daily performance
          </p>
        </div>

        {/* Sector Filter & Color Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#1e222d] p-1 rounded-lg border border-[#2a2e39] text-xs">
            <button
              onClick={() => setFilterSector('all')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                filterSector === 'all' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
              }`}
            >
              All Sectors
            </button>
            <button
              onClick={() => setFilterSector('Technology')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                filterSector === 'Technology' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
              }`}
            >
              Technology
            </button>
            <button
              onClick={() => setFilterSector('Consumer Discretionary')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                filterSector === 'Consumer Discretionary' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
              }`}
            >
              Consumer
            </button>
            <button
              onClick={() => setFilterSector('Financials')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                filterSector === 'Financials' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
              }`}
            >
              Financials
            </button>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#787b86]">
            <span>-3%</span>
            <div className="flex h-3 w-28 rounded overflow-hidden">
              <div className="flex-1 bg-[#f23645]"></div>
              <div className="flex-1 bg-[#a3222d]"></div>
              <div className="flex-1 bg-[#59272d]"></div>
              <div className="flex-1 bg-[#1e4a3d]"></div>
              <div className="flex-1 bg-[#188065]"></div>
              <div className="flex-1 bg-[#0bb095]"></div>
              <div className="flex-1 bg-[#089981]"></div>
            </div>
            <span>+3%</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visual Container */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 space-y-6">
        {sectors.map((sector) => {
          const sectorItems = filteredData.filter((i) => i.sector === sector);

          return (
            <div key={sector} className="space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-[#2a2e39] pb-1">
                <span className="font-bold text-[#b2b5be] uppercase tracking-wider">{sector}</span>
                <span className="text-[#787b86] text-[11px] font-mono">
                  {sectorItems.length} Companies
                </span>
              </div>

              {/* Grid with variable spans based on Market Cap */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {sectorItems.map((item) => {
                  const isHovered = hoveredSymbol === item.symbol;
                  const isUp = item.changePercent >= 0;

                  // Sizing by market cap: > 3T spans 2 cols, etc.
                  let colSpan = 'col-span-1';
                  let rowSpan = 'min-h-[100px]';
                  if (item.marketCap > 3000) {
                    colSpan = 'col-span-2 sm:col-span-2';
                    rowSpan = 'min-h-[120px]';
                  } else if (item.marketCap > 1000) {
                    colSpan = 'col-span-2 sm:col-span-1';
                    rowSpan = 'min-h-[110px]';
                  }

                  return (
                    <button
                      key={item.symbol}
                      onClick={() => handleCellClick(item.symbol)}
                      onMouseEnter={() => setHoveredSymbol(item.symbol)}
                      onMouseLeave={() => setHoveredSymbol(null)}
                      className={`${colSpan} ${rowSpan} ${getCellColor(
                        item.changePercent
                      )} rounded-lg p-3 flex flex-col justify-between text-left transition-all relative overflow-hidden group cursor-pointer shadow-xs focus:outline-none`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div>
                          <div className="font-extrabold text-sm sm:text-base tracking-tight font-sans">
                            {item.symbol}
                          </div>
                          <div className="text-[10px] opacity-80 truncate max-w-[110px]">
                            {item.name}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono opacity-80 bg-black/20 px-1 rounded">
                          {item.marketCapFormatted}
                        </span>
                      </div>

                      <div className="w-full flex items-baseline justify-between font-mono tabular-nums pt-2">
                        <span className="text-xs font-semibold opacity-90">
                          ${item.price.toFixed(2)}
                        </span>
                        <span className="text-xs sm:text-sm font-bold">
                          {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </span>
                      </div>

                      {/* Hover action prompt */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                        <span className="text-xs font-bold text-white bg-[#2962ff] px-2.5 py-1 rounded shadow-md flex items-center gap-1 font-sans">
                          <BarChart2 className="w-3.5 h-3.5" />
                          View Chart
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="p-3 bg-[#131722] border border-[#2a2e39] rounded-xl flex items-center justify-between text-xs text-[#787b86]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#2962ff] shrink-0" />
          <span>Click any block to launch full interactive SuperChart with technical indicators.</span>
        </div>
        <span className="font-mono text-[11px] hidden sm:inline">Data refreshed live</span>
      </div>

    </div>
  );
};

import React from 'react';
import { MarketTicker } from '../types/market';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerRibbonProps {
  tickers: MarketTicker[];
  selectedSymbol: string;
  onSelectTicker: (ticker: MarketTicker) => void;
  recentTicks: Record<string, 'up' | 'down'>;
}

export const TickerRibbon: React.FC<TickerRibbonProps> = ({
  tickers,
  selectedSymbol,
  onSelectTicker,
  recentTicks,
}) => {
  // Select top representative global assets for the ribbon
  const ribbonTickers = tickers.slice(0, 10);

  return (
    <div className="w-full bg-[#131722] border-b border-[#2a2e39] overflow-x-auto no-scrollbar py-1.5 px-4 flex items-center gap-2 select-none">
      <div className="flex items-center gap-2 min-w-max">
        {ribbonTickers.map((ticker) => {
          const isUp = ticker.change >= 0;
          const tickState = recentTicks[ticker.symbol];
          const isSelected = selectedSymbol === ticker.symbol;

          let tickBg = 'bg-[#1e222d]';
          if (tickState === 'up') tickBg = 'bg-emerald-950/60 border-emerald-500/50';
          if (tickState === 'down') tickBg = 'bg-rose-950/60 border-rose-500/50';

          return (
            <button
              key={ticker.symbol}
              onClick={() => onSelectTicker(ticker)}
              className={`flex items-center gap-2.5 px-3 py-1 rounded text-xs transition-all border ${
                isSelected
                  ? 'border-[#2962ff] bg-[#2962ff]/10 text-white font-semibold'
                  : `border-[#2a2e39] hover:border-[#434651] text-[#d1d4dc] ${tickBg}`
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white">{ticker.symbol}</span>
                <span className="text-[10px] text-[#787b86] max-w-[80px] truncate hidden sm:inline">
                  {ticker.name}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono tabular-nums text-[11px]">
                <span className="font-semibold text-white">
                  {ticker.price < 2
                    ? ticker.price.toFixed(4)
                    : ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`flex items-center text-[10px] font-medium ${
                    isUp ? 'text-[#089981]' : 'text-[#f23645]'
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5 inline" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5 mr-0.5 inline" />
                  )}
                  {isUp ? '+' : ''}
                  {ticker.changePercent.toFixed(2)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

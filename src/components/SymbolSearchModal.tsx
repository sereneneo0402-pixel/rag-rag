import React, { useState, useEffect, useRef } from 'react';
import { MarketTicker, AssetClass } from '../types/market';
import { Search, X, TrendingUp, TrendingDown, Check } from 'lucide-react';

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: MarketTicker[];
  onSelectTicker: (ticker: MarketTicker) => void;
  selectedSymbol: string;
}

export const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({
  isOpen,
  onClose,
  tickers,
  onSelectTicker,
  selectedSymbol,
}) => {
  const [query, setQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | AssetClass>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTickers = tickers.filter((t) => {
    const matchesQuery =
      t.symbol.toLowerCase().includes(query.toLowerCase()) ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      (t.sector && t.sector.toLowerCase().includes(query.toLowerCase()));
    
    if (selectedTab === 'all') return matchesQuery;
    return matchesQuery && t.assetClass === selectedTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2e39] bg-[#131722]">
          <Search className="w-5 h-5 text-[#787b86]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol, company, or currency (e.g. NVDA, BTC, EUR)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#787b86] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#787b86] hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-[#787b86] hover:text-white px-2 py-1 rounded bg-[#2a2e39] ml-1"
          >
            ESC
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#171b26] border-b border-[#2a2e39] overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'stocks', label: 'Stocks' },
            { id: 'crypto', label: 'Crypto' },
            { id: 'indices', label: 'Indices' },
            { id: 'forex', label: 'Forex' },
            { id: 'commodities', label: 'Commodities' },
            { id: 'bonds', label: 'Bonds' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors ${
                selectedTab === tab.id
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#9598a1] hover:text-white hover:bg-[#2a2e39]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto divide-y divide-[#2a2e39]/50 flex-1">
          {filteredTickers.length === 0 ? (
            <div className="py-12 text-center text-[#787b86] text-sm">
              No matching symbols found for &quot;{query}&quot;
            </div>
          ) : (
            filteredTickers.map((ticker) => {
              const isSelected = ticker.symbol === selectedSymbol;
              const isUp = ticker.change >= 0;

              return (
                <button
                  key={ticker.symbol}
                  onClick={() => {
                    onSelectTicker(ticker);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#2a2e39]/50 transition-colors text-left group ${
                    isSelected ? 'bg-[#2962ff]/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-[#131722] border border-[#2a2e39] flex items-center justify-center font-mono font-bold text-xs text-[#2962ff]">
                      {ticker.symbol.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-[#2962ff] transition-colors">
                          {ticker.symbol}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-[#787b86] bg-[#131722] px-1.5 py-0.5 rounded border border-[#2a2e39]">
                          {ticker.assetClass}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2962ff]" />}
                      </div>
                      <p className="text-xs text-[#787b86] truncate max-w-xs sm:max-w-md">
                        {ticker.name} {ticker.sector ? `· ${ticker.sector}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums shrink-0 ml-4">
                    <div className="text-sm font-semibold text-white">
                      {ticker.price < 2
                        ? ticker.price.toFixed(4)
                        : ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`text-xs font-medium flex items-center justify-end ${
                        isUp ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="w-3 h-3 mr-1 inline" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1 inline" />
                      )}
                      {isUp ? '+' : ''}
                      {ticker.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#131722] border-t border-[#2a2e39] flex items-center justify-between text-[11px] text-[#787b86]">
          <span>Select any ticker to launch interactive chart</span>
          <span className="font-mono">{filteredTickers.length} results</span>
        </div>
      </div>
    </div>
  );
};

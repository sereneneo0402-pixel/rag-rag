import React, { useState } from 'react';
import { MarketTicker, PriceAlert } from '../../types/market';
import { 
  Star, Bell, Layers, Sparkles, X, Plus, Trash2, 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Check
} from 'lucide-react';

interface WatchlistAlertsDockProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: MarketTicker[];
  selectedTicker: MarketTicker;
  onSelectTicker: (ticker: MarketTicker) => void;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  alerts: PriceAlert[];
  onAddAlert: (symbol: string, condition: 'above' | 'below', targetPrice: number) => void;
  onDeleteAlert: (alertId: string) => void;
}

export const WatchlistAlertsDock: React.FC<WatchlistAlertsDockProps> = ({
  isOpen,
  onClose,
  tickers,
  selectedTicker,
  onSelectTicker,
  watchlist,
  onToggleWatchlist,
  alerts,
  onAddAlert,
  onDeleteAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'alerts' | 'orderbook' | 'analyst'>('watchlist');
  
  // Alert creation state
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alertSuccess, setAlertSuccess] = useState<boolean>(false);

  // Filter tickers in watchlist
  const watchlistTickers = tickers.filter((t) => watchlist.includes(t.symbol));

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(alertTargetPrice);
    if (isNaN(price) || price <= 0) return;

    onAddAlert(selectedTicker.symbol, alertCondition, price);
    setAlertTargetPrice('');
    setAlertSuccess(true);
    setTimeout(() => setAlertSuccess(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-14 right-0 bottom-0 z-30 w-80 sm:w-96 bg-[#1e222d] border-l border-[#2a2e39] shadow-2xl flex flex-col select-none animate-in slide-in-from-right duration-200">
      
      {/* Top Header Rail */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#131722] border-b border-[#2a2e39]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`p-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'watchlist'
                ? 'bg-[#2a2e39] text-[#2962ff]'
                : 'text-[#787b86] hover:text-white'
            }`}
            title="Watchlist"
          >
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Watchlist</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`p-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'alerts'
                ? 'bg-[#2a2e39] text-[#2962ff]'
                : 'text-[#787b86] hover:text-white'
            }`}
            title="Price Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('orderbook')}
            className={`p-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'orderbook'
                ? 'bg-[#2a2e39] text-[#2962ff]'
                : 'text-[#787b86] hover:text-white'
            }`}
            title="Order Book / Depth"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Depth</span>
          </button>

          <button
            onClick={() => setActiveTab('analyst')}
            className={`p-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'analyst'
                ? 'bg-[#2a2e39] text-amber-400'
                : 'text-[#787b86] hover:text-white'
            }`}
            title="Technical Analyst"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Insights</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-[#787b86] hover:text-white p-1.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        
        {/* TAB 1: WATCHLIST */}
        {activeTab === 'watchlist' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[#787b86] px-1 font-medium">
              <span>Pinned Instruments ({watchlistTickers.length})</span>
              <span className="font-mono text-[11px]">Symbol / Chg%</span>
            </div>

            {watchlistTickers.length === 0 ? (
              <div className="py-12 text-center text-[#787b86] space-y-2">
                <Star className="w-6 h-6 mx-auto opacity-40 text-amber-400" />
                <p>No symbols in your watchlist.</p>
                <p className="text-[11px] opacity-70">
                  Click the star icon next to any ticker in Overview or Screener to pin it here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#2a2e39]/50">
                {watchlistTickers.map((t) => {
                  const isUp = t.change >= 0;
                  const isCurrent = t.symbol === selectedTicker.symbol;

                  return (
                    <div
                      key={t.symbol}
                      onClick={() => onSelectTicker(t)}
                      className={`py-2 px-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isCurrent ? 'bg-[#2962ff]/15' : 'hover:bg-[#2a2e39]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(t.symbol);
                          }}
                          className="text-amber-400 hover:text-[#787b86] p-0.5"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </button>
                        <div>
                          <span className="font-bold text-white block">{t.symbol}</span>
                          <span className="text-[10px] text-[#787b86] truncate max-w-[100px] block">
                            {t.name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono tabular-nums">
                        <div className="text-white font-semibold">
                          {t.price < 2 ? t.price.toFixed(4) : t.price.toLocaleString()}
                        </div>
                        <div
                          className={`text-[11px] font-semibold ${
                            isUp ? 'text-[#089981]' : 'text-[#f23645]'
                          }`}
                        >
                          {isUp ? '+' : ''}{t.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRICE ALERTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {/* Create Alert Form */}
            <form onSubmit={handleCreateAlert} className="p-3 bg-[#131722] border border-[#2a2e39] rounded-xl space-y-3">
              <div className="flex items-center justify-between text-white font-bold">
                <span>Set Alert for {selectedTicker.symbol}</span>
                <span className="text-[11px] font-mono text-[#787b86]">
                  Current: ${selectedTicker.price.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAlertCondition('above')}
                  className={`py-1.5 rounded font-semibold ${
                    alertCondition === 'above' ? 'bg-[#089981] text-white' : 'bg-[#1e222d] text-[#787b86]'
                  }`}
                >
                  Crosses Above ↑
                </button>
                <button
                  type="button"
                  onClick={() => setAlertCondition('below')}
                  className={`py-1.5 rounded font-semibold ${
                    alertCondition === 'below' ? 'bg-[#f23645] text-white' : 'bg-[#1e222d] text-[#787b86]'
                  }`}
                >
                  Crosses Below ↓
                </button>
              </div>

              <div>
                <label className="text-[11px] text-[#787b86] block mb-1">Target Price ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={`e.g. ${(selectedTicker.price * 1.05).toFixed(2)}`}
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(e.target.value)}
                  className="w-full bg-[#1e222d] border border-[#2a2e39] rounded px-3 py-1.5 text-white font-mono focus:border-[#2962ff] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white font-bold rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Price Alert</span>
              </button>

              {alertSuccess && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 justify-center">
                  <Check className="w-3.5 h-3.5" />
                  <span>Alert active and monitoring</span>
                </div>
              )}
            </form>

            {/* Active alerts list */}
            <div className="space-y-2">
              <span className="text-xs text-[#787b86] font-semibold block px-1">Active Alerts ({alerts.length})</span>
              {alerts.length === 0 ? (
                <p className="text-center py-6 text-[#787b86]">No active alerts configured.</p>
              ) : (
                alerts.map((al) => (
                  <div
                    key={al.id}
                    className="p-2.5 rounded-lg bg-[#131722] border border-[#2a2e39] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{al.symbol}</span>
                        <span className="text-[10px] text-[#787b86]">
                          {al.condition === 'above' ? '≥' : '≤'} ${al.targetPrice.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#787b86] block font-sans">
                        Triggered on condition
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteAlert(al.id)}
                      className="text-[#787b86] hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ORDER BOOK / DEPTH LADDER */}
        {activeTab === 'orderbook' && (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between text-[#787b86] text-[11px] px-1 font-sans font-medium">
              <span>Price (USD)</span>
              <span>Size</span>
              <span>Total</span>
            </div>

            {/* Asks (Red) */}
            <div className="space-y-1">
              {[0.006, 0.004, 0.002, 0.001].map((delta, i) => {
                const askPrice = selectedTicker.price * (1 + delta);
                const size = Math.round(150 + i * 90 + Math.random() * 40);
                const total = Math.round(size * askPrice);
                const barWidth = 25 + i * 20;

                return (
                  <div key={`ask-${i}`} className="relative flex items-center justify-between px-2 py-1 text-xs text-[#f23645] bg-[#131722]/50 rounded overflow-hidden">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#f23645]/15"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                    <span className="font-semibold relative z-10">${askPrice.toFixed(2)}</span>
                    <span className="text-[#9598a1] relative z-10">{size}</span>
                    <span className="text-[#787b86] text-[11px] relative z-10">${(total / 1000).toFixed(1)}k</span>
                  </div>
                );
              })}
            </div>

            {/* Spread Row */}
            <div className="py-2 px-3 bg-[#131722] border-y border-[#2a2e39] flex items-center justify-between text-xs">
              <span className="font-bold text-white text-sm">
                ${selectedTicker.price.toFixed(2)}
              </span>
              <span className="text-[11px] text-[#787b86] font-sans">
                Spread: $0.02 (0.01%)
              </span>
            </div>

            {/* Bids (Green) */}
            <div className="space-y-1">
              {[0.001, 0.002, 0.004, 0.006].map((delta, i) => {
                const bidPrice = selectedTicker.price * (1 - delta);
                const size = Math.round(180 + (4 - i) * 80 + Math.random() * 40);
                const total = Math.round(size * bidPrice);
                const barWidth = 85 - i * 18;

                return (
                  <div key={`bid-${i}`} className="relative flex items-center justify-between px-2 py-1 text-xs text-[#089981] bg-[#131722]/50 rounded overflow-hidden">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#089981]/15"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                    <span className="font-semibold relative z-10">${bidPrice.toFixed(2)}</span>
                    <span className="text-[#9598a1] relative z-10">{size}</span>
                    <span className="text-[#787b86] text-[11px] relative z-10">${(total / 1000).toFixed(1)}k</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: TECHNICAL ANALYST & INSIGHTS */}
        {activeTab === 'analyst' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#131722] border border-[#2a2e39] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Technical Summary</span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  {selectedTicker.rating}
                </span>
              </div>
              <p className="text-[#9598a1] text-xs leading-relaxed">
                {selectedTicker.symbol} trades in a sustained bullish continuation channel above its 20-period and 50-period EMAs. Relative Strength Index (RSI 14) registers healthy momentum without overextension.
              </p>
            </div>

            <div className="p-3 bg-[#131722] border border-[#2a2e39] rounded-xl space-y-2.5 font-mono text-xs">
              <span className="text-[#787b86] font-sans font-semibold block text-xs">
                Key Support & Resistance
              </span>
              <div className="flex justify-between">
                <span className="text-[#787b86]">Resistance 2 (R2):</span>
                <span className="text-white font-bold">${(selectedTicker.price * 1.06).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787b86]">Resistance 1 (R1):</span>
                <span className="text-white font-bold">${(selectedTicker.price * 1.025).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787b86]">Pivot Point (P):</span>
                <span className="text-[#2962ff] font-bold">${selectedTicker.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787b86]">Support 1 (S1):</span>
                <span className="text-white font-bold">${(selectedTicker.price * 0.975).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787b86]">Support 2 (S2):</span>
                <span className="text-white font-bold">${(selectedTicker.price * 0.94).toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-[#131722] border border-[#2a2e39] rounded-xl space-y-1.5 text-xs">
              <span className="text-[#787b86] font-semibold block text-xs">Moving Averages Gauge</span>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#089981] font-bold">12 Buy</span>
                <span className="text-[#787b86]">2 Neutral</span>
                <span className="text-[#f23645] font-bold">1 Sell</span>
              </div>
              <div className="w-full h-1.5 bg-[#2a2e39] rounded-full overflow-hidden flex">
                <div className="h-full bg-[#089981]" style={{ width: '80%' }}></div>
                <div className="h-full bg-[#787b86]" style={{ width: '13%' }}></div>
                <div className="h-full bg-[#f23645]" style={{ width: '7%' }}></div>
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};

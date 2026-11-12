import React, { useState } from 'react';
import { MarketTicker, AssetClass } from '../../types/market';
import { 
  TrendingUp, TrendingDown, Star, BarChart2, ArrowRight,
  Flame, Award, Activity, Compass, ChevronRight
} from 'lucide-react';
import { SECTOR_PERFORMANCE, MARKET_NEWS } from '../../data/mockMarketData';

interface MarketOverviewProps {
  tickers: MarketTicker[];
  onSelectTicker: (ticker: MarketTicker) => void;
  onOpenChart: (ticker: MarketTicker) => void;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  tickers,
  onSelectTicker,
  onOpenChart,
  watchlist,
  onToggleWatchlist,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | AssetClass>('all');
  const [moversTab, setMoversTab] = useState<'gainers' | 'losers' | 'active'>('gainers');

  // Filtered tickers
  const displayedTickers = activeTab === 'all' 
    ? tickers 
    : tickers.filter(t => t.assetClass === activeTab);

  // Top gainers, losers, active
  const topGainers = [...tickers].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...tickers].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const mostActive = [...tickers].filter(t => t.assetClass === 'stocks' || t.assetClass === 'crypto').slice(0, 5);

  const currentMovers = moversTab === 'gainers' 
    ? topGainers 
    : moversTab === 'losers' 
      ? topLosers 
      : mostActive;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-8 select-none">
      
      {/* 1. Market Sentiment & Macro Indicators Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fear & Greed Index */}
        <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#787b86]">
            <span>Market Sentiment</span>
            <span className="text-[11px] text-emerald-400 font-semibold">Greed (68)</span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-bold text-white tracking-tight">68 / 100</span>
              <span className="text-xs text-[#787b86]">Prior: 64</span>
            </div>
            {/* Visual meter */}
            <div className="w-full h-2 bg-[#131722] rounded-full overflow-hidden flex">
              <div className="h-full bg-rose-500 w-1/4 opacity-40"></div>
              <div className="h-full bg-amber-500 w-1/4 opacity-50"></div>
              <div className="h-full bg-emerald-500 w-1/4"></div>
              <div className="h-full bg-emerald-400 w-1/4"></div>
            </div>
          </div>
          <p className="text-[11px] text-[#787b86]">S&P 500 options skew points to risk-on expansion</p>
        </div>

        {/* Volatility Index (VIX) */}
        <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#787b86]">
            <span>CBOE Volatility (VIX)</span>
            <span className="text-emerald-400 text-xs font-semibold">-4.12%</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">13.82</div>
            <p className="text-xs text-[#787b86] mt-0.5">Implied 30-day index volatility low</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#787b86]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            <span>Calm Market Regime (&lt;15)</span>
          </div>
        </div>

        {/* Market Breadth (Advances / Declines) */}
        <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#787b86]">
            <span>NYSE / NASDAQ Breadth</span>
            <span className="text-[#2962ff] text-xs font-semibold">2.9x Advancers</span>
          </div>
          <div className="my-2">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-[#089981] font-semibold">3,420 Adv</span>
              <span className="text-[#f23645] font-semibold">1,180 Dec</span>
            </div>
            <div className="w-full h-2 bg-[#131722] rounded-full overflow-hidden flex">
              <div className="h-full bg-[#089981]" style={{ width: '74%' }}></div>
              <div className="h-full bg-[#f23645]" style={{ width: '26%' }}></div>
            </div>
          </div>
          <p className="text-[11px] text-[#787b86]">74% of traded equities advancing today</p>
        </div>

        {/* Global Market Cap */}
        <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#787b86]">
            <span>Global Equities & Crypto</span>
            <span className="text-emerald-400 text-xs font-semibold">+1.24%</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">$118.42T</div>
            <p className="text-xs text-[#787b86] mt-0.5">Crypto Market Cap: $3.15T (BTC 58.2%)</p>
          </div>
          <div className="text-[11px] text-[#787b86]">24h Global Volume: $286.4B</div>
        </div>
      </section>

      {/* 2. Main Market Explorer Table */}
      <section className="bg-[#1e222d] border border-[#2a2e39] rounded-xl overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#2a2e39] bg-[#171b26]">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Markets' },
              { id: 'indices', label: 'Indices' },
              { id: 'stocks', label: 'Stocks' },
              { id: 'crypto', label: 'Crypto' },
              { id: 'forex', label: 'Forex' },
              { id: 'commodities', label: 'Commodities' },
              { id: 'bonds', label: 'Bonds' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#2962ff] text-white shadow-xs'
                    : 'text-[#9598a1] hover:text-white hover:bg-[#2a2e39]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#787b86] font-mono">
            Showing {displayedTickers.length} instruments
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2a2e39] text-[#787b86] font-medium bg-[#131722]/60">
                <th className="py-3 px-4 w-10 text-center">★</th>
                <th className="py-3 px-4">Symbol / Name</th>
                <th className="py-3 px-4 text-right">Last Price</th>
                <th className="py-3 px-4 text-right">Change</th>
                <th className="py-3 px-4 text-right">Change %</th>
                <th className="py-3 px-4 text-right hidden md:table-cell">24h High / Low</th>
                <th className="py-3 px-4 text-right hidden lg:table-cell">Volume</th>
                <th className="py-3 px-4 text-center">Technical Rating</th>
                <th className="py-3 px-4 text-center hidden sm:table-cell">7D Trend</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]/50 font-mono tabular-nums">
              {displayedTickers.map((ticker) => {
                const isUp = ticker.change >= 0;
                const inWatchlist = watchlist.includes(ticker.symbol);

                return (
                  <tr
                    key={ticker.symbol}
                    onClick={() => onSelectTicker(ticker)}
                    className="hover:bg-[#2a2e39]/50 transition-colors cursor-pointer group"
                  >
                    {/* Watchlist toggle */}
                    <td 
                      className="py-3 px-4 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(ticker.symbol);
                      }}
                    >
                      <button className="text-[#787b86] hover:text-amber-400 transition-colors p-1">
                        <Star
                          className={`w-4 h-4 ${
                            inWatchlist ? 'fill-amber-400 text-amber-400' : ''
                          }`}
                        />
                      </button>
                    </td>

                    {/* Symbol & Name */}
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#131722] border border-[#2a2e39] flex items-center justify-center font-mono font-bold text-[11px] text-[#2962ff] shrink-0">
                          {ticker.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm group-hover:text-[#2962ff] transition-colors">
                              {ticker.symbol}
                            </span>
                            {ticker.country && (
                              <span className="text-[10px] text-[#787b86] font-semibold">
                                {ticker.country}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#787b86] block truncate max-w-[140px] sm:max-w-[200px]">
                            {ticker.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Last Price */}
                    <td className="py-3 px-4 text-right font-semibold text-white text-sm">
                      {ticker.price < 2
                        ? ticker.price.toFixed(4)
                        : ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Change */}
                    <td
                      className={`py-3 px-4 text-right font-medium ${
                        isUp ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {isUp ? '+' : ''}
                      {ticker.price < 2 ? ticker.change.toFixed(4) : ticker.change.toFixed(2)}
                    </td>

                    {/* Change % */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          isUp
                            ? 'bg-[#089981]/15 text-[#089981]'
                            : 'bg-[#f23645]/15 text-[#f23645]'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {ticker.changePercent.toFixed(2)}%
                      </span>
                    </td>

                    {/* 24h High/Low */}
                    <td className="py-3 px-4 text-right text-xs text-[#787b86] hidden md:table-cell">
                      <span>{ticker.high24h.toLocaleString()}</span>
                      <span className="mx-1 text-[#434651]">/</span>
                      <span>{ticker.low24h.toLocaleString()}</span>
                    </td>

                    {/* Volume */}
                    <td className="py-3 px-4 text-right text-xs text-[#9598a1] hidden lg:table-cell">
                      {ticker.volume}
                    </td>

                    {/* Technical Rating */}
                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          ticker.rating === 'Strong Buy'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ticker.rating === 'Buy'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : ticker.rating === 'Neutral'
                            ? 'bg-[#2a2e39] text-[#b2b5be]'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {ticker.rating}
                      </span>
                    </td>

                    {/* 7D Sparkline */}
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <div className="w-20 h-6 mx-auto flex items-center justify-center">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30">
                          {(() => {
                            const min = Math.min(...ticker.sparkline);
                            const max = Math.max(...ticker.sparkline);
                            const range = max - min || 1;
                            const points = ticker.sparkline
                              .map((val, idx) => {
                                const x = (idx / (ticker.sparkline.length - 1)) * 100;
                                const y = 28 - ((val - min) / range) * 26;
                                return `${x},${y}`;
                              })
                              .join(' ');
                            return (
                              <polyline
                                fill="none"
                                stroke={isUp ? '#089981' : '#f23645'}
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={points}
                              />
                            );
                          })()}
                        </svg>
                      </div>
                    </td>

                    {/* Action button */}
                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChart(ticker);
                        }}
                        className="px-2.5 py-1 rounded bg-[#2a2e39] hover:bg-[#2962ff] text-white text-[11px] font-medium transition-colors flex items-center gap-1 mx-auto"
                      >
                        <BarChart2 className="w-3 h-3" />
                        <span>Chart</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Movers & Sector Performance Split */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Movers Switcher Card */}
        <div className="lg:col-span-1 bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39]">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Market Movers</h3>
            </div>
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#131722] p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setMoversTab('gainers')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  moversTab === 'gainers' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
                }`}
              >
                Gainers
              </button>
              <button
                onClick={() => setMoversTab('losers')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  moversTab === 'losers' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
                }`}
              >
                Losers
              </button>
              <button
                onClick={() => setMoversTab('active')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  moversTab === 'active' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
                }`}
              >
                Active
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#2a2e39]/40 mt-2 flex-1">
            {currentMovers.map((item) => {
              const isUp = item.change >= 0;
              return (
                <div
                  key={item.symbol}
                  onClick={() => onSelectTicker(item)}
                  className="py-2.5 flex items-center justify-between hover:bg-[#2a2e39]/30 px-2 rounded cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{item.symbol}</div>
                    <div className="text-[11px] text-[#787b86] truncate max-w-[130px]">{item.name}</div>
                  </div>

                  <div className="text-right font-mono tabular-nums text-xs">
                    <div className="font-semibold text-white">
                      {item.price < 2 ? item.price.toFixed(4) : item.price.toLocaleString()}
                    </div>
                    <div className={`text-[11px] font-medium ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                      {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* S&P 500 Sector Performance */}
        <div className="lg:col-span-2 bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39]">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#2962ff]" />
              <h3 className="text-sm font-bold text-white">S&P 500 Sector Performance</h3>
            </div>
            <span className="text-xs text-[#787b86]">1-Day Returns</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {SECTOR_PERFORMANCE.map((sector) => (
              <div key={sector.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#d1d4dc] font-medium truncate">{sector.name}</span>
                  <span
                    className={`font-mono font-semibold tabular-nums text-xs ${
                      sector.positive ? 'text-[#089981]' : 'text-[#f23645]'
                    }`}
                  >
                    {sector.positive ? '+' : ''}
                    {sector.change.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#131722] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sector.positive ? 'bg-[#089981]' : 'bg-[#f23645]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.abs(sector.change) * 35)}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#2a2e39] flex items-center justify-between text-[11px] text-[#787b86]">
            <span>Leading sector: Consumer Discretionary (+2.12%)</span>
            <span>Lagging: Real Estate (-1.24%)</span>
          </div>
        </div>
      </section>

      {/* 4. Live News Wire */}
      <section className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39] mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Market Wire & Financial Breaking News</span>
          </h3>
          <span className="text-xs text-[#787b86]">Live updates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MARKET_NEWS.slice(0, 3).map((news) => (
            <div
              key={news.id}
              className="p-3.5 rounded-lg bg-[#131722] border border-[#2a2e39] hover:border-[#434651] transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#787b86] mb-2">
                  <span className="font-semibold text-[#2962ff]">{news.source}</span>
                  <span>{news.time}</span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2 mb-2 leading-relaxed hover:text-[#2962ff] cursor-pointer">
                  {news.title}
                </h4>
                <p className="text-[11px] text-[#787b86] line-clamp-2 leading-normal">
                  {news.summary}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2a2e39]/60 text-[10px]">
                <div className="flex items-center gap-1 font-mono">
                  {news.relatedTickers.map((t) => (
                    <span key={t} className="bg-[#1e222d] text-[#b2b5be] px-1.5 py-0.5 rounded font-semibold">
                      ${t}
                    </span>
                  ))}
                </div>
                <span
                  className={`font-semibold capitalize ${
                    news.sentiment === 'bullish'
                      ? 'text-[#089981]'
                      : news.sentiment === 'bearish'
                      ? 'text-[#f23645]'
                      : 'text-[#9598a1]'
                  }`}
                >
                  {news.sentiment}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

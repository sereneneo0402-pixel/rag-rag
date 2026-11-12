import React, { useState } from 'react';
import { ECONOMIC_EVENTS, MARKET_NEWS } from '../../data/mockMarketData';
import { MarketTicker } from '../../types/market';
import { Calendar, Clock, AlertTriangle, Globe, ExternalLink, Filter, TrendingUp, TrendingDown } from 'lucide-react';

interface EconomicCalendarProps {
  onOpenChart: (ticker: MarketTicker) => void;
  tickers: MarketTicker[];
}

export const EconomicCalendar: React.FC<EconomicCalendarProps> = ({
  onOpenChart,
  tickers,
}) => {
  const [impactFilter, setImpactFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'Today' | 'Tomorrow' | 'Friday'>('all');
  const [newsCategory, setNewsCategory] = useState<string>('all');

  const filteredEvents = ECONOMIC_EVENTS.filter((ev) => {
    if (impactFilter !== 'all' && ev.impact !== impactFilter) return false;
    if (dateFilter !== 'all' && ev.date !== dateFilter) return false;
    return true;
  });

  const filteredNews = newsCategory === 'all'
    ? MARKET_NEWS
    : MARKET_NEWS.filter((n) => n.category.toLowerCase() === newsCategory.toLowerCase());

  const handleTickerClick = (symbol: string) => {
    const t = tickers.find((item) => item.symbol === symbol);
    if (t) onOpenChart(t);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-8 select-none">
      
      {/* 1. Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Economic Calendar & News Wire</h1>
        <p className="text-xs text-[#787b86] mt-0.5">
          Global macroeconomic indicators, central bank releases, and live financial market intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Economic Calendar (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl overflow-hidden">
            
            {/* Calendar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#171b26] border-b border-[#2a2e39] text-xs">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Calendar className="w-4 h-4 text-[#2962ff]" />
                <span>Economic Events</span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Date buttons */}
                <div className="flex items-center gap-1 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
                  {(['all', 'Today', 'Tomorrow', 'Friday'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDateFilter(d)}
                      className={`px-2 py-0.5 rounded font-semibold text-[11px] capitalize transition-colors ${
                        dateFilter === d ? 'bg-[#2962ff] text-white' : 'text-[#787b86]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                {/* Impact filter */}
                <div className="flex items-center gap-1 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
                  <button
                    onClick={() => setImpactFilter('all')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      impactFilter === 'all' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
                    }`}
                  >
                    All Impact
                  </button>
                  <button
                    onClick={() => setImpactFilter('high')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold text-rose-400 ${
                      impactFilter === 'high' ? 'bg-rose-500/20 text-rose-300' : ''
                    }`}
                  >
                    High Only
                  </button>
                </div>
              </div>
            </div>

            {/* Events Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-[#2a2e39] text-[#787b86] font-sans font-medium bg-[#131722]/50">
                    <th className="py-2.5 px-4">Time / Day</th>
                    <th className="py-2.5 px-3">Country</th>
                    <th className="py-2.5 px-3 text-center">Impact</th>
                    <th className="py-2.5 px-4">Event</th>
                    <th className="py-2.5 px-3 text-right">Actual</th>
                    <th className="py-2.5 px-3 text-right">Forecast</th>
                    <th className="py-2.5 px-4 text-right">Previous</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2e39]/50">
                  {filteredEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#2a2e39]/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        <span>{ev.time}</span>
                        <span className="block text-[10px] text-[#787b86] font-sans">{ev.date}</span>
                      </td>

                      <td className="py-3 px-3 font-sans whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{ev.flag}</span>
                          <span className="font-medium text-[#d1d4dc] text-xs">{ev.currency}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-sans">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ev.impact === 'high'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : ev.impact === 'medium'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-[#2a2e39] text-[#787b86]'
                          }`}
                        >
                          {ev.impact}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-sans font-medium text-white max-w-xs">
                        {ev.event}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-white">
                        {ev.actual || '—'}
                      </td>

                      <td className="py-3 px-3 text-right text-[#9598a1]">
                        {ev.forecast || '—'}
                      </td>

                      <td className="py-3 px-4 text-right text-[#787b86]">
                        {ev.previous || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 bg-[#131722] border-t border-[#2a2e39] text-[11px] text-[#787b86] flex items-center justify-between">
              <span>Next high-impact release: US Core CPI (MoM)</span>
              <span>All times in EST</span>
            </div>
          </div>
        </div>

        {/* Live News Wire (Right col) */}
        <div className="space-y-4">
          <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39]">
              <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Financial News Wire</span>
              </div>
              <span className="text-[11px] text-[#787b86] font-mono">Live Feed</span>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1 py-2 overflow-x-auto no-scrollbar text-xs">
              {['all', 'Stocks', 'Crypto', 'Bonds', 'Commodities'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewsCategory(cat)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors ${
                    newsCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-[#2962ff] text-white'
                      : 'text-[#787b86] hover:text-white bg-[#131722]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* News items list */}
            <div className="space-y-3 mt-2 overflow-y-auto max-h-[600px] pr-1">
              {filteredNews.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg bg-[#131722] border border-[#2a2e39] hover:border-[#434651] transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#787b86] mb-1.5">
                      <span className="font-semibold text-[#2962ff]">{n.source}</span>
                      <span>{n.time}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-relaxed mb-1.5 hover:text-[#2962ff] cursor-pointer">
                      {n.title}
                    </h4>
                    <p className="text-[11px] text-[#787b86] leading-normal line-clamp-2">
                      {n.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2a2e39]/50 text-[10px]">
                    <div className="flex items-center gap-1">
                      {n.relatedTickers.map((sym) => (
                        <button
                          key={sym}
                          onClick={() => handleTickerClick(sym)}
                          className="bg-[#1e222d] hover:bg-[#2962ff] hover:text-white text-[#b2b5be] px-1.5 py-0.5 rounded font-mono font-bold transition-colors"
                        >
                          ${sym}
                        </button>
                      ))}
                    </div>
                    <span
                      className={`font-semibold capitalize ${
                        n.sentiment === 'bullish'
                          ? 'text-[#089981]'
                          : n.sentiment === 'bearish'
                          ? 'text-[#f23645]'
                          : 'text-[#9598a1]'
                      }`}
                    >
                      {n.sentiment}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

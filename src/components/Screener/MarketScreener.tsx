import React, { useState, useMemo } from 'react';
import { MarketTicker, AssetClass, TechnicalRating } from '../../types/market';
import { 
  Search, Filter, ArrowUpDown, Download, Star, BarChart2,
  CheckCircle, ChevronDown, Sparkles
} from 'lucide-react';

interface MarketScreenerProps {
  tickers: MarketTicker[];
  onOpenChart: (ticker: MarketTicker) => void;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
}

export const MarketScreener: React.FC<MarketScreenerProps> = ({
  tickers,
  onOpenChart,
  watchlist,
  onToggleWatchlist,
}) => {
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof MarketTicker>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activePreset, setActivePreset] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<'all' | 'momentum' | 'oversold'>('all');

  // Available sectors from data
  const sectors = useMemo(() => {
    const set = new Set<string>();
    tickers.forEach(t => {
      if (t.sector) set.add(t.sector);
    });
    return Array.from(set);
  }, [tickers]);

  // Apply filters and sorting
  const filteredTickers = useMemo(() => {
    return tickers.filter((t) => {
      // Search
      const matchesSearch = 
        t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      // Asset
      if (selectedAsset !== 'all' && t.assetClass !== selectedAsset) return false;

      // Sector
      if (selectedSector !== 'all' && t.sector !== selectedSector) return false;

      // Rating
      if (selectedRating !== 'all' && t.rating !== selectedRating) return false;

      // Pro Technical filter
      if (techFilter === 'momentum' && t.changePercent <= 1) return false;
      if (techFilter === 'oversold' && t.changePercent >= 0) return false;

      // Presets
      if (activePreset === 'gainers' && t.changePercent < 2) return false;
      if (activePreset === 'mega' && (!t.marketCap || !t.marketCap.includes('T'))) return false;
      if (activePreset === 'strong_buy' && t.rating !== 'Strong Buy') return false;
      if (activePreset === 'golden' && (t.rating !== 'Strong Buy' || t.changePercent <= 0)) return false;

      return true;
    }).sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle market cap string sorting
      if (sortField === 'marketCap') {
        const parseCap = (c?: string) => {
          if (!c) return 0;
          if (c.includes('T')) return parseFloat(c) * 1000;
          if (c.includes('B')) return parseFloat(c);
          return 0;
        };
        aVal = parseCap(a.marketCap);
        bVal = parseCap(b.marketCap);
      }

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [tickers, search, selectedAsset, selectedSector, selectedRating, sortField, sortOrder, activePreset]);

  const handleSort = (field: keyof MarketTicker) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Symbol', 'Name', 'AssetClass', 'Price', 'ChangePercent', 'Volume', 'MarketCap', 'Rating'];
    const rows = filteredTickers.map(t => [
      t.symbol,
      `"${t.name}"`,
      t.assetClass,
      t.price,
      t.changePercent,
      t.volume,
      t.marketCap || 'N/A',
      t.rating,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradingview_screener_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 select-none">
      
      {/* Title & Presets Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Market Screener</h1>
          <p className="text-xs text-[#787b86] mt-0.5">
            Filter, rank, and analyze {tickers.length} global stocks, cryptocurrencies, and instruments
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[#787b86] mr-1">PRO Presets:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'golden', label: 'Golden Cross Momentum' },
            { id: 'gainers', label: 'Gainers >2%' },
            { id: 'mega', label: 'Trillion Club ($1T+)' },
            { id: 'strong_buy', label: 'Strong Buy' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setActivePreset(preset.id)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                activePreset === preset.id
                  ? 'bg-[#2962ff] text-white shadow-xs'
                  : 'bg-[#1e222d] text-[#787b86] hover:text-white border border-[#2a2e39]'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] text-white transition-colors ml-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search query */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#787b86] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker or name..."
              className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#787b86] focus:border-[#2962ff] focus:outline-none"
            />
          </div>

          {/* Asset Class Filter */}
          <div>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-2 text-xs text-white focus:border-[#2962ff] focus:outline-none"
            >
              <option value="all">All Asset Classes</option>
              <option value="stocks">Stocks</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="indices">Indices</option>
              <option value="forex">Forex</option>
              <option value="commodities">Commodities</option>
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-2 text-xs text-white focus:border-[#2962ff] focus:outline-none"
            >
              <option value="all">All Sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Technical Rating Filter */}
          <div>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-2 text-xs text-white focus:border-[#2962ff] focus:outline-none"
            >
              <option value="all">All Ratings</option>
              <option value="Strong Buy">Strong Buy</option>
              <option value="Buy">Buy</option>
              <option value="Neutral">Neutral</option>
              <option value="Sell">Sell</option>
            </select>
          </div>

          {/* Technical Strategy */}
          <div>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value as any)}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-2 text-xs text-white focus:border-[#2962ff] focus:outline-none font-semibold text-[#2962ff]"
            >
              <option value="all">All Strategies</option>
              <option value="momentum">Momentum Trend (+1% &gt;)</option>
              <option value="oversold">Dip / Oversold Pullback</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
            <thead>
              <tr className="border-b border-[#2a2e39] text-[#787b86] font-sans font-medium bg-[#131722]">
                <th className="py-3 px-4 w-10 text-center">★</th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('symbol')}>
                  <div className="flex items-center gap-1">
                    <span>Symbol</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Last Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('changePercent')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Change %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white hidden sm:table-cell" onClick={() => handleSort('volume')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Volume</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white hidden md:table-cell" onClick={() => handleSort('marketCap')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Market Cap</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-white hidden lg:table-cell" onClick={() => handleSort('peRatio')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>P/E</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Technical Rating</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]/50">
              {filteredTickers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#787b86] font-sans text-sm">
                    No instruments meet the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTickers.map((ticker) => {
                  const isUp = ticker.change >= 0;
                  const inWatchlist = watchlist.includes(ticker.symbol);

                  return (
                    <tr
                      key={ticker.symbol}
                      className="hover:bg-[#2a2e39]/40 transition-colors cursor-pointer group"
                      onClick={() => onOpenChart(ticker)}
                    >
                      <td
                        className="py-3 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(ticker.symbol);
                        }}
                      >
                        <button className="text-[#787b86] hover:text-amber-400 transition-colors p-1">
                          <Star className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs group-hover:text-[#2962ff] transition-colors">
                            {ticker.symbol}
                          </span>
                          <span className="text-[11px] text-[#787b86] truncate max-w-[140px]">
                            {ticker.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-white">
                        {ticker.price < 2 ? ticker.price.toFixed(4) : ticker.price.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                          isUp ? 'bg-[#089981]/15 text-[#089981]' : 'bg-[#f23645]/15 text-[#f23645]'
                        }`}>
                          {isUp ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right text-xs text-[#9598a1] hidden sm:table-cell">
                        {ticker.volume}
                      </td>

                      <td className="py-3 px-4 text-right text-xs text-white hidden md:table-cell">
                        {ticker.marketCap || 'N/A'}
                      </td>

                      <td className="py-3 px-4 text-right text-xs text-[#9598a1] hidden lg:table-cell">
                        {ticker.peRatio || '—'}
                      </td>

                      <td className="py-3 px-4 text-center font-sans">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          ticker.rating === 'Strong Buy'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ticker.rating === 'Buy'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : ticker.rating === 'Neutral'
                            ? 'bg-[#2a2e39] text-[#b2b5be]'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          {ticker.rating}
                        </span>
                      </td>

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
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2 bg-[#131722] border-t border-[#2a2e39] flex items-center justify-between text-xs text-[#787b86]">
          <span>Displaying {filteredTickers.length} results</span>
          <span className="font-mono">Sorted by {String(sortField)} ({sortOrder})</span>
        </div>
      </div>

    </div>
  );
};

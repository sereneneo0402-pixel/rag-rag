import React from 'react';
import { Search, Sun, Moon, TrendingUp, BarChart2, Grid, Calendar, Compass, Bell, ShieldCheck } from 'lucide-react';

export type ScreenMode = 'overview' | 'chart' | 'screener' | 'heatmap' | 'calendar';

interface HeaderProps {
  currentScreen: ScreenMode;
  onSelectScreen: (screen: ScreenMode) => void;
  onOpenSearch: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  portfolioBalance: number;
  openPositionsCount: number;
  unreadAlertsCount: number;
  onToggleRightDock: () => void;
  isRightDockOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onSelectScreen,
  onOpenSearch,
  isDark,
  onToggleTheme,
  portfolioBalance,
  openPositionsCount,
  unreadAlertsCount,
  onToggleRightDock,
  isRightDockOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2a2e39] dark:border-[#2a2e39] bg-[#131722] dark:bg-[#131722] text-[#d1d4dc] transition-colors select-none">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        
        {/* Zone 1: TradingView Brand & Markets Wordmark */}
        <div className="flex items-center gap-6 shrink-0">
          <button 
            onClick={() => onSelectScreen('overview')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
          >
            {/* Iconic TradingView symbol */}
            <div className="w-7 h-7 rounded bg-[#2962ff] flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:bg-[#1e53e5] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l5-5 4 4L21 4.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 4.5h6v6" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">TradingView</span>
              <span className="text-xs font-semibold text-[#787b86] uppercase tracking-wider">Markets</span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-Line 4-5 items) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onSelectScreen('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentScreen === 'overview'
                ? 'text-white bg-[#2a2e39]'
                : 'text-[#9598a1] hover:text-white hover:bg-[#1e222d]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => onSelectScreen('chart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentScreen === 'chart'
                ? 'text-white bg-[#2a2e39]'
                : 'text-[#9598a1] hover:text-white hover:bg-[#1e222d]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>SuperChart</span>
          </button>

          <button
            onClick={() => onSelectScreen('screener')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentScreen === 'screener'
                ? 'text-white bg-[#2a2e39]'
                : 'text-[#9598a1] hover:text-white hover:bg-[#1e222d]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Screener</span>
          </button>

          <button
            onClick={() => onSelectScreen('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentScreen === 'heatmap'
                ? 'text-white bg-[#2a2e39]'
                : 'text-[#9598a1] hover:text-white hover:bg-[#1e222d]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Heatmaps</span>
          </button>

          <button
            onClick={() => onSelectScreen('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              currentScreen === 'calendar'
                ? 'text-white bg-[#2a2e39]'
                : 'text-[#9598a1] hover:text-white hover:bg-[#1e222d]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar & News</span>
          </button>
        </nav>

        {/* Zone 3: Search, Demo Account Balance & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#787b86] bg-[#1e222d] border border-[#2a2e39] rounded-md hover:border-[#434651] hover:text-white transition-all w-32 sm:w-48 lg:w-56"
          >
            <Search className="w-3.5 h-3.5 text-[#787b86] shrink-0" />
            <span className="truncate">Search symbol (AAPL, BTC)...</span>
            <kbd className="hidden lg:inline-flex ml-auto text-[10px] bg-[#2a2e39] text-[#b2b5be] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>

          {/* Paper Trading Portfolio Balance */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-[#1e222d] border border-[#2a2e39] rounded-md text-xs font-mono">
            <span className="text-[#787b86] text-[11px] font-sans">Sim:</span>
            <span className="text-emerald-400 font-semibold tabular-nums">
              ${portfolioBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {openPositionsCount > 0 && (
              <span className="text-[10px] bg-[#2962ff]/20 text-[#2962ff] px-1 rounded font-sans font-medium">
                {openPositionsCount} Pos
              </span>
            )}
          </div>

          {/* Watchlist / Dock Toggle */}
          <button
            onClick={onToggleRightDock}
            title="Toggle Watchlist & Alerts Dock"
            className={`relative p-2 rounded-md text-xs font-medium border transition-colors ${
              isRightDockOpen
                ? 'bg-[#2962ff] text-white border-[#2962ff]'
                : 'bg-[#1e222d] text-[#9598a1] border-[#2a2e39] hover:text-white hover:border-[#434651]'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            title={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
            className="p-2 rounded-md text-[#9598a1] bg-[#1e222d] border border-[#2a2e39] hover:text-white hover:border-[#434651] transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

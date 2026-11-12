import React, { useState, useEffect, useCallback } from 'react';
import { MarketTicker, Order, Position, PriceAlert } from './types/market';
import { INITIAL_TICKERS } from './data/mockMarketData';
import { Header, ScreenMode } from './components/Header';
import { TickerRibbon } from './components/TickerRibbon';
import { SymbolSearchModal } from './components/SymbolSearchModal';
import { MarketOverview } from './components/Overview/MarketOverview';
import { SuperChart } from './components/Chart/SuperChart';
import { ProMultiChartStudio } from './components/Chart/ProMultiChartStudio';
import { TradingPanel } from './components/Chart/TradingPanel';
import { MarketScreener } from './components/Screener/MarketScreener';
import { MarketHeatmap } from './components/Heatmap/MarketHeatmap';
import { EconomicCalendar } from './components/CalendarNews/EconomicCalendar';
import { WatchlistAlertsDock } from './components/Sidebar/WatchlistAlertsDock';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [tickers, setTickers] = useState<MarketTicker[]>(INITIAL_TICKERS);
  const [selectedTicker, setSelectedTicker] = useState<MarketTicker>(
    INITIAL_TICKERS.find((t) => t.symbol === 'NVDA') || INITIAL_TICKERS[0]
  );
  const [currentScreen, setCurrentScreen] = useState<ScreenMode>('overview');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isRightDockOpen, setIsRightDockOpen] = useState(false);

  // Live tick animations
  const [recentTicks, setRecentTicks] = useState<Record<string, 'up' | 'down'>>({});

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>(['NVDA', 'AAPL', 'BTCUSD', 'SPX', 'TSLA', 'SOLUSD']);

  // Paper Trading State
  const [portfolioBalance, setPortfolioBalance] = useState<number>(100000);
  const [positions, setPositions] = useState<Position[]>([
    {
      id: 'pos-1',
      symbol: 'NVDA',
      side: 'buy',
      entryPrice: 142.50,
      currentPrice: 147.25,
      quantity: 50,
      pnl: (147.25 - 142.50) * 50,
      pnlPercent: ((147.25 - 142.50) / 142.50) * 100,
    },
    {
      id: 'pos-2',
      symbol: 'BTCUSD',
      side: 'buy',
      entryPrice: 88500,
      currentPrice: 91420,
      quantity: 0.5,
      pnl: (91420 - 88500) * 0.5,
      pnlPercent: ((91420 - 88500) / 88500) * 100,
    },
  ]);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-1',
      symbol: 'NVDA',
      type: 'market',
      side: 'buy',
      price: 142.50,
      quantity: 50,
      total: 7125.00,
      status: 'filled',
      timestamp: 'Today 09:32',
    },
  ]);

  // Trading Modal State
  const [isTradingOpen, setIsTradingOpen] = useState(false);
  const [tradingSide, setTradingSide] = useState<'buy' | 'sell'>('buy');

  // Price Alerts State
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: 'alt-1',
      symbol: 'BTCUSD',
      condition: 'above',
      targetPrice: 95000,
      createdPrice: 91420,
      active: true,
      createdAt: 'Today 10:00',
    },
    {
      id: 'alt-2',
      symbol: 'NVDA',
      condition: 'below',
      targetPrice: 140,
      createdPrice: 147.25,
      active: true,
      createdAt: 'Today 09:45',
    },
  ]);

  // Toasts
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'info' | 'success' | 'alert' }[]>([]);

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Theme synchronization
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-[#131722] text-[#d1d4dc] font-sans antialiased selection:bg-[#2962ff]/30 selection:text-white';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-[#f0f3fa] text-[#131722] font-sans antialiased selection:bg-[#2962ff]/30 selection:text-white';
    }
  }, [isDark]);

  // Live market price tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((prevTickers) => {
        // Pick 2-3 random tickers to tick
        const count = Math.floor(Math.random() * 2) + 2;
        const updated = [...prevTickers];
        const newTicks: Record<string, 'up' | 'down'> = {};

        for (let i = 0; i < count; i++) {
          const randomIndex = Math.floor(Math.random() * updated.length);
          const item = updated[randomIndex];

          const isUpTick = Math.random() > 0.48;
          const deltaPct = (Math.random() * 0.002 + 0.0005) * (isUpTick ? 1 : -1);
          const newPrice = Math.max(0.0001, item.price * (1 + deltaPct));
          const roundedPrice = Number(newPrice.toFixed(item.price < 2 ? 4 : 2));

          const diff = roundedPrice - item.price;
          const newChange = item.change + diff;
          const newChangePct = ((roundedPrice - (item.price - item.change)) / (item.price - item.change)) * 100;

          updated[randomIndex] = {
            ...item,
            price: roundedPrice,
            change: Number(newChange.toFixed(item.price < 2 ? 4 : 2)),
            changePercent: Number(newChangePct.toFixed(2)),
            high24h: Math.max(item.high24h, roundedPrice),
            low24h: Math.min(item.low24h, roundedPrice),
          };

          newTicks[item.symbol] = isUpTick ? 'up' : 'down';

          // Check alerts
          alerts.forEach((alert) => {
            if (alert.active && alert.symbol === item.symbol) {
              if (
                (alert.condition === 'above' && roundedPrice >= alert.targetPrice) ||
                (alert.condition === 'below' && roundedPrice <= alert.targetPrice)
              ) {
                addToast(
                  `Price Alert Triggered: ${alert.symbol} crossed ${alert.condition} $${alert.targetPrice.toFixed(2)} (Now $${roundedPrice.toFixed(2)})`,
                  'alert'
                );
              }
            }
          });
        }

        setRecentTicks(newTicks);

        // Clear tick flash after 900ms
        setTimeout(() => {
          setRecentTicks({});
        }, 900);

        return updated;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [alerts, addToast]);

  // Keep selectedTicker in sync with tickers state
  useEffect(() => {
    const updated = tickers.find((t) => t.symbol === selectedTicker.symbol);
    if (updated && updated.price !== selectedTicker.price) {
      setSelectedTicker(updated);
    }
  }, [tickers, selectedTicker.symbol, selectedTicker.price]);

  // Update open positions PnL when prices change
  useEffect(() => {
    setPositions((prevPositions) =>
      prevPositions.map((pos) => {
        const liveTicker = tickers.find((t) => t.symbol === pos.symbol);
        if (!liveTicker) return pos;

        const currentPrice = liveTicker.price;
        const pnl = pos.side === 'buy'
          ? (currentPrice - pos.entryPrice) * pos.quantity
          : (pos.entryPrice - currentPrice) * pos.quantity;
        const pnlPercent = (pnl / (pos.entryPrice * pos.quantity)) * 100;

        return {
          ...pos,
          currentPrice,
          pnl: Number(pnl.toFixed(2)),
          pnlPercent: Number(pnlPercent.toFixed(2)),
        };
      })
    );
  }, [tickers]);

  // Handlers
  const handleSelectTicker = (ticker: MarketTicker) => {
    setSelectedTicker(ticker);
  };

  const handleOpenChart = (ticker: MarketTicker) => {
    setSelectedTicker(ticker);
    setCurrentScreen('chart');
  };

  const handleToggleWatchlist = (symbol: string) => {
    setWatchlist((prev) => {
      const exists = prev.includes(symbol);
      const next = exists ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      addToast(
        exists ? `Removed ${symbol} from Watchlist` : `Added ${symbol} to Watchlist`,
        'success'
      );
      return next;
    });
  };

  const handleOpenTrading = (side: 'buy' | 'sell', customTicker?: MarketTicker, customPrice?: number, customQty?: number) => {
    if (customTicker) {
      setSelectedTicker(customTicker);
    }
    setTradingSide(side);
    setIsTradingOpen(true);
  };

  const handleExecuteOrder = (orderData: Omit<Order, 'id' | 'timestamp' | 'status'>) => {
    const newOrderId = `ord-${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id: newOrderId,
      status: 'filled',
      timestamp: 'Just now',
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update Balance
    if (orderData.side === 'buy') {
      setPortfolioBalance((prev) => prev - orderData.total);
    } else {
      setPortfolioBalance((prev) => prev + orderData.total);
    }

    // Add or adjust Position
    const existingPos = positions.find((p) => p.symbol === orderData.symbol && p.side === orderData.side);
    if (existingPos) {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === existingPos.id
            ? {
                ...p,
                quantity: p.quantity + orderData.quantity,
                entryPrice: (p.entryPrice * p.quantity + orderData.price * orderData.quantity) / (p.quantity + orderData.quantity),
              }
            : p
        )
      );
    } else {
      setPositions((prev) => [
        {
          id: `pos-${Date.now()}`,
          symbol: orderData.symbol,
          side: orderData.side,
          entryPrice: orderData.price,
          currentPrice: orderData.price,
          quantity: orderData.quantity,
          pnl: 0,
          pnlPercent: 0,
        },
        ...prev,
      ]);
    }

    addToast(
      `Order Executed: ${orderData.side.toUpperCase()} ${orderData.quantity} ${orderData.symbol} @ $${orderData.price.toFixed(2)}`,
      'success'
    );
  };

  const handleClosePosition = (positionId: string) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;

    // Return capital + realized PnL
    const returnedValue = pos.quantity * pos.currentPrice;
    setPortfolioBalance((prev) => prev + returnedValue);

    setPositions((prev) => prev.filter((p) => p.id !== positionId));
    addToast(
      `Position Closed: ${pos.symbol} (Realized P&L: ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)})`,
      pos.pnl >= 0 ? 'success' : 'alert'
    );
  };

  const handleAddAlert = (symbol: string, condition: 'above' | 'below', targetPrice: number) => {
    const newAlert: PriceAlert = {
      id: `alt-${Date.now()}`,
      symbol,
      condition,
      targetPrice,
      createdPrice: selectedTicker.price,
      active: true,
      createdAt: 'Just now',
    };
    setAlerts((prev) => [newAlert, ...prev]);
    addToast(`Alert set for ${symbol} when price crosses ${condition} $${targetPrice.toFixed(2)}`, 'info');
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    addToast('Price alert removed', 'info');
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark bg-[#131722] text-[#d1d4dc]' : 'bg-[#f0f3fa] text-[#131722]'}`}>
      
      {/* 1. Header Navigation */}
      <Header
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        onOpenSearch={() => setIsSearchOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        portfolioBalance={portfolioBalance}
        openPositionsCount={positions.length}
        unreadAlertsCount={alerts.length}
        onToggleRightDock={() => setIsRightDockOpen(!isRightDockOpen)}
        isRightDockOpen={isRightDockOpen}
      />

      {/* 2. Top Market Ticker Tape Ribbon */}
      <TickerRibbon
        tickers={tickers}
        selectedSymbol={selectedTicker.symbol}
        onSelectTicker={(t) => {
          handleSelectTicker(t);
          if (currentScreen === 'chart') {
            setSelectedTicker(t);
          }
        }}
        recentTicks={recentTicks}
      />

      {/* 3. Main Content Screen Router */}
      <main className="flex-1 pb-16">
        {currentScreen === 'overview' && (
          <MarketOverview
            tickers={tickers}
            onSelectTicker={handleSelectTicker}
            onOpenChart={handleOpenChart}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {currentScreen === 'chart' && (
          <ProMultiChartStudio
            primaryTicker={selectedTicker}
            allTickers={tickers}
            onOpenTrading={handleOpenTrading}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}

        {currentScreen === 'screener' && (
          <MarketScreener
            tickers={tickers}
            onOpenChart={handleOpenChart}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {currentScreen === 'heatmap' && (
          <MarketHeatmap
            tickers={tickers}
            onOpenChart={handleOpenChart}
          />
        )}

        {currentScreen === 'calendar' && (
          <EconomicCalendar
            tickers={tickers}
            onOpenChart={handleOpenChart}
          />
        )}
      </main>

      {/* 4. Symbol Search Modal */}
      <SymbolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        tickers={tickers}
        onSelectTicker={(t) => {
          handleSelectTicker(t);
          setCurrentScreen('chart');
        }}
        selectedSymbol={selectedTicker.symbol}
      />

      {/* 5. Paper Trading Execution Modal */}
      <TradingPanel
        isOpen={isTradingOpen}
        onClose={() => setIsTradingOpen(false)}
        ticker={selectedTicker}
        initialSide={tradingSide}
        portfolioBalance={portfolioBalance}
        positions={positions}
        orders={orders}
        onExecuteOrder={handleExecuteOrder}
        onClosePosition={handleClosePosition}
      />

      {/* 6. Right Utility Dock (Watchlist, Alerts, Level 2 Depth, Analyst) */}
      <WatchlistAlertsDock
        isOpen={isRightDockOpen}
        onClose={() => setIsRightDockOpen(false)}
        tickers={tickers}
        selectedTicker={selectedTicker}
        onSelectTicker={(t) => {
          handleSelectTicker(t);
          if (currentScreen === 'chart') {
            setSelectedTicker(t);
          }
        }}
        watchlist={watchlist}
        onToggleWatchlist={handleToggleWatchlist}
        alerts={alerts}
        onAddAlert={handleAddAlert}
        onDeleteAlert={handleDeleteAlert}
      />

      {/* 7. Toast Notification Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-xl border text-xs font-medium flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 ${
              toast.type === 'alert'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                : 'bg-[#1e222d] border-[#2962ff] text-white'
            }`}
          >
            {toast.type === 'alert' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { MarketTicker, TimeAndSalesPrint } from '../../types/market';
import { generateInitialTimeAndSales } from '../../utils/chartGenerators';
import { Layers, Activity, ChevronRight, Zap } from 'lucide-react';

interface TimeAndSalesDOMProps {
  ticker: MarketTicker;
  onQuickOrder: (side: 'buy' | 'sell', price: number, qty: number) => void;
}

export const TimeAndSalesDOM: React.FC<TimeAndSalesDOMProps> = ({
  ticker,
  onQuickOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'dom' | 'tape'>('dom');
  const [tape, setTape] = useState<TimeAndSalesPrint[]>(() =>
    generateInitialTimeAndSales(ticker.price)
  );
  const [orderQty, setOrderQty] = useState<number>(10);

  // Stream new prints in real time
  useEffect(() => {
    const interval = setInterval(() => {
      const isBuy = Math.random() > 0.48;
      const delta = (Math.random() * 0.0008) * (isBuy ? 1 : -1);
      const printPrice = ticker.price * (1 + delta);
      const now = new Date();
      const newPrint: TimeAndSalesPrint = {
        id: `print-${Date.now()}-${Math.random()}`,
        time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: Number(printPrice.toFixed(ticker.price < 2 ? 4 : 2)),
        size: Math.round(10 + Math.random() * 400),
        side: isBuy ? 'buy' : 'sell',
      };

      setTape((prev) => [newPrint, ...prev.slice(0, 24)]);
    }, 1600);

    return () => clearInterval(interval);
  }, [ticker.price, ticker.symbol]);

  // Generate 8 rungs of DOM above and below market
  const rungs = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((step) => {
    const tickStep = ticker.price > 1000 ? 5 : ticker.price > 100 ? 0.25 : 0.01;
    const rungPrice = Number((ticker.price + step * tickStep).toFixed(ticker.price < 2 ? 4 : 2));
    const isCurrent = step === 0;
    const isAsk = step > 0;
    const isBid = step < 0;

    const baseDepth = Math.round(120 + Math.abs(step) * 90 + Math.random() * 60);
    return {
      price: rungPrice,
      isCurrent,
      isAsk,
      isBid,
      size: baseDepth,
      barWidth: Math.min(100, (baseDepth / 450) * 100),
    };
  }).reverse();

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl overflow-hidden flex flex-col h-full font-mono text-xs select-none">
      
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#131722] border-b border-[#2a2e39]">
        <div className="flex items-center gap-1 font-sans">
          <button
            onClick={() => setActiveTab('dom')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
              activeTab === 'dom'
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-white'
            }`}
          >
            DOM Ladder
          </button>
          <button
            onClick={() => setActiveTab('tape')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 ${
              activeTab === 'tape'
                ? 'bg-[#2962ff] text-white'
                : 'text-[#787b86] hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Time & Sales</span>
          </button>
        </div>

        {/* Quick Lot selector */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-[#787b86] font-sans">Qty:</span>
          {[5, 10, 50].map((q) => (
            <button
              key={q}
              onClick={() => setOrderQty(q)}
              className={`px-1.5 py-0.5 rounded font-mono ${
                orderQty === q
                  ? 'bg-[#2a2e39] text-white font-bold'
                  : 'text-[#787b86] hover:text-white'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: DOM LADDER */}
      {activeTab === 'dom' && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="grid grid-cols-3 text-[10px] text-[#787b86] font-sans pb-1 border-b border-[#2a2e39] px-1 font-semibold">
            <span>Bid Size</span>
            <span className="text-center">Price (USD)</span>
            <span className="text-right">Ask Size</span>
          </div>

          {rungs.map((r, i) => (
            <div
              key={r.price}
              className={`grid grid-cols-3 items-center px-1.5 py-1 rounded text-xs transition-colors relative overflow-hidden group ${
                r.isCurrent
                  ? 'bg-[#2962ff]/20 border border-[#2962ff]/50 font-bold'
                  : 'hover:bg-[#2a2e39]/50'
              }`}
            >
              {/* Bid Column (Click to Buy at this price) */}
              <div className="relative flex items-center">
                {r.isBid && (
                  <>
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-[#089981]/15 rounded-l"
                      style={{ width: `${r.barWidth}%` }}
                    ></div>
                    <button
                      onClick={() => onQuickOrder('buy', r.price, orderQty)}
                      title={`Place Limit BUY ${orderQty} @ $${r.price}`}
                      className="relative z-10 text-[#089981] font-semibold hover:underline"
                    >
                      {r.size}
                    </button>
                  </>
                )}
              </div>

              {/* Price Center Column */}
              <div
                className={`text-center font-bold relative z-10 ${
                  r.isCurrent
                    ? 'text-white'
                    : r.isAsk
                    ? 'text-[#f23645]'
                    : 'text-[#089981]'
                }`}
              >
                ${r.price.toFixed(ticker.price < 2 ? 4 : 2)}
              </div>

              {/* Ask Column (Click to Sell at this price) */}
              <div className="relative flex items-center justify-end">
                {r.isAsk && (
                  <>
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#f23645]/15 rounded-r"
                      style={{ width: `${r.barWidth}%` }}
                    ></div>
                    <button
                      onClick={() => onQuickOrder('sell', r.price, orderQty)}
                      title={`Place Limit SELL ${orderQty} @ $${r.price}`}
                      className="relative z-10 text-[#f23645] font-semibold hover:underline text-right"
                    >
                      {r.size}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          <div className="pt-2 text-[10px] text-[#787b86] font-sans text-center">
            Click bid/ask rungs for 1-click execution ({orderQty} units)
          </div>
        </div>
      )}

      {/* Tab 2: TIME & SALES TAPE */}
      {activeTab === 'tape' && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-3 text-[10px] text-[#787b86] font-sans pb-1.5 border-b border-[#2a2e39] px-1 font-semibold">
            <span>Time</span>
            <span className="text-center">Price</span>
            <span className="text-right">Shares / Size</span>
          </div>

          <div className="divide-y divide-[#2a2e39]/30 mt-1">
            {tape.map((t) => {
              const isBuy = t.side === 'buy';
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-3 items-center py-1 px-1 text-xs hover:bg-[#2a2e39]/30"
                >
                  <span className="text-[#787b86] text-[11px]">{t.time}</span>
                  <span
                    className={`text-center font-bold ${
                      isBuy ? 'text-[#089981]' : 'text-[#f23645]'
                    }`}
                  >
                    ${t.price.toFixed(ticker.price < 2 ? 4 : 2)}
                  </span>
                  <span
                    className={`text-right font-medium text-[11px] ${
                      isBuy ? 'text-[#089981]' : 'text-[#f23645]'
                    }`}
                  >
                    {isBuy ? '+' : '-'}{t.size}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

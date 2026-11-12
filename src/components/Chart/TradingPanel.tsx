import React, { useState } from 'react';
import { MarketTicker, Order, Position } from '../../types/market';
import { X, CheckCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface TradingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: MarketTicker;
  initialSide: 'buy' | 'sell';
  portfolioBalance: number;
  positions: Position[];
  orders: Order[];
  onExecuteOrder: (order: Omit<Order, 'id' | 'timestamp' | 'status'>) => void;
  onClosePosition: (positionId: string) => void;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  isOpen,
  onClose,
  ticker,
  initialSide,
  portfolioBalance,
  positions,
  orders,
  onExecuteOrder,
  onClosePosition,
}) => {
  const [side, setSide] = useState<'buy' | 'sell'>(initialSide);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(ticker.price);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'trade' | 'positions' | 'orders'>('trade');

  if (!isOpen) return null;

  const currentPrice = orderType === 'market' ? ticker.price : limitPrice;
  const orderTotal = quantity * currentPrice;
  const canAfford = side === 'sell' || orderTotal <= portfolioBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAfford || quantity <= 0) return;

    onExecuteOrder({
      symbol: ticker.symbol,
      type: orderType,
      side,
      price: currentPrice,
      quantity,
      total: orderTotal,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
    });

    setActiveTab('positions');
  };

  const tickerPositions = positions.filter((p) => p.symbol === ticker.symbol);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#131722] border-b border-[#2a2e39]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">Paper Trading Studio</span>
            <span className="text-[10px] text-[#2962ff] bg-[#2962ff]/10 px-1.5 py-0.5 rounded font-mono font-semibold">
              ${ticker.symbol}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#787b86] hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher: Trade vs Positions vs History */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#171b26] border-b border-[#2a2e39] text-xs">
          <button
            onClick={() => setActiveTab('trade')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'trade' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
            }`}
          >
            Place Order
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1 rounded font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'positions' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
            }`}
          >
            <span>Open Positions</span>
            {positions.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#1e222d] text-[10px] flex items-center justify-center text-white">
                {positions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeTab === 'orders' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
            }`}
          >
            Orders History
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto">
          {activeTab === 'trade' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Buy / Sell Buttons */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#131722] rounded-lg border border-[#2a2e39]">
                <button
                  type="button"
                  onClick={() => setSide('buy')}
                  className={`py-2 text-xs font-bold rounded-md transition-all ${
                    side === 'buy'
                      ? 'bg-[#089981] text-white shadow-xs'
                      : 'text-[#787b86] hover:text-white'
                  }`}
                >
                  Buy / Long
                </button>
                <button
                  type="button"
                  onClick={() => setSide('sell')}
                  className={`py-2 text-xs font-bold rounded-md transition-all ${
                    side === 'sell'
                      ? 'bg-[#f23645] text-white shadow-xs'
                      : 'text-[#787b86] hover:text-white'
                  }`}
                >
                  Sell / Short
                </button>
              </div>

              {/* Order Type: Market vs Limit */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#787b86]">Order Type:</span>
                <div className="flex items-center gap-1 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
                  <button
                    type="button"
                    onClick={() => setOrderType('market')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      orderType === 'market' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('limit')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      orderType === 'limit' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
                    }`}
                  >
                    Limit
                  </button>
                </div>
              </div>

              {/* Quantity input */}
              <div className="space-y-1">
                <label className="text-xs text-[#787b86] flex justify-between">
                  <span>Units / Shares</span>
                  <span className="text-white font-mono">Current Price: ${ticker.price.toFixed(2)}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-[#2962ff] focus:outline-none"
                  />
                  <div className="flex gap-1">
                    {[10, 50, 100].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuantity(q)}
                        className="px-2 py-1.5 bg-[#131722] border border-[#2a2e39] text-[11px] text-[#787b86] hover:text-white rounded font-mono"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Limit Price Input if limit order */}
              {orderType === 'limit' && (
                <div className="space-y-1">
                  <label className="text-xs text-[#787b86]">Limit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(parseFloat(e.target.value) || ticker.price)}
                    className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-[#2962ff] focus:outline-none"
                  />
                </div>
              )}

              {/* Stop Loss & Take Profit options */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-[#787b86] block mb-1">Stop Loss ($ optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="SL price"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#2962ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#787b86] block mb-1">Take Profit ($ optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="TP price"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full bg-[#131722] border border-[#2a2e39] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#2962ff] focus:outline-none"
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-3 rounded-lg bg-[#131722] border border-[#2a2e39] text-xs font-mono space-y-1.5">
                <div className="flex justify-between text-[#787b86]">
                  <span>Total Cost:</span>
                  <span className="text-white font-bold">
                    ${orderTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[#787b86]">
                  <span>Demo Balance:</span>
                  <span className="text-emerald-400">
                    ${portfolioBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {!canAfford && (
                  <p className="text-[11px] text-rose-400 pt-1 font-sans">
                    Insufficient virtual funds for this order size.
                  </p>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={!canAfford}
                className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-md ${
                  side === 'buy'
                    ? 'bg-[#089981] hover:bg-[#067a67] disabled:opacity-50'
                    : 'bg-[#f23645] hover:bg-[#d92231] disabled:opacity-50'
                }`}
              >
                Execute {side.toUpperCase()} Order ({quantity} {ticker.symbol})
              </button>
            </form>
          )}

          {/* Positions View */}
          {activeTab === 'positions' && (
            <div className="space-y-3">
              {positions.length === 0 ? (
                <div className="py-8 text-center text-[#787b86] text-xs">
                  No open positions currently active. Execute an order to simulate trading.
                </div>
              ) : (
                positions.map((pos) => {
                  const isProfit = pos.pnl >= 0;
                  return (
                    <div
                      key={pos.id}
                      className="p-3 rounded-lg bg-[#131722] border border-[#2a2e39] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>{pos.symbol}</span>
                          <span
                            className={`text-[10px] px-1 rounded uppercase font-semibold ${
                              pos.side === 'buy' ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
                            }`}
                          >
                            {pos.side}
                          </span>
                          <span className="text-xs text-[#787b86] font-mono">({pos.quantity} units)</span>
                        </div>
                        <div className="text-[11px] text-[#787b86] font-mono mt-1">
                          Entry: ${pos.entryPrice.toFixed(2)} → Current: ${pos.currentPrice.toFixed(2)}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div
                          className={`font-bold ${
                            isProfit ? 'text-[#089981]' : 'text-[#f23645]'
                          }`}
                        >
                          {isProfit ? '+' : ''}${pos.pnl.toFixed(2)} ({isProfit ? '+' : ''}
                          {pos.pnlPercent.toFixed(2)}%)
                        </div>
                        <button
                          onClick={() => onClosePosition(pos.id)}
                          className="mt-1 text-[10px] text-rose-400 hover:text-white px-2 py-0.5 rounded bg-[#2a2e39] hover:bg-rose-600 transition-colors"
                        >
                          Close Position
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Orders History */}
          {activeTab === 'orders' && (
            <div className="space-y-2">
              {orders.length === 0 ? (
                <div className="py-8 text-center text-[#787b86] text-xs">
                  No executed orders yet.
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-2.5 rounded bg-[#131722] border border-[#2a2e39] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-white mr-2">{ord.symbol}</span>
                      <span className={`text-[10px] uppercase font-bold ${ord.side === 'buy' ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {ord.side}
                      </span>
                      <span className="text-[#787b86] text-[11px] ml-2">{ord.quantity} @ ${ord.price.toFixed(2)}</span>
                    </div>
                    <div className="text-[#787b86] text-[10px]">{ord.timestamp}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

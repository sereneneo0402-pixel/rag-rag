export type AssetClass = 'indices' | 'stocks' | 'crypto' | 'forex' | 'commodities' | 'bonds';

export type TechnicalRating = 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';

export interface MarketTicker {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: string;
  marketCap?: string;
  peRatio?: number;
  sparkline: number[];
  rating: TechnicalRating;
  sector?: string;
  currency?: string;
  country?: string;
  icon?: string;
  beta?: number;
  rsi?: number;
  avgVolume?: string;
}

export interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorSettings {
  showEma20: boolean;
  showEma50: boolean;
  showSma200: boolean;
  showBollinger: boolean;
  showVolume: boolean;
  showRsi: boolean;
  showMacd: boolean;
  showVolumeProfile: boolean;
  showStochastic: boolean;
}

export type ChartType = 'candlestick' | 'line' | 'area' | 'heikinAshi' | 'bars';
export type TimeFrame = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
export type MultiChartLayout = '1x1' | '2x1' | '1x2' | '2x2';
export type DrawingTool = 'crosshair' | 'trend' | 'horizontal' | 'fibonacci' | 'measure';

export interface VolumeProfileBucket {
  price: number;
  volume: number;
  isPOC: boolean; // Point of Control
  isValueArea: boolean; // 70% Value Area
}

export interface TimeAndSalesPrint {
  id: string;
  time: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

export interface Order {
  id: string;
  symbol: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  total: number;
  status: 'filled' | 'open' | 'cancelled';
  timestamp: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  createdPrice: number;
  active: boolean;
  createdAt: string;
}

export interface EconomicEvent {
  id: string;
  time: string;
  date: string;
  country: string;
  currency: string;
  flag: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  time: string;
  url: string;
  category: string;
  relatedTickers: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  imageUrl?: string;
}

export interface HeatmapItem {
  symbol: string;
  name: string;
  marketCap: number;
  marketCapFormatted: string;
  changePercent: number;
  price: number;
  sector: string;
}

import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';

export const mapPairToTradingViewSymbol = (pair: string): string => {
  if (!pair) return 'FX:EURUSD';
  const cleaned = pair.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleaned.includes('XAU') || cleaned.includes('GOLD')) {
    return 'OANDA:XAUUSD';
  }
  if (cleaned.includes('BTC')) {
    return 'BINANCE:BTCUSDT';
  }
  if (cleaned.includes('ETH')) {
    return 'BINANCE:ETHUSDT';
  }
  if (cleaned.includes('US30') || cleaned.includes('DJ30') || cleaned.includes('DOW')) {
    return 'CAPITALCOM:US30';
  }
  if (
    cleaned.includes('NAS100') ||
    cleaned.includes('US100') ||
    cleaned.includes('NDX') ||
    cleaned.includes('NQ')
  ) {
    return 'CAPITALCOM:US100';
  }
  if (cleaned.includes('SPX') || cleaned.includes('US500') || cleaned.includes('ES')) {
    return 'CAPITALCOM:US500';
  }
  if (
    [
      'EURUSD',
      'GBPUSD',
      'USDJPY',
      'AUDUSD',
      'USDCAD',
      'USDCHF',
      'NZDUSD',
      'EURJPY',
      'GBPJPY',
      'EURGBP',
    ].includes(cleaned)
  ) {
    return `FX:${cleaned}`;
  }
  if (cleaned.length === 6) {
    return `FX:${cleaned}`;
  }
  return cleaned || 'FX:EURUSD';
};

export const mapTimeframeToTradingViewInterval = (tf: string): string => {
  if (!tf) return '5';
  const upper = tf.trim().toUpperCase();
  switch (upper) {
    case 'M1':
    case '1M':
    case '1':
      return '1';
    case 'M5':
    case '5M':
    case '5':
      return '5';
    case 'M15':
    case '15M':
    case '15':
      return '15';
    case 'M30':
    case '30M':
    case '30':
      return '30';
    case 'H1':
    case '1H':
    case '60':
      return '60';
    case 'H4':
    case '4H':
    case '240':
      return '240';
    case 'D':
    case '1D':
    case 'DAILY':
      return 'D';
    case 'W':
    case '1W':
      return 'W';
    default:
      return '5';
  }
};

interface TradingViewWidgetProps {
  pair?: string;
  symbol?: string;
  timeframe?: string;
  interval?: string;
  theme?: 'dark' | 'light';
  height?: number | string;
  allowSymbolChange?: boolean;
  enableStudies?: boolean;
  className?: string;
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  pair,
  symbol,
  timeframe,
  interval,
  theme = 'dark',
  height = '100%',
  allowSymbolChange = true,
  enableStudies = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolvedSymbol = symbol || mapPairToTradingViewSymbol(pair || 'EURUSD');
  const resolvedInterval = interval || mapTimeframeToTradingViewInterval(timeframe || 'M5');

  useEffect(() => {
    setIsLoading(true);
    const container = containerRef.current;
    if (!container) return;

    // Reset container HTML
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = 'calc(100% - 28px)';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const copyrightDiv = document.createElement('div');
    copyrightDiv.className = 'tradingview-widget-copyright text-[10px] text-gray-500 font-mono px-2 py-1 flex items-center justify-between border-t border-[#1E2538] bg-[#070B18]';
    copyrightDiv.innerHTML = `
      <span class="text-gray-400">Live TradingView Feed &bull; ${resolvedSymbol}</span>
      <a href="https://www.tradingview.com/symbols/${resolvedSymbol.replace(':', '-')}/" rel="noopener nofollow" target="_blank" class="text-blue-400 hover:underline flex items-center gap-1">
        <span>TradingView</span>
      </a>
    `;
    container.appendChild(copyrightDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    const widgetConfig: Record<string, any> = {
      autosize: true,
      symbol: resolvedSymbol,
      interval: resolvedInterval,
      timezone: 'Asia/Dhaka',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: allowSymbolChange,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_side_toolbar: false,
      withdateranges: true,
      hide_volume: false,
      studies: enableStudies
        ? [
            'STD;EMA',
          ]
        : [],
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    container.appendChild(script);

    return () => {
      clearTimeout(loadTimer);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [resolvedSymbol, resolvedInterval, theme, allowSymbolChange, enableStudies]);

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-[#1E2538] bg-[#070B18] shadow-inner ${className}`}
      style={{ height, minHeight: typeof height === 'number' ? `${height}px` : height }}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#070B18]/90 backdrop-blur-xs text-gray-400 font-mono space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
          <span className="text-xs font-bold text-gray-300">Loading TradingView Real-Time Chart...</span>
          <span className="text-[10px] text-gray-500">{resolvedSymbol} &bull; {resolvedInterval}m</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full h-full"
      />
    </div>
  );
};

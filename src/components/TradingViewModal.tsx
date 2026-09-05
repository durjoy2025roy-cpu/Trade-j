import React, { useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  LineChart,
  Send,
  Sparkles,
  ExternalLink,
  Clock,
  Layers,
} from 'lucide-react';
import { TradingViewWidget, mapPairToTradingViewSymbol } from './TradingViewWidget';
import { soundEngine } from '../utils/soundEngine';

interface TradingViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPair?: string;
  defaultTimeframe?: string;
  onApplyToGate?: (draft: {
    pair?: string;
    direction?: 'LONG' | 'SHORT';
    entryPrice?: string;
    stopLossPrice?: string;
    takeProfitPrice?: string;
    notes?: string;
  }) => void;
}

const QUICK_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD', 'US30', 'NAS100'];
const QUICK_TIMEFRAMES = [
  { label: '1m', value: 'M1' },
  { label: '5m', value: 'M5' },
  { label: '15m', value: 'M15' },
  { label: '1h', value: 'H1' },
  { label: '4h', value: 'H4' },
  { label: '1D', value: '1D' },
];

export const TradingViewModal: React.FC<TradingViewModalProps> = ({
  isOpen,
  onClose,
  defaultPair = 'EURUSD',
  defaultTimeframe = 'M5',
  onApplyToGate,
}) => {
  const [selectedPair, setSelectedPair] = useState<string>(defaultPair);
  const [selectedTf, setSelectedTf] = useState<string>(defaultTimeframe);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSetupDraft, setShowSetupDraft] = useState<boolean>(false);

  // Setup draft quick values
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLossPrice, setStopLossPrice] = useState<string>('');
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');

  if (!isOpen) return null;

  const handlePairChange = (p: string) => {
    setSelectedPair(p);
    soundEngine.play('button_click');
  };

  const handleTfChange = (tf: string) => {
    setSelectedTf(tf);
    soundEngine.play('button_click');
  };

  const handleSendToGate = () => {
    if (onApplyToGate) {
      onApplyToGate({
        pair: selectedPair,
        direction,
        entryPrice: entryPrice || undefined,
        stopLossPrice: stopLossPrice || undefined,
        takeProfitPrice: takeProfitPrice || undefined,
        notes: `TradingView chart review on ${selectedPair} (${selectedTf})`,
      });
      soundEngine.play('data_saved');
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-1 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`flex flex-col bg-[#070B18] border border-[#1E2538] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none border-0'
            : 'w-full max-w-6xl h-[92vh] max-h-[900px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#1E2538] bg-[#0D1426] px-3 sm:px-4 py-2.5 gap-2">
          {/* Left: Title & Live indicator */}
          <div className="flex items-center space-x-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <LineChart className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wide">
                  TRADINGVIEW LIVE WINDOW
                </span>
                <span className="flex items-center space-x-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-mono font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>STREAMING</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono hidden sm:block">
                Institutional Real-Time Candlestick Feed &bull; {mapPairToTradingViewSymbol(selectedPair)}
              </p>
            </div>
          </div>

          {/* Center: Pair and Timeframe Quick Selectors */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Quick Pairs */}
            <div className="flex items-center space-x-1 bg-[#070B18] p-1 rounded-lg border border-[#1E2538] overflow-x-auto max-w-[280px] sm:max-w-none scrollbar-none">
              {QUICK_PAIRS.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePairChange(p)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold transition-all ${
                    selectedPair === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Quick Timeframes */}
            <div className="flex items-center space-x-1 bg-[#070B18] p-1 rounded-lg border border-[#1E2538]">
              {QUICK_TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => handleTfChange(tf.value)}
                  className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold transition-all ${
                    selectedTf === tf.value
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Actions (Draft toggle, Fullscreen, Close) */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowSetupDraft(!showSetupDraft)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-colors border ${
                showSetupDraft
                  ? 'border-indigo-500 bg-indigo-600/30 text-indigo-300'
                  : 'border-[#2A344E] bg-[#1A1F2C] text-gray-300 hover:text-white'
              }`}
              title="Toggle Quick Trade Parameter Draft"
            >
              <Send className="h-3 w-3 text-indigo-400" />
              <span className="hidden md:inline">Draft Setup</span>
            </button>

            <button
              onClick={() => {
                soundEngine.play('button_click');
                setIsFullscreen(!isFullscreen);
              }}
              className="p-1.5 rounded-lg border border-[#2A344E] bg-[#1A1F2C] text-gray-400 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              onClick={() => {
                soundEngine.play('button_click');
                onClose();
              }}
              className="p-1.5 rounded-lg border border-[#2A344E] bg-[#1A1F2C] text-gray-400 hover:text-rose-400 hover:border-rose-500/50 transition-colors"
              title="Close TradingView Window"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Setup Drafting Drawer (collapsible at top) */}
        {showSetupDraft && (
          <div className="border-b border-[#1E2538] bg-[#090E1D] p-3 animate-in slide-in-from-top duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Bias:</span>
                <div className="flex rounded-lg overflow-hidden border border-[#1E2538]">
                  <button
                    onClick={() => setDirection('LONG')}
                    className={`px-3 py-1 font-bold ${
                      direction === 'LONG'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#070B18] text-gray-400'
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    onClick={() => setDirection('SHORT')}
                    className={`px-3 py-1 font-bold ${
                      direction === 'SHORT' ? 'bg-rose-600 text-white' : 'bg-[#070B18] text-gray-400'
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-400 text-[10px]">ENTRY:</span>
                  <input
                    type="text"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="e.g. 1.0850"
                    className="w-24 rounded border border-[#1E2538] bg-[#070B18] px-2 py-0.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-gray-400 text-[10px]">SL:</span>
                  <input
                    type="text"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    placeholder="e.g. 1.0830"
                    className="w-24 rounded border border-[#1E2538] bg-[#070B18] px-2 py-0.5 text-rose-300 focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-gray-400 text-[10px]">TP:</span>
                  <input
                    type="text"
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(e.target.value)}
                    placeholder="e.g. 1.0900"
                    className="w-24 rounded border border-[#1E2538] bg-[#070B18] px-2 py-0.5 text-emerald-300 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <button
                  onClick={handleSendToGate}
                  className="flex items-center space-x-1.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 font-bold text-white hover:from-blue-500 hover:to-indigo-500 shadow-sm"
                >
                  <Send className="h-3 w-3" />
                  <span>Send To Gate</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Main Chart Stage */}
        <div className="flex-1 w-full relative bg-[#070B18] overflow-hidden">
          <TradingViewWidget
            pair={selectedPair}
            timeframe={selectedTf}
            theme="dark"
            height="100%"
            allowSymbolChange={true}
            enableStudies={true}
            className="rounded-none border-0"
          />
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="flex items-center justify-between border-t border-[#1E2538] bg-[#0A0F1D] px-3 py-1.5 text-[10px] font-mono text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400 font-bold">TRADE GATE INTEGRATED WINDOW</span>
            <span>&bull;</span>
            <span>ICT Silver Bullet &amp; EMA Swing Synchronized</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-gray-400">Bangladesh Timezone: Asia/Dhaka</span>
            <button
              onClick={() => {
                if (onApplyToGate) {
                  onApplyToGate({ pair: selectedPair, direction });
                }
                onClose();
              }}
              className="text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>Apply {selectedPair} To Gate</span>
              <Send className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

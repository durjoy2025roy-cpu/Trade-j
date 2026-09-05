import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Compass,
  AlertTriangle,
  CheckSquare,
  Square,
  FileText,
  HeartPulse,
} from 'lucide-react';
import {
  TradeParameters,
  ManualConfirmations,
  MarketDirection,
  MarketBias,
  TimeFrame,
  EmotionalState,
} from '../types';
import { soundEngine } from '../utils/soundEngine';

interface ConfirmationSectionProps {
  parameters: TradeParameters;
  confirmations: ManualConfirmations;
  onUpdateParameters: (params: Partial<TradeParameters>) => void;
  onToggleConfirmation: (key: keyof ManualConfirmations) => void;
  calculatedRR: number;
  isRRSatisfied: boolean;
  requiredRR: number;
}

const COMMON_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD', 'ETH/USD'];

export const ConfirmationSection: React.FC<ConfirmationSectionProps> = ({
  parameters,
  confirmations,
  onUpdateParameters,
  onToggleConfirmation,
  calculatedRR,
  isRRSatisfied,
  requiredRR,
}) => {
  const isEmotionalWarning = ['FOMO', 'REVENGE', 'TIRED'].includes(parameters.emotionalState);

  const handleDirectionChange = (dir: MarketDirection) => {
    soundEngine.play('button_click');
    onUpdateParameters({ direction: dir });
  };

  const handleBiasChange = (bias: MarketBias) => {
    soundEngine.play('button_click');
    onUpdateParameters({ bias });
  };

  const handleTimeframeChange = (tf: TimeFrame) => {
    soundEngine.play('button_click');
    onUpdateParameters({ timeframe: tf });
  };

  const handleEmotionalStateSelect = (state: EmotionalState) => {
    onUpdateParameters({ emotionalState: state });
    if (['FOMO', 'REVENGE', 'TIRED'].includes(state)) {
      soundEngine.play('warning');
    } else {
      soundEngine.play('button_click');
    }
  };

  return (
    <div className="rounded-lg border border-[#2A2D35] bg-[#1A1D23] p-4 sm:p-5 shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-[#2A2D35] pb-3">
        <div className="flex items-center space-x-2">
          <Compass className="h-4 w-4 text-blue-400" />
          <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            MY CONFIRMATION &amp; SETUP
          </h3>
        </div>
        <span className="font-mono text-[9px] text-gray-500 uppercase font-bold">MANUAL PROTOCOL</span>
      </div>

      {/* Row 1: Pair & Timeframe */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Pair */}
        <div>
          <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            INSTRUMENT / PAIR
          </label>
          <div className="flex space-x-1.5">
            <input
              id="pair-input"
              type="text"
              value={parameters.pair}
              onChange={(e) => onUpdateParameters({ pair: e.target.value.toUpperCase() })}
              placeholder="e.g. EURUSD"
              className="w-full rounded border border-[#2A2D35] bg-[#0F1115] px-3 py-1.5 font-mono text-xs font-bold text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {/* Quick Select Buttons */}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {COMMON_PAIRS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  soundEngine.play('button_click');
                  onUpdateParameters({ pair: p.replace('/', '') });
                }}
                className={`rounded px-1.5 py-0.5 text-[9px] font-mono transition-colors ${
                  parameters.pair === p.replace('/', '')
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                    : 'bg-[#252A35] border border-[#2A2D35] text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe */}
        <div>
          <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            TIMEFRAME
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['M1', 'M5', 'H1', 'H4'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                id={`tf-btn-${tf}`}
                onClick={() => handleTimeframeChange(tf)}
                className={`rounded py-1.5 text-center font-mono text-xs font-bold transition-all ${
                  parameters.timeframe === tf
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-[#2A2D35] bg-[#0F1115] text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Direction & Market Bias */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Direction */}
        <div>
          <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            DIRECTION
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="direction-long-btn"
              onClick={() => handleDirectionChange('LONG')}
              className={`flex items-center justify-center space-x-2 rounded py-2 text-xs font-bold tracking-wider transition-all ${
                parameters.direction === 'LONG'
                  ? 'border border-[#00C853]/50 bg-[#00C853]/15 text-[#00C853] shadow-[0_0_12px_rgba(0,200,83,0.2)]'
                  : 'border border-[#2A2D35] bg-[#0F1115] text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>LONG</span>
            </button>

            <button
              id="direction-short-btn"
              onClick={() => handleDirectionChange('SHORT')}
              className={`flex items-center justify-center space-x-2 rounded py-2 text-xs font-bold tracking-wider transition-all ${
                parameters.direction === 'SHORT'
                  ? 'border border-rose-500/50 bg-rose-500/15 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                  : 'border border-[#2A2D35] bg-[#0F1115] text-gray-400 hover:text-white'
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              <span>SHORT</span>
            </button>
          </div>
        </div>

        {/* Market Bias */}
        <div>
          <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            MARKET BIAS
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['BULLISH', 'BEARISH', 'NEUTRAL'] as MarketBias[]).map((bias) => (
              <button
                key={bias}
                id={`bias-btn-${bias.toLowerCase()}`}
                onClick={() => handleBiasChange(bias)}
                className={`rounded py-2 text-center text-[10px] font-bold tracking-wider transition-all ${
                  parameters.bias === bias
                    ? bias === 'BULLISH'
                      ? 'border border-[#00C853]/40 bg-[#00C853]/15 text-[#00C853]'
                      : bias === 'BEARISH'
                      ? 'border border-rose-500/40 bg-rose-500/15 text-rose-400'
                      : 'border border-orange-500/40 bg-orange-500/15 text-orange-400'
                    : 'border border-[#2A2D35] bg-[#0F1115] text-gray-400 hover:text-white'
                }`}
              >
                {bias}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Price Levels (Entry, SL, TP) */}
      <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-3 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            EXECUTION PRICE LEVELS
          </span>
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span className="text-gray-500">R:R:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded ${
                isRRSatisfied
                  ? 'border border-[#00C853]/40 bg-[#00C853]/10 text-[#00C853]'
                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-400'
              }`}
            >
              1:{calculatedRR.toFixed(2)}
            </span>
            <span className="text-[10px] text-gray-500">(Min 1:{requiredRR})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Entry Price */}
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400">ENTRY PRICE</label>
            <input
              id="entry-price-input"
              type="number"
              step="any"
              value={parameters.entryPrice}
              onChange={(e) => onUpdateParameters({ entryPrice: e.target.value })}
              placeholder="e.g. 1.08500"
              className="mt-1 w-full rounded border border-[#2A2D35] bg-[#1A1D23] px-2.5 py-1.5 font-mono text-xs text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Stop Loss */}
          <div>
            <label className="text-[10px] font-bold uppercase text-rose-400">STOP LOSS (SL)</label>
            <input
              id="stop-loss-input"
              type="number"
              step="any"
              value={parameters.stopLossPrice}
              onChange={(e) => onUpdateParameters({ stopLossPrice: e.target.value })}
              placeholder="e.g. 1.08300"
              className="mt-1 w-full rounded border border-rose-500/30 bg-[#1A1D23] px-2.5 py-1.5 font-mono text-xs text-rose-300 placeholder:text-gray-600 focus:border-rose-400 focus:outline-none"
            />
          </div>

          {/* Take Profit */}
          <div>
            <label className="text-[10px] font-bold uppercase text-[#00C853]">TAKE PROFIT (TP)</label>
            <input
              id="take-profit-input"
              type="number"
              step="any"
              value={parameters.takeProfitPrice}
              onChange={(e) => onUpdateParameters({ takeProfitPrice: e.target.value })}
              placeholder="e.g. 1.09000"
              className="mt-1 w-full rounded border border-[#00C853]/30 bg-[#1A1D23] px-2.5 py-1.5 font-mono text-xs text-[#00C853] placeholder:text-gray-600 focus:border-[#00C853] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Row 4: Emotional State Selector */}
      <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <HeartPulse className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              EMOTIONAL STATE CHECK
            </span>
          </div>
          <span className="text-[9px] text-gray-500 uppercase font-mono font-bold">MINDSET AUDIT</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {(['CALM', 'FOCUSED', 'UNCERTAIN', 'FOMO', 'REVENGE', 'TIRED'] as EmotionalState[]).map(
            (st) => {
              const isSelected = parameters.emotionalState === st;
              const isCaution = ['FOMO', 'REVENGE', 'TIRED'].includes(st);
              return (
                <button
                  key={st}
                  id={`emotion-btn-${st.toLowerCase()}`}
                  onClick={() => handleEmotionalStateSelect(st)}
                  className={`rounded py-1.5 text-center text-[10px] font-bold tracking-wider transition-all ${
                    isSelected
                      ? isCaution
                        ? 'border border-orange-500/50 bg-orange-500/20 text-orange-400'
                        : 'bg-blue-600 text-white shadow-sm'
                      : 'border border-[#2A2D35] bg-[#1A1D23] text-gray-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              );
            }
          )}
        </div>

        {isEmotionalWarning && (
          <div className="flex items-start space-x-2 rounded border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-orange-400 mt-0.5" />
            <div>
              <span className="font-bold text-orange-400 uppercase">⚠ REVIEW YOUR STATE:</span>{' '}
              <span>
                You marked your state as &quot;{parameters.emotionalState}&quot;. Consider pausing
                and thoroughly reviewing the setup before continuing to broker.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Row 5: 6 Mandatory Confirmations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            PERSONAL MANDATORY VERIFICATIONS
          </span>
          <span className="text-[10px] text-gray-500 font-mono">6 / 6 REQUIRED</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {[
            {
              key: 'reviewedMarketStructure' as const,
              label: 'I personally reviewed the market structure.',
            },
            {
              key: 'reviewedLiquidity' as const,
              label: 'I personally reviewed liquidity.',
            },
            {
              key: 'confirmedEntryArea' as const,
              label: 'I personally confirmed my entry area.',
            },
            {
              key: 'definedStopLoss' as const,
              label: 'I personally defined my Stop Loss.',
            },
            {
              key: 'definedTakeProfit' as const,
              label: 'I personally defined my Take Profit.',
            },
            {
              key: 'acceptedOwnDecision' as const,
              label: 'I understand that this is my own trading decision.',
            },
          ].map((item) => {
            const isChecked = confirmations[item.key];
            return (
              <label
                key={item.key}
                id={`confirm-${item.key}`}
                onClick={() => {
                  if (!isChecked) {
                    soundEngine.play('checkbox_check');
                  } else {
                    soundEngine.play('checkbox_uncheck');
                  }
                  onToggleConfirmation(item.key);
                }}
                className={`flex cursor-pointer items-center space-x-3 rounded border p-2 text-xs select-none transition-all ${
                  isChecked
                    ? 'border-[#3D85FF]/40 bg-[#3D85FF]/10 text-white font-medium'
                    : 'border-[#2A2D35] bg-[#0F1115] text-gray-400 hover:border-gray-600 hover:text-white'
                }`}
              >
                <div className="shrink-0">
                  {isChecked ? (
                    <CheckSquare className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Row 6: Trade Note (0 / 500 characters) */}
      <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              WHY AM I TAKING THIS SETUP?
            </span>
          </div>
          <span className="font-mono text-[10px] text-gray-500">
            {parameters.tradeNote.length} / 500
          </span>
        </div>
        <textarea
          id="trade-note-textarea"
          rows={3}
          maxLength={500}
          value={parameters.tradeNote}
          onChange={(e) => onUpdateParameters({ tradeNote: e.target.value })}
          placeholder="Briefly explain the setup, confirmation, invalidation and reason for taking it."
          className="w-full rounded border border-[#2A2D35] bg-[#1A1D23] p-2.5 text-xs text-gray-200 placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
};

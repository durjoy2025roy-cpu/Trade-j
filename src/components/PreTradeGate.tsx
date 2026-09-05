import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  LineChart,
} from 'lucide-react';
import { GateEvaluation, TradeParameters, CalculatedRisk, StrategyType } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface PreTradeGateProps {
  evaluation: GateEvaluation;
  parameters: TradeParameters;
  calculatedRisk: CalculatedRisk;
  strategy: StrategyType;
  expirationCountdownSec: number;
  onConfirmFinalApproval: () => void;
  onResetApproval: () => void;
  brokerUrl: string;
  onOpenTradingViewModal?: () => void;
}

export const PreTradeGate: React.FC<PreTradeGateProps> = ({
  evaluation,
  parameters,
  calculatedRisk,
  strategy,
  expirationCountdownSec,
  onConfirmFinalApproval,
  onResetApproval,
  brokerUrl,
  onOpenTradingViewModal,
}) => {
  const [showFinalReviewModal, setShowFinalReviewModal] = useState(false);
  const [modalConfirmed, setModalConfirmed] = useState(false);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenFinalReview = () => {
    soundEngine.play('button_click');
    setShowFinalReviewModal(true);
  };

  const handleExecuteApproval = () => {
    soundEngine.play('gate_approved');
    setShowFinalReviewModal(false);
    onConfirmFinalApproval();
  };

  return (
    <div
      id="pre-trade-gate-container"
      className={`relative overflow-hidden rounded-lg border p-5 sm:p-6 transition-all duration-500 shadow-xl ${
        evaluation.status === 'APPROVED'
          ? 'border-[#00C853]/50 bg-[#1A1D23] shadow-[0_0_30px_rgba(0,200,83,0.15)]'
          : evaluation.status === 'READY'
          ? 'border-orange-500/40 bg-[#1A1D23] shadow-[0_0_20px_rgba(255,145,0,0.1)]'
          : evaluation.status === 'EXPIRED'
          ? 'border-rose-500/40 bg-[#1A1D23]'
          : 'border-[#2A2D35] bg-[#1A1D23]'
      }`}
    >
      {/* Subtle background ambient radial gradient */}
      {evaluation.status === 'APPROVED' && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,200,83,0.06)_0%,transparent_70%)]" />
      )}
      {evaluation.status === 'READY' && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,145,0,0.05)_0%,transparent_70%)]" />
      )}

      {/* Header & Gate State Badge */}
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#2A2D35] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              DISCIPLINE GATEKEEPER
            </span>
            <span className="rounded bg-[#0F1115] border border-[#2A2D35] px-2 py-0.5 font-mono text-[9px] text-gray-400">
              SINGLE TRUTH ENGINE
            </span>
          </div>
          <h2 className="mt-1 font-sans text-xl sm:text-2xl font-bold tracking-tight text-white">
            PRE-TRADE GATE
          </h2>
        </div>

        {/* State Visualizer */}
        <div className="flex items-center space-x-3">
          {evaluation.status === 'APPROVED' ? (
            <div className="flex items-center space-x-2.5 rounded bg-[#00C853]/15 border border-[#00C853]/40 px-3.5 py-1.5 text-[#00C853] shadow-[0_0_15px_rgba(0,200,83,0.2)]">
              <Unlock className="h-4 w-4" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider font-mono">
                  GATE APPROVED
                </div>
                <div className="text-[9px] text-[#00C853]/80 uppercase">READY FOR EXECUTION</div>
              </div>
            </div>
          ) : evaluation.status === 'READY' ? (
            <div className="flex items-center space-x-2.5 rounded bg-orange-500/10 border border-orange-500/40 px-3.5 py-1.5 text-orange-400">
              <ShieldCheck className="h-4 w-4" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider font-mono">
                  READY FOR REVIEW
                </div>
                <div className="text-[9px] text-orange-300/80 uppercase">SIGN OFF REQUIRED</div>
              </div>
            </div>
          ) : evaluation.status === 'EXPIRED' ? (
            <div className="flex items-center space-x-2.5 rounded bg-rose-500/10 border border-rose-500/40 px-3.5 py-1.5 text-rose-400">
              <Clock className="h-4 w-4" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider font-mono">
                  APPROVAL EXPIRED
                </div>
                <div className="text-[9px] text-rose-300/80 uppercase">TIMEOUT REACHED</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2.5 rounded border border-[#2A2D35] bg-[#0F1115] px-3.5 py-1.5 text-gray-400">
              <Lock className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider font-mono text-gray-300">
                  LOCKED
                </div>
                <div className="text-[9px] text-gray-500 font-mono">
                  {evaluation.completedConditionsCount} / {evaluation.totalConditionsCount} CONDITIONS
                </div>
              </div>
            </div>
          )}

          {onOpenTradingViewModal && (
            <button
              id="gate-open-chart-btn"
              onClick={() => {
                soundEngine.play('button_click');
                onOpenTradingViewModal();
              }}
              title="Open Live TradingView Chart Window"
              className="flex items-center space-x-1.5 rounded bg-[#0F1422] border border-cyan-500/40 px-3 py-2 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-600/20 hover:border-cyan-400 transition-colors shadow-sm"
            >
              <LineChart className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline">LIVE CHART</span>
              <span className="sm:hidden">CHART</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Gate Content */}
      <div className="relative z-10 mt-5 space-y-4">
        {/* Approved State Banner with Center Hero Badge from Design */}
        {evaluation.status === 'APPROVED' && (
          <div className="rounded-lg border border-[#00C853]/30 bg-[#0F1115] p-6 text-gray-200 space-y-5 flex flex-col items-center text-center">
            {/* Design Circular Badge */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#00C853] flex items-center justify-center bg-[#00C853]/10 shadow-[0_0_30px_rgba(0,200,83,0.25)]">
              <Unlock className="h-8 w-8 sm:h-10 sm:w-10 text-[#00C853]" />
            </div>

            <div>
              <h3 className="text-2xl font-bold tracking-tighter text-white mb-1 uppercase">
                GATE APPROVED
              </h3>
              <p className="text-xs text-[#00C853] font-bold uppercase tracking-widest">
                Ready for Execution
              </p>
              <div className="mt-3 px-4 py-1.5 bg-[#00C853]/20 border border-[#00C853]/40 rounded-full inline-flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00C853] rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                  PREMIUM CHIME SYNCED &bull; VALID FOR {formatCountdown(expirationCountdownSec)}
                </span>
              </div>
            </div>

            {/* Approved Parameters Snapshot */}
            <div className="grid w-full grid-cols-2 gap-2 rounded border border-[#2A2D35] bg-[#1A1D23] p-3 sm:grid-cols-4 font-mono text-xs text-left">
              <div>
                <span className="text-[10px] text-gray-500 uppercase">PAIR &amp; DIR</span>
                <div className="font-bold text-white">
                  {parameters.pair} &bull; {parameters.direction}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">ENTRY</span>
                <div className="font-bold text-white">{parameters.entryPrice}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">STOP LOSS</span>
                <div className="font-bold text-rose-400">{parameters.stopLossPrice}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">R:R RATIO</span>
                <div className="font-bold text-[#00C853]">1:{calculatedRisk.rrRatio.toFixed(2)}</div>
              </div>
            </div>

            {/* Proceed to Broker Button */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
              <a
                id="proceed-to-broker-btn"
                href={brokerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundEngine.play('button_click')}
                className="inline-flex items-center space-x-2 rounded bg-blue-600 hover:bg-blue-500 px-6 py-2.5 font-mono text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>PROCEED TO BROKER</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                onClick={() => {
                  soundEngine.play('gate_locked');
                  onResetApproval();
                }}
                className="flex items-center space-x-1.5 rounded border border-[#2A2D35] bg-[#1A1D23] px-3.5 py-2 text-xs text-gray-400 hover:bg-[#252A35] hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Approval</span>
              </button>
            </div>
          </div>
        )}

        {/* Ready State Action Banner */}
        {evaluation.status === 'READY' && (
          <div className="rounded-lg border border-orange-500/30 bg-[#0F1115] p-5 text-gray-200 space-y-3">
            <div className="flex items-center space-x-2 text-orange-400">
              <CheckCircle2 className="h-5 w-5" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider">
                READY FOR FINAL SIGN-OFF
              </h4>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              All checklist conditions and risk parameters have passed validation. Complete the final
              liability review to obtain execution approval.
            </p>
            <button
              id="open-final-review-btn"
              onClick={handleOpenFinalReview}
              className="inline-flex items-center space-x-2 rounded bg-blue-600 hover:bg-blue-500 px-5 py-2 font-mono text-xs font-bold text-white shadow-md shadow-blue-600/30 transition-transform hover:scale-[1.02]"
            >
              <span>REVIEW &amp; CONFIRM FOR APPROVAL</span>
            </button>
          </div>
        )}

        {/* Locked State: "WHY IS THE GATE LOCKED?" */}
        {evaluation.status !== 'APPROVED' && (
          <div className="rounded-lg border border-[#2A2D35] bg-[#0F1115] p-4 sm:p-5">
            <div className="flex items-center space-x-2 text-gray-400 mb-3">
              <AlertCircle className="h-4 w-4 text-orange-400" />
              <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                WHY IS THE GATE LOCKED?
              </h4>
            </div>

            {evaluation.failedConditions.length === 0 ? (
              <p className="text-xs text-gray-400">
                All primary checklist conditions are fulfilled. Review and confirm above to
                unlock.
              </p>
            ) : (
              <ul className="space-y-1.5 text-xs text-gray-300 font-sans">
                {evaluation.failedConditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-orange-400 font-bold">&bull;</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            )}

            {evaluation.warnings.length > 0 && (
              <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wide">
                    SYSTEM WARNING
                  </p>
                  {evaluation.warnings.map((w, idx) => (
                    <p key={idx} className="text-[10px] text-orange-200">
                      {w}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 45. FINAL CONFIRMATION MODAL */}
      {showFinalReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#2A2D35] bg-[#1A1D23] p-6 shadow-2xl space-y-5">
            <div className="border-b border-[#2A2D35] pb-3">
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                STEP 10 &bull; FINAL PROTOCOL AUDIT
              </span>
              <h3 className="font-sans text-lg font-bold text-white mt-1">
                FINAL PRE-TRADE REVIEW
              </h3>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-2 rounded border border-[#2A2D35] bg-[#0F1115] p-3.5 font-mono text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase">PAIR</span>
                <div className="font-bold text-white">{parameters.pair || '—'}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">DIRECTION</span>
                <div
                  className={`font-bold ${
                    parameters.direction === 'LONG' ? 'text-[#00C853]' : 'text-rose-400'
                  }`}
                >
                  {parameters.direction}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">STRATEGY</span>
                <div className="font-bold text-white">{strategy.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">TIMEFRAME</span>
                <div className="font-bold text-white">{parameters.timeframe}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">ENTRY</span>
                <div className="font-bold text-white">{parameters.entryPrice}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">STOP LOSS</span>
                <div className="font-bold text-rose-400">{parameters.stopLossPrice}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">TAKE PROFIT</span>
                <div className="font-bold text-[#00C853]">{parameters.takeProfitPrice}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">R:R RATIO</span>
                <div className="font-bold text-blue-400">1:{calculatedRisk.rrRatio.toFixed(2)}</div>
              </div>
            </div>

            {/* Acknowledgment Checkbox */}
            <label
              id="final-liability-checkbox"
              onClick={() => {
                if (!modalConfirmed) {
                  soundEngine.play('checkbox_check');
                } else {
                  soundEngine.play('checkbox_uncheck');
                }
                setModalConfirmed(!modalConfirmed);
              }}
              className="flex cursor-pointer items-start space-x-3 rounded border border-[#2A2D35] bg-[#0F1115] p-3 text-xs select-none"
            >
              <input
                type="checkbox"
                checked={modalConfirmed}
                onChange={() => {}}
                className="mt-0.5 h-4 w-4 rounded border-[#2A2D35] bg-[#1A1D23] text-blue-600 focus:ring-0"
              />
              <span className="text-gray-300 leading-relaxed font-medium">
                I personally reviewed this setup, verified invalidation levels, and accept full
                responsibility for my own trading decision.
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowFinalReviewModal(false)}
                className="rounded border border-[#2A2D35] px-4 py-2 text-xs font-semibold text-gray-400 hover:bg-[#252A35] hover:text-white"
              >
                Cancel
              </button>

              <button
                id="confirm-and-approve-btn"
                disabled={!modalConfirmed}
                onClick={handleExecuteApproval}
                className={`rounded px-5 py-2 font-mono text-xs font-bold tracking-wider transition-all ${
                  modalConfirmed
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 hover:scale-[1.02]'
                    : 'bg-[#252A35] text-gray-600 cursor-not-allowed'
                }`}
              >
                CONFIRM &amp; APPROVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

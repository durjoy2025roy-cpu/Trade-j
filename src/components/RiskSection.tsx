import React from 'react';
import {
  ShieldAlert,
  Calculator,
  Layers,
  HelpCircle,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { RiskSettings, CalculatedRisk, CompoundingPlan } from '../types';
import { NumericInput } from './NumericInput';
import { soundEngine } from '../utils/soundEngine';

interface RiskSectionProps {
  riskSettings: RiskSettings;
  calculatedRisk: CalculatedRisk;
  slDistanceInput: string;
  onUpdateSLDistance: (val: string) => void;
  onUpdateRiskSettings: (settings: Partial<RiskSettings>) => void;
  tradesTodayCount: number;
  dailyLossUsedPct: number;
  compoundingPlan?: CompoundingPlan;
}

export const RiskSection: React.FC<RiskSectionProps> = ({
  riskSettings,
  calculatedRisk,
  slDistanceInput,
  onUpdateSLDistance,
  onUpdateRiskSettings,
  tradesTodayCount,
  dailyLossUsedPct,
  compoundingPlan,
}) => {
  const isDailyTradesLimitReached = tradesTodayCount >= riskSettings.maxTradesPerDay;
  const isDailyLossLimitReached = dailyLossUsedPct >= riskSettings.dailyLossLimit;

  // Compounding plan discipline check
  const isExceedingCompoundingLimit =
    compoundingPlan && riskSettings.riskPercentage > compoundingPlan.maxAllowedRiskPct;

  return (
    <div className="rounded-xl border border-[#2A2D35] bg-[#0D1426] p-4 sm:p-5 shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-[#1E2538] pb-3">
        <div className="flex items-center space-x-2">
          <Calculator className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs text-white font-bold uppercase tracking-wider font-mono">
            RISK &amp; POSITION SIZING ENGINE
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {compoundingPlan && (
            <span
              className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                isExceedingCompoundingLimit
                  ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
                  : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              {isExceedingCompoundingLimit
                ? `OUTSIDE PLAN (Limit: ${compoundingPlan.maxAllowedRiskPct}%)`
                : `WITHIN PLAN (Limit: ${compoundingPlan.maxAllowedRiskPct}%)`}
            </span>
          )}
          <span className="font-mono text-[9px] text-cyan-400 uppercase font-bold tracking-wider">
            MATHEMATICAL GUARD
          </span>
        </div>
      </div>

      {/* Primary Calculator Inputs with instant value replacement & mobile optimization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Account Balance */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 font-mono">
            BALANCE ($)
          </label>
          <NumericInput
            id="account-balance-input"
            value={riskSettings.accountBalance}
            onChange={(val) => onUpdateRiskSettings({ accountBalance: Math.max(0, val) })}
            min={0}
            prefix="$"
            className="bg-[#070B18] border-[#2A344E] text-white focus:border-blue-500"
          />
        </div>

        {/* Risk Percentage */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
              RISK (%)
            </label>
            <span className="text-[9px] font-mono text-gray-500">
              Max {riskSettings.maxAllowedRiskPercentage}%
            </span>
          </div>
          <NumericInput
            id="risk-percentage-input"
            value={riskSettings.riskPercentage}
            step={0.1}
            min={0}
            max={5}
            suffix="%"
            onChange={(val) => {
              if (val > riskSettings.maxAllowedRiskPercentage) {
                soundEngine.play('warning');
              }
              onUpdateRiskSettings({ riskPercentage: val });
            }}
            className={
              calculatedRisk.isRiskExceeded || isExceedingCompoundingLimit
                ? 'border-rose-500/60 bg-rose-500/10 text-rose-300 focus:border-rose-400'
                : 'bg-[#070B18] border-[#2A344E] text-white focus:border-blue-500'
            }
          />
        </div>

        {/* Stop Loss Distance */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 font-mono">
            SL DIST (PIPS/PTS)
          </label>
          <NumericInput
            id="sl-distance-input"
            value={slDistanceInput}
            step="any"
            min={0}
            suffix="Pips"
            placeholder="Pips"
            onChange={(_num, raw) => onUpdateSLDistance(raw)}
            className="bg-[#070B18] border-[#2A344E] text-white focus:border-blue-500"
          />
        </div>

        {/* Pip / Point Value */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 font-mono">
            PIP VALUE ($)
          </label>
          <NumericInput
            id="pip-value-input"
            value={riskSettings.pipValue}
            step="any"
            min={0.01}
            prefix="$"
            onChange={(val) => onUpdateRiskSettings({ pipValue: Math.max(0.01, val) })}
            className="bg-[#070B18] border-[#2A344E] text-white focus:border-blue-500"
          />
        </div>
      </div>

      {/* Calculation Outputs Bento */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* Cash Risk */}
        <div className="rounded-lg border border-[#222E48] bg-[#070B18] p-3 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-mono">
            CASH RISK
          </span>
          <div className="mt-1 font-mono text-base font-bold text-rose-400">
            ${calculatedRisk.cashRisk.toFixed(2)}
          </div>
          <span className="text-[9px] text-gray-500 font-mono">
            {riskSettings.riskPercentage}% of Balance
          </span>
        </div>

        {/* Position Size */}
        <div className="rounded-lg border border-blue-500/40 bg-[#070B18] p-3 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block font-mono">
            POSITION SIZE
          </span>
          <div className="mt-1 font-mono text-base font-bold text-blue-400">
            {calculatedRisk.positionSizeLots > 0
              ? `${calculatedRisk.positionSizeLots.toFixed(2)} Lots`
              : '0.00 Lots'}
          </div>
          <span className="text-[9px] text-gray-400 font-mono">Formula Guarded</span>
        </div>

        {/* Potential Reward */}
        <div className="rounded-lg border border-[#222E48] bg-[#070B18] p-3 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-mono">
            POTENTIAL REWARD
          </span>
          <div className="mt-1 font-mono text-base font-bold text-emerald-400">
            ${calculatedRisk.potentialReward.toFixed(2)}
          </div>
          <span className="text-[9px] text-gray-500 font-mono">
            At 1:{calculatedRisk.rrRatio.toFixed(1)} R:R
          </span>
        </div>

        {/* Risk Status */}
        <div
          className={`rounded-lg border p-3 shadow-sm ${
            calculatedRisk.isRiskExceeded || isExceedingCompoundingLimit
              ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block font-mono">
            RISK GUARD
          </span>
          <div className="mt-1 flex items-center space-x-1 font-mono text-xs font-bold">
            {calculatedRisk.isRiskExceeded || isExceedingCompoundingLimit ? (
              <>
                <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                <span>EXCEEDED</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>PASS</span>
              </>
            )}
          </div>
          <span className="text-[9px] text-gray-400 font-mono">
            {calculatedRisk.isRiskExceeded || isExceedingCompoundingLimit
              ? 'Gate Locked'
              : 'Within Limit'}
          </span>
        </div>
      </div>

      {/* Daily Limits & Risk Guard Alert */}
      {(calculatedRisk.isRiskExceeded ||
        isDailyTradesLimitReached ||
        isDailyLossLimitReached ||
        isExceedingCompoundingLimit) && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs space-y-1.5 font-mono">
          {calculatedRisk.isRiskExceeded && (
            <div className="flex items-center space-x-2 text-rose-300 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>
                🔴 RISK LIMIT EXCEEDED: Proposed risk exceeds allowed max ({riskSettings.maxAllowedRiskPercentage}%). Gate remains locked.
              </span>
            </div>
          )}
          {isExceedingCompoundingLimit && (
            <div className="flex items-center space-x-2 text-rose-300 font-semibold">
              <TrendingUp className="h-4 w-4 shrink-0 text-rose-400" />
              <span>
                ⚠️ OUTSIDE COMPOUNDING PLAN: Your active plan restricts risk to {compoundingPlan?.maxAllowedRiskPct}%.
              </span>
            </div>
          )}
          {isDailyTradesLimitReached && (
            <div className="flex items-center space-x-2 text-rose-300 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>
                🔒 DAILY TRADES LIMIT REACHED: Maximum {riskSettings.maxTradesPerDay} trades allowed for today.
              </span>
            </div>
          )}
          {isDailyLossLimitReached && (
            <div className="flex items-center space-x-2 text-rose-300 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>
                🔒 DAILY LOSS LIMIT REACHED: Daily risk tolerance ({riskSettings.dailyLossLimit}%) exhausted.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Forex Lot Cheatsheet & Quick Reference */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Forex Lot Cheatsheet */}
        <div className="rounded-lg border border-[#222E48] bg-[#070B18] p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
              FOREX LOT CHEATSHEET
            </span>
            <span className="text-[9px] text-gray-500 font-mono uppercase">STANDARD</span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-gray-300">
            <div className="flex justify-between border-b border-[#1A2234] py-0.5">
              <span>1.00 Standard Lot</span>
              <span className="text-blue-400 font-bold">100,000 units</span>
            </div>
            <div className="flex justify-between border-b border-[#1A2234] py-0.5">
              <span>0.10 Mini Lot</span>
              <span className="text-blue-400 font-bold">10,000 units</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>0.01 Micro Lot</span>
              <span className="text-blue-400 font-bold">1,000 units</span>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="rounded-lg border border-[#222E48] bg-[#070B18] p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
              QUICK REFERENCE (REF ONLY)
            </span>
            <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[8px] font-mono text-blue-300 uppercase">
              No live pricing
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-gray-400">
            <div className="rounded bg-[#0D1426] border border-[#1E2538] p-1.5 text-center">EURUSD &bull; 0.0001</div>
            <div className="rounded bg-[#0D1426] border border-[#1E2538] p-1.5 text-center">GBPUSD &bull; 0.0001</div>
            <div className="rounded bg-[#0D1426] border border-[#1E2538] p-1.5 text-center">USDJPY &bull; 0.01</div>
            <div className="rounded bg-[#0D1426] border border-[#1E2538] p-1.5 text-center">XAUUSD &bull; $0.01</div>
            <div className="rounded bg-[#0D1426] border border-[#1E2538] p-1.5 text-center">BTCUSD &bull; $1.00</div>
            <div className="rounded bg-[#0D1426] border border-[#1E2538] p-1.5 text-center">ETHUSD &bull; $0.10</div>
          </div>
        </div>
      </div>
    </div>
  );
};

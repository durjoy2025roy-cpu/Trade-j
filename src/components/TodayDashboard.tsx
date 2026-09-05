import React from 'react';
import { Target, Award, ShieldCheck, Flame, CalendarCheck } from 'lucide-react';
import { CompoundingPlan } from '../types';

interface TodayDashboardProps {
  tradesCount: number;
  maxTrades: number;
  riskUsedPct: number;
  dailyLossLimitPct: number;
  approvedCount: number;
  noTradeCount: number;
  checklistCompletionAvg: number;
  compoundingPlan?: CompoundingPlan;
  onNavigateCompounding?: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  tradesCount,
  maxTrades,
  riskUsedPct,
  dailyLossLimitPct,
  approvedCount,
  noTradeCount,
  checklistCompletionAvg,
  compoundingPlan,
  onNavigateCompounding,
}) => {
  const riskRemaining = Math.max(0, dailyLossLimitPct - riskUsedPct);

  // Compute a balanced Discipline Score (0 to 100)
  let disciplineScore = 100;
  if (tradesCount > maxTrades) disciplineScore -= 30;
  if (riskUsedPct > dailyLossLimitPct) disciplineScore -= 40;
  if (checklistCompletionAvg < 100) {
    disciplineScore -= Math.round((100 - checklistCompletionAvg) * 0.2);
  }
  disciplineScore = Math.max(20, Math.min(100, disciplineScore));

  const currentPlanDay = compoundingPlan?.days?.find((d) => d.day === compoundingPlan.currentDay);

  return (
    <div className="rounded-xl border border-[#2A2D35] bg-[#0D1426] p-4 sm:p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1E2538] pb-3 gap-2">
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs text-white font-bold uppercase tracking-wider font-mono">
            TODAY &bull; DAILY DISCIPLINE TERMINAL
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {compoundingPlan && currentPlanDay && (
            <button
              onClick={onNavigateCompounding}
              className="flex items-center space-x-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>PLAN DAY {compoundingPlan.currentDay}: Max {currentPlanDay.maxRiskPct}%</span>
            </button>
          )}

          {/* Discipline Score Badge */}
          <div className="flex items-center space-x-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs">
            <Award className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-mono text-[10px] text-gray-400 uppercase font-bold">SCORE:</span>
            <span className="font-mono font-bold text-blue-300">{disciplineScore}%</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 font-mono text-xs">
        {/* Trades Executed */}
        <div className="rounded-lg border border-[#222E48] bg-[#070B18] p-3">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">TRADES TODAY</span>
          <div className="mt-1 text-base font-bold text-white">
            {tradesCount}{' '}
            <span className="text-xs text-gray-500 font-normal">/ {maxTrades} Max</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#1A2234] overflow-hidden">
            <div
              className={`h-full rounded-full ${
                tradesCount >= maxTrades ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (tradesCount / maxTrades) * 100)}%` }}
            />
          </div>
        </div>

        {/* Risk Allocated vs Remaining */}
        <div className="rounded-lg border border-[#222E48] bg-[#070B18] p-3">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">RISK REMAINING</span>
          <div className="mt-1 text-base font-bold text-emerald-400">
            {riskRemaining.toFixed(1)}%
          </div>
          <div className="mt-1 text-[10px] text-gray-500">
            {riskUsedPct.toFixed(1)}% Used &bull; {dailyLossLimitPct}% Max
          </div>
        </div>

        {/* Approved Setups */}
        <div className="rounded-lg border border-[#222E48] bg-[#070B18] p-3">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">APPROVED SETUPS</span>
          <div className="mt-1 text-base font-bold text-blue-400">{approvedCount}</div>
          <div className="mt-1 text-[10px] text-gray-500">Rigorous Gate Passes</div>
        </div>

        {/* No-Trade Sessions Logged */}
        <div className="rounded-lg border border-[#222E48] bg-[#070B18] p-3">
          <span className="text-[10px] text-gray-400 uppercase font-bold block">NO-TRADE LOGS</span>
          <div className="mt-1 text-base font-bold text-amber-400">{noTradeCount}</div>
          <div className="mt-1 text-[10px] text-gray-500">Capital Preserved</div>
        </div>
      </div>
    </div>
  );
};

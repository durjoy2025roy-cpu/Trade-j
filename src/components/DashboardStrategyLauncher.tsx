import React from 'react';
import { Target, TrendingUp, ArrowRight, ShieldCheck, ShieldAlert, Check } from 'lucide-react';
import { StrategyType, ChecklistItem, AppView } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface DashboardStrategyLauncherProps {
  activeStrategy: StrategyType;
  onSelectStrategy: (strat: StrategyType) => void;
  onNavigate: (view: AppView) => void;
  silverBulletChecklist: ChecklistItem[];
  emaSwingChecklist: ChecklistItem[];
}

export const DashboardStrategyLauncher: React.FC<DashboardStrategyLauncherProps> = ({
  activeStrategy,
  onSelectStrategy,
  onNavigate,
  silverBulletChecklist,
  emaSwingChecklist,
}) => {
  const sbCompleted = silverBulletChecklist.filter((i) => i.checked).length;
  const sbTotal = silverBulletChecklist.length || 5;
  const sbApproved = sbCompleted === sbTotal;

  const emaCompleted = emaSwingChecklist.filter((i) => i.checked).length;
  const emaTotal = emaSwingChecklist.length || 4;
  const emaApproved = emaCompleted === emaTotal;

  return (
    <div className="rounded-xl border border-[#2A2D35] bg-[#121620] p-4 sm:p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-[#2A2D35] pb-3">
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-gray-200">
            STRATEGY CHECKLISTS
          </h3>
          <p className="text-[11px] text-gray-400">
            Dedicated pre-trade validation gates
          </p>
        </div>
        <span className="rounded bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
          MANUAL GATE
        </span>
      </div>

      {/* Strategy Cards */}
      <div className="space-y-3">
        {/* ICT Silver Bullet Card */}
        <div
          id="card-launcher-silver-bullet"
          className={`group rounded-xl border p-3.5 transition-all ${
            activeStrategy === 'ICT_SILVER_BULLET'
              ? 'border-blue-500/50 bg-[#151D2E] shadow-sm shadow-blue-500/10'
              : 'border-[#2A2D35] bg-[#1A1F2C] hover:border-gray-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-400" />
                <span className="font-mono text-xs font-bold text-white">
                  ICT Silver Bullet
                </span>
                <span className="rounded bg-black/40 border border-[#2A2D35] px-1.5 py-0.2 font-mono text-[9px] text-blue-300">
                  M1 / M5
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                PDH/PDL sweeps, time window, MSS &amp; FVG execution
              </p>
            </div>

            <span
              className={`flex items-center space-x-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                sbApproved
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}
            >
              {sbApproved ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
              <span>{sbApproved ? 'APPROVED' : 'LOCKED'}</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-400">Step Progress</span>
              <span className={sbApproved ? 'text-emerald-400 font-bold' : 'text-blue-400'}>
                {sbCompleted} / {sbTotal} Confirmed
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0B0E14]">
              <div
                className={`h-full transition-all duration-300 ${
                  sbApproved ? 'bg-emerald-400' : 'bg-blue-600'
                }`}
                style={{ width: `${(sbCompleted / sbTotal) * 100}%` }}
              />
            </div>
          </div>

          {/* Action button to open dedicated checklist page */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#2A2D35]/50">
            <button
              id="btn-select-strat-sb"
              onClick={() => {
                soundEngine.play('button_click');
                onSelectStrategy('ICT_SILVER_BULLET');
              }}
              className={`text-[10px] font-mono font-bold uppercase transition-colors ${
                activeStrategy === 'ICT_SILVER_BULLET'
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeStrategy === 'ICT_SILVER_BULLET' ? '• Active Setup' : 'Set as Active'}
            </button>

            <button
              id="btn-open-silver-bullet-checklist"
              onClick={() => {
                soundEngine.play('button_click');
                onSelectStrategy('ICT_SILVER_BULLET');
                onNavigate('ICT_SILVER_BULLET');
              }}
              className="flex items-center space-x-1.5 rounded-lg border border-blue-500/40 bg-blue-600/30 px-3 py-1.5 text-xs font-semibold text-blue-200 transition-all hover:bg-blue-600 hover:text-white group-hover:border-blue-400"
            >
              <span>Open Checklist</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* 9/20 EMA Swing Card */}
        <div
          id="card-launcher-ema-swing"
          className={`group rounded-xl border p-3.5 transition-all ${
            activeStrategy === 'EMA_SWING'
              ? 'border-violet-500/50 bg-[#1C1628] shadow-sm shadow-violet-500/10'
              : 'border-[#2A2D35] bg-[#1A1F2C] hover:border-gray-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-violet-400" />
                <span className="font-mono text-xs font-bold text-white">
                  9/20 EMA Swing
                </span>
                <span className="rounded bg-black/40 border border-[#2A2D35] px-1.5 py-0.2 font-mono text-[9px] text-violet-300">
                  H1 / H4
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Trend alignment, EMA dynamic zone &amp; rejection candles
              </p>
            </div>

            <span
              className={`flex items-center space-x-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                emaApproved
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}
            >
              {emaApproved ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
              <span>{emaApproved ? 'APPROVED' : 'LOCKED'}</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-400">Step Progress</span>
              <span className={emaApproved ? 'text-emerald-400 font-bold' : 'text-violet-400'}>
                {emaCompleted} / {emaTotal} Confirmed
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0B0E14]">
              <div
                className={`h-full transition-all duration-300 ${
                  emaApproved ? 'bg-emerald-400' : 'bg-violet-600'
                }`}
                style={{ width: `${(emaCompleted / emaTotal) * 100}%` }}
              />
            </div>
          </div>

          {/* Action button to open dedicated checklist page */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#2A2D35]/50">
            <button
              id="btn-select-strat-ema"
              onClick={() => {
                soundEngine.play('button_click');
                onSelectStrategy('EMA_SWING');
              }}
              className={`text-[10px] font-mono font-bold uppercase transition-colors ${
                activeStrategy === 'EMA_SWING'
                  ? 'text-violet-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeStrategy === 'EMA_SWING' ? '• Active Setup' : 'Set as Active'}
            </button>

            <button
              id="btn-open-ema-swing-checklist"
              onClick={() => {
                soundEngine.play('button_click');
                onSelectStrategy('EMA_SWING');
                onNavigate('EMA_SWING');
              }}
              className="flex items-center space-x-1.5 rounded-lg border border-violet-500/40 bg-violet-600/30 px-3 py-1.5 text-xs font-semibold text-violet-200 transition-all hover:bg-violet-600 hover:text-white group-hover:border-violet-400"
            >
              <span>Open Checklist</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

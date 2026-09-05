import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  ArrowLeft,
  Check,
  Clock,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';
import { ChecklistItem, AppView } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface SilverBulletChecklistPageProps {
  checklist: ChecklistItem[];
  onToggleItem: (id: string) => void;
  onResetChecklist: () => void;
  onNavigate: (view: AppView) => void;
}

export const SilverBulletChecklistPage: React.FC<SilverBulletChecklistPageProps> = ({
  checklist,
  onToggleItem,
  onResetChecklist,
  onNavigate,
}) => {
  const completedCount = checklist.filter((item) => item.checked).length;
  const totalCount = checklist.length;
  const isAllConfirmed = totalCount === 5 && completedCount === 5;

  // Identify why gate is locked
  const firstUnchecked = checklist.find((item) => !item.checked);
  const unconfirmedSteps = checklist
    .filter((item) => !item.checked)
    .map((item) => `Step ${item.stepNumber || 1} — ${item.stepTitle || item.label}`);

  const handleToggle = (item: ChecklistItem) => {
    if (!item.checked) {
      soundEngine.play('checkbox_check');
      // If this check completes the checklist
      if (completedCount + 1 === totalCount) {
        setTimeout(() => soundEngine.play('gate_approved'), 180);
      }
    } else {
      soundEngine.play('checkbox_uncheck');
      // If it was fully confirmed before unchecking, play locked sound
      if (isAllConfirmed) {
        setTimeout(() => soundEngine.play('gate_locked'), 180);
      }
    }
    onToggleItem(item.id);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-2 sm:px-4 sm:py-4">
      {/* Header & Navigation Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#2A2D35] bg-[#121620] p-4 sm:flex-row sm:items-center sm:justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            id="btn-back-dashboard-sb"
            onClick={() => {
              soundEngine.play('button_click');
              onNavigate('DASHBOARD');
            }}
            className="flex items-center space-x-1.5 rounded-lg border border-[#2A2D35] bg-[#1A1F2C] px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-blue-500 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
            <span>Dashboard</span>
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-mono text-base sm:text-lg font-bold tracking-tight text-white">
                ICT Silver Bullet
              </h1>
              <span className="rounded bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                M1 / M5
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">M1/M5 Pre-Trade Checklist</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-3">
          {/* Progress Pill */}
          <div className="flex items-center space-x-2 rounded-lg border border-[#2A2D35] bg-[#0B0E14] px-3 py-1.5 font-mono text-xs">
            <span className="text-gray-400 text-[11px]">STATUS:</span>
            <span
              className={`font-bold ${
                isAllConfirmed ? 'text-emerald-400' : 'text-blue-400'
              }`}
            >
              {completedCount} / {totalCount} CONFIRMED
            </span>
          </div>

          <button
            id="btn-reset-sb-checklist"
            onClick={() => {
              soundEngine.play('button_click');
              onResetChecklist();
            }}
            className="flex items-center space-x-1 rounded-lg border border-red-500/20 bg-red-950/20 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/30 hover:border-red-500/40"
            title="Reset Checklist"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="text-[11px]">Reset</span>
          </button>
        </div>
      </div>

      {/* Checklist Items Container */}
      <div className="space-y-3.5">
        {checklist.map((item, index) => {
          const stepNum = item.stepNumber || index + 1;
          const stepTitle = item.stepTitle || `Step ${stepNum}`;
          const timeframe = item.timeframe || 'M1 / M5';
          const instruction = item.instruction || item.description || item.label;

          return (
            <div
              key={item.id}
              id={`sb-step-card-${stepNum}`}
              className={`rounded-xl border p-4 sm:p-5 transition-all select-none ${
                item.checked
                  ? 'border-blue-500/40 bg-gradient-to-r from-[#121A2E] to-[#121622] shadow-[0_0_15px_rgba(59,130,246,0.08)]'
                  : 'border-[#2A2D35] bg-[#121620] hover:border-gray-600'
              }`}
            >
              {/* Step Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2D35]/60 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs sm:text-sm font-bold tracking-wide text-white">
                    Step {stepNum}: {stepTitle}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 rounded bg-[#0B0E14] border border-[#2A2D35] px-2 py-0.5 text-[11px] font-mono text-cyan-300">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  <span>[Timeframe: {timeframe}]</span>
                </div>
              </div>

              {/* Step Body: Instruction */}
              <div className="mt-3 text-xs sm:text-sm font-medium text-gray-200 leading-relaxed">
                {instruction}
              </div>

              {/* Step Action: Confirmation Checkbox */}
              <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#2A2D35]/40">
                <button
                  type="button"
                  id={`sb-check-btn-${stepNum}`}
                  onClick={() => handleToggle(item)}
                  className={`flex items-center space-x-2.5 rounded-lg border px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                    item.checked
                      ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'border-[#2A2D35] bg-[#1A1F2C] text-gray-300 hover:border-blue-500/60 hover:text-white'
                  }`}
                >
                  <div className="flex h-4 w-4 items-center justify-center rounded">
                    {item.checked ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <span>{item.checked ? '[✓] Confirmed' : '[ ] Confirmed'}</span>
                </button>

                {item.checked && (
                  <span className="flex items-center space-x-1 font-mono text-[11px] font-semibold text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>VERIFIED</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SILVER BULLET GATE */}
      <div
        id="silver-bullet-gate-status"
        className={`rounded-xl border p-5 sm:p-6 transition-all shadow-xl ${
          isAllConfirmed
            ? 'border-emerald-500/60 bg-gradient-to-br from-[#0D2418] via-[#101E17] to-[#121620] shadow-[0_0_25px_rgba(16,185,129,0.15)]'
            : 'border-red-500/40 bg-gradient-to-br from-[#241113] via-[#1A1317] to-[#121620]'
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start space-x-3.5">
            <div
              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                isAllConfirmed
                  ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
                  : 'border-red-500/50 bg-red-500/20 text-red-400'
              }`}
            >
              {isAllConfirmed ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <ShieldAlert className="h-6 w-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  SILVER BULLET GATE
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                    isAllConfirmed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {isAllConfirmed ? '5 / 5 READY' : `${completedCount} / 5 COMPLETE`}
                </span>
              </div>

              <h2
                className={`font-mono text-base sm:text-lg font-extrabold tracking-tight ${
                  isAllConfirmed ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isAllConfirmed ? 'APPROVED FOR EXECUTION' : 'LOCKED'}
              </h2>

              {/* Reason why gate is locked */}
              {!isAllConfirmed ? (
                <div className="mt-2 space-y-1 rounded-lg border border-red-500/20 bg-black/40 p-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-red-400 font-mono">
                    Why is the Gate Locked?
                  </div>
                  <div className="text-xs text-gray-300 leading-relaxed font-medium">
                    {firstUnchecked
                      ? `Step ${firstUnchecked.stepNumber} — ${firstUnchecked.stepTitle} is not confirmed.`
                      : 'Checklist conditions are not confirmed.'}
                  </div>
                  {unconfirmedSteps.length > 1 && (
                    <div className="text-[10px] text-gray-400 font-mono">
                      Remaining unconfirmed: {unconfirmedSteps.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-emerald-200/90 font-medium">
                  All 5 Silver Bullet criteria verified. Proceed to Risk Calculator & Trade Execution.
                </p>
              )}
            </div>
          </div>

          {/* Quick Navigation to Risk/Dashboard */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
            <button
              id="btn-sb-proceed-risk"
              onClick={() => {
                soundEngine.play('button_click');
                onNavigate('RISK_CALCULATOR');
              }}
              className="flex w-full items-center justify-center space-x-2 rounded-lg border border-blue-500/40 bg-blue-600/30 px-4 py-2 text-xs font-bold text-blue-200 transition-all hover:bg-blue-600/50 hover:text-white"
            >
              <span>Risk Calculator</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              id="btn-sb-goto-dashboard"
              onClick={() => {
                soundEngine.play('button_click');
                onNavigate('DASHBOARD');
              }}
              className="flex w-full items-center justify-center space-x-1.5 rounded-lg border border-[#2A2D35] bg-[#1A1F2C] px-3.5 py-2 text-xs text-gray-400 transition-colors hover:text-white"
            >
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { CheckSquare, Square, AlertCircle, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { ChecklistItem, StrategyType } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface ChecklistSectionProps {
  strategy: StrategyType;
  onSelectStrategy: (strat: StrategyType) => void;
  checklist: ChecklistItem[];
  onToggleItem: (id: string) => void;
  onResetChecklist: () => void;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  strategy,
  onSelectStrategy,
  checklist,
  onToggleItem,
  onResetChecklist,
}) => {
  const [showSwitchConfirm, setShowSwitchConfirm] = useState<StrategyType | null>(null);

  const completedCount = checklist.filter((item) => item.checked).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group items by Step
  const stepGroups = checklist.reduce((acc: Record<string, ChecklistItem[]>, item) => {
    if (!acc[item.step]) acc[item.step] = [];
    acc[item.step].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const handleTabClick = (targetStrat: StrategyType) => {
    if (targetStrat === strategy) return;
    soundEngine.play('tab_switch');

    // If some items are checked, ask confirmation to prevent accidental loss
    if (completedCount > 0) {
      setShowSwitchConfirm(targetStrat);
    } else {
      onSelectStrategy(targetStrat);
    }
  };

  const confirmSwitch = () => {
    if (showSwitchConfirm) {
      soundEngine.play('button_click');
      onSelectStrategy(showSwitchConfirm);
      setShowSwitchConfirm(null);
    }
  };

  return (
    <div className="rounded-lg border border-[#2A2D35] bg-[#1A1D23] p-4 sm:p-5 shadow-lg">
      {/* Strategy Switch Tabs */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#2A2D35] pb-3">
        <div className="flex items-center space-x-2">
          <button
            id="tab-ict-silver-bullet"
            onClick={() => handleTabClick('ICT_SILVER_BULLET')}
            className={`flex items-center space-x-2 rounded px-3 py-1.5 text-xs font-bold tracking-wide transition-all ${
              strategy === 'ICT_SILVER_BULLET'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#0F1115] border border-[#2A2D35] text-gray-400 hover:text-white'
            }`}
          >
            <span>ICT SILVER BULLET</span>
            <span className="rounded bg-black/40 px-1 py-0.5 text-[9px] font-mono text-blue-200">M1 / M5</span>
          </button>

          <button
            id="tab-ema-swing"
            onClick={() => handleTabClick('EMA_SWING')}
            className={`flex items-center space-x-2 rounded px-3 py-1.5 text-xs font-bold tracking-wide transition-all ${
              strategy === 'EMA_SWING'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#0F1115] border border-[#2A2D35] text-gray-400 hover:text-white'
            }`}
          >
            <span>9/20 EMA SWING</span>
            <span className="rounded bg-black/40 px-1 py-0.5 text-[9px] font-mono text-blue-200">H1 / H4</span>
          </button>
        </div>

        <button
          onClick={() => {
            soundEngine.play('button_click');
            onResetChecklist();
          }}
          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-gray-300"
        >
          Reset Checklist
        </button>
      </div>

      {/* Progress Header */}
      <div className="mb-4 rounded border border-[#2A2D35] bg-[#0F1115] p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              CHECKLIST PROGRESS
            </span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-blue-400 font-bold">{progressPercent}%</span>
            <span className="text-gray-500">
              ({completedCount} / {totalCount} CONDITIONS)
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#252A35]">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercent === 100
                ? 'bg-[#00C853] shadow-[0_0_8px_rgba(0,200,83,0.5)]'
                : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Grouped by Steps */}
      <div className="space-y-4">
        {(Object.entries(stepGroups) as [string, ChecklistItem[]][]).map(([stepName, items]) => {
          const stepComplete = items.every((i) => i.checked);
          return (
            <div
              key={stepName}
              className="rounded border border-[#2A2D35] bg-[#0F1115] p-3.5 transition-colors"
            >
              {/* Step Header */}
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 font-mono">
                  {stepName}
                </span>
                {stepComplete ? (
                  <span className="flex items-center space-x-1 text-[10px] font-bold text-[#00C853]">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="uppercase">STEP CONFIRMED</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-500 font-mono">
                    {items.filter((i) => i.checked).length}/{items.length}
                  </span>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                {items.map((item) => (
                  <label
                    key={item.id}
                    id={`checkbox-item-${item.id}`}
                    onClick={() => {
                      if (!item.checked) {
                        soundEngine.play('checkbox_check');
                      } else {
                        soundEngine.play('checkbox_uncheck');
                      }
                      onToggleItem(item.id);
                    }}
                    className={`group flex cursor-pointer items-start space-x-3 rounded border p-2.5 transition-all select-none ${
                      item.checked
                        ? 'border-[#3D85FF]/50 bg-[#3D85FF]/10 shadow-[0_0_12px_rgba(61,133,255,0.08)]'
                        : 'border-[#2A2D35] bg-[#1A1D23] hover:border-gray-600'
                    }`}
                  >
                    <div className="pt-0.5">
                      {item.checked ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded bg-blue-600 text-white shadow-sm transition-transform group-hover:scale-105">
                          <CheckSquare className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <Square className="h-4 w-4 text-gray-600 transition-colors group-hover:text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-xs font-medium transition-colors ${
                          item.checked ? 'text-white font-semibold' : 'text-gray-300'
                        }`}
                      >
                        {item.label}
                      </div>
                      {item.description && (
                        <div className="mt-0.5 text-[10px] text-gray-500 leading-relaxed">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Switch Strategy Confirmation Modal */}
      {showSwitchConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-lg border border-[#2A2D35] bg-[#1A1D23] p-5 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-orange-400">
              <AlertCircle className="h-5 w-5" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider">SWITCH STRATEGY?</h4>
            </div>
            <p className="mt-2 text-xs text-gray-300 leading-relaxed">
              You have {completedCount} conditions checked on your current checklist. Switching will
              reset your active checklist progress.
            </p>
            <div className="mt-4 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowSwitchConfirm(null)}
                className="rounded border border-[#2A2D35] px-3 py-1.5 text-xs text-gray-400 hover:bg-[#252A35] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmSwitch}
                className="rounded bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-600/30"
              >
                Confirm Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

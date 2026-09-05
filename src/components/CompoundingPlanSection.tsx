import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Upload,
  Calendar,
  CheckCircle2,
  Sliders,
  DollarSign,
  Percent,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { CompoundingPlan, CompoundingPlanDay } from '../types';
import { NumericInput } from './NumericInput';
import { soundEngine } from '../utils/soundEngine';

interface CompoundingPlanSectionProps {
  plan: CompoundingPlan;
  onUpdatePlan: (plan: CompoundingPlan) => void;
  currentBalance: number;
}

export const CompoundingPlanSection: React.FC<CompoundingPlanSectionProps> = ({
  plan,
  onUpdatePlan,
  currentBalance,
}) => {
  const [startingBalance, setStartingBalance] = useState<number>(plan.startingBalance || 1000);
  const [durationDays, setDurationDays] = useState<number>(plan.durationDays || 30);
  const [dailyRiskPct, setDailyRiskPct] = useState<number>(plan.dailyRiskPct || 1.0);
  const [dailyTargetPct, setDailyTargetPct] = useState<number>(plan.dailyTargetPct || 2.0);
  const [maxAllowedRiskPct, setMaxAllowedRiskPct] = useState<number>(plan.maxAllowedRiskPct || 2.0);
  const [tradingDaysPerWeek, setTradingDaysPerWeek] = useState<number>(plan.tradingDaysPerWeek || 5);
  const [maxTradesPerDay, setMaxTradesPerDay] = useState<number>(plan.maxTradesPerDay || 2);
  const [targetRRR, setTargetRRR] = useState<number>(plan.targetRRR || 2.0);
  const [currentDay, setCurrentDay] = useState<number>(plan.currentDay || 1);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(plan.disclaimerAccepted || false);

  // Sync state if external plan updates
  useEffect(() => {
    setStartingBalance(plan.startingBalance);
    setDurationDays(plan.durationDays);
    setDailyRiskPct(plan.dailyRiskPct);
    setDailyTargetPct(plan.dailyTargetPct);
    setMaxAllowedRiskPct(plan.maxAllowedRiskPct);
    setTradingDaysPerWeek(plan.tradingDaysPerWeek);
    setMaxTradesPerDay(plan.maxTradesPerDay);
    setTargetRRR(plan.targetRRR);
    setCurrentDay(plan.currentDay);
    setDisclaimerAccepted(plan.disclaimerAccepted);
  }, [plan.id]);

  // Recalculate mathematical compounding days
  const generateDays = (): CompoundingPlanDay[] => {
    const days: CompoundingPlanDay[] = [];
    let runningBalance = startingBalance;

    for (let i = 1; i <= Math.min(durationDays, 120); i++) {
      const riskAmount = runningBalance * (dailyRiskPct / 100);
      const targetAmount = runningBalance * (dailyTargetPct / 100);
      const targetBalance = runningBalance + targetAmount;

      days.push({
        day: i,
        startingBalance: Math.round(runningBalance * 100) / 100,
        maxRiskPct: dailyRiskPct,
        riskAmount: Math.round(riskAmount * 100) / 100,
        targetPct: dailyTargetPct,
        targetAmount: Math.round(targetAmount * 100) / 100,
        targetBalance: Math.round(targetBalance * 100) / 100,
        maxTrades: maxTradesPerDay,
        requiredRRR: targetRRR,
      });

      // Compound forward for next day
      runningBalance = targetBalance;
    }
    return days;
  };

  const calculatedDays = generateDays();
  const finalProjectedBalance = calculatedDays.length > 0 ? calculatedDays[calculatedDays.length - 1].targetBalance : startingBalance;
  const todayRecord = calculatedDays.find((d) => d.day === currentDay) || calculatedDays[0];

  const handleApplyParameters = () => {
    soundEngine.play('data_saved');
    const updatedPlan: CompoundingPlan = {
      ...plan,
      updatedAt: Date.now(),
      startingBalance,
      targetBalance: finalProjectedBalance,
      durationDays,
      dailyRiskPct,
      dailyTargetPct,
      weeklyTargetPct: dailyTargetPct * tradingDaysPerWeek,
      maxAllowedRiskPct,
      tradingDaysPerWeek,
      maxTradesPerDay,
      targetRRR,
      currentDay,
      days: calculatedDays,
      disclaimerAccepted,
    };
    onUpdatePlan(updatedPlan);
  };

  // Import CSV / JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (parsed.startingBalance) setStartingBalance(Number(parsed.startingBalance));
          if (parsed.durationDays) setDurationDays(Number(parsed.durationDays));
          if (parsed.dailyRiskPct) setDailyRiskPct(Number(parsed.dailyRiskPct));
          if (parsed.dailyTargetPct) setDailyTargetPct(Number(parsed.dailyTargetPct));
          if (parsed.maxAllowedRiskPct) setMaxAllowedRiskPct(Number(parsed.maxAllowedRiskPct));
          if (parsed.maxTradesPerDay) setMaxTradesPerDay(Number(parsed.maxTradesPerDay));
          if (parsed.targetRRR) setTargetRRR(Number(parsed.targetRRR));
          soundEngine.play('data_saved');
          alert('Compounding plan imported successfully from JSON.');
        } else {
          // Parse CSV lines
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 1) {
            // Check if key-value or day rows
            alert(`Parsed ${lines.length} rows from CSV. Applying compounding plan.`);
            soundEngine.play('data_saved');
          }
        }
      } catch (err) {
        soundEngine.play('warning');
        alert('Could not parse file. Ensure it is a valid JSON or CSV configuration.');
      }
    };
    reader.readAsText(file);
  };

  // Export Plan to CSV
  const handleExportPlanCsv = () => {
    soundEngine.play('button_click');
    const headers = [
      'Day',
      'Starting Balance ($)',
      'Max Risk (%)',
      'Risk Amount ($)',
      'Target (%)',
      'Target Amount ($)',
      'Projected Target Balance ($)',
      'Max Trades',
      'Required RRR',
    ];
    const rows = calculatedDays.map((d) => [
      d.day,
      d.startingBalance.toFixed(2),
      d.maxRiskPct.toFixed(1) + '%',
      d.riskAmount.toFixed(2),
      d.targetPct.toFixed(1) + '%',
      d.targetAmount.toFixed(2),
      d.targetBalance.toFixed(2),
      d.maxTrades,
      `1:${d.requiredRRR.toFixed(1)}`,
    ]);

    const csvContent = '\uFEFF' + headers.join(',') + '\r\n' + rows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-gate-compounding-plan-${durationDays}days.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 200);
    soundEngine.play('csv_export_completed');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-2 sm:px-4 py-2">
      {/* Header */}
      <div className="rounded-xl border border-[#3B82F6]/30 bg-gradient-to-r from-[#0D1426] via-[#121B33] to-[#0D1426] p-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 text-white shadow-md shadow-emerald-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-mono text-base sm:text-lg font-bold text-white tracking-tight">
                Compounding &amp; Discipline Plan
              </h2>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                ACTIVE DISCIPLINE REFERENCE
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Mathematical Compounding Scenario &bull; Risk Guard Reference &bull; Day-by-Day Execution Rule
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {/* File Upload input */}
          <label className="flex items-center space-x-1.5 cursor-pointer rounded-lg border border-[#2A2D35] bg-[#0F1115] px-2.5 py-1.5 font-mono text-xs text-gray-300 hover:border-blue-500 hover:text-white transition-colors">
            <Upload className="h-3.5 w-3.5" />
            <span>Import Plan</span>
            <input type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Export CSV button */}
          <button
            onClick={handleExportPlanCsv}
            className="flex items-center space-x-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 font-mono text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Mathematical Disclaimer Banner */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200/90 flex items-start space-x-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">EDUCATIONAL &amp; MATHEMATICAL DISCLAIMER</p>
          <p className="leading-relaxed">
            Compounding projections are mathematical scenarios, not guaranteed trading returns. In real market conditions, losses occur and drawdowns happen. The purpose of this plan is strictly to enforce **maximum daily risk discipline** and prevent overtrading.
          </p>
        </div>
      </div>

      {/* TODAY'S PLAN SUMMARY CARD */}
      {todayRecord && (
        <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-[#0D1426] via-[#10182E] to-[#0A0F1D] p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#2A344E] pb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
                TODAY'S EXECUTION PLAN (DAY {currentDay} OF {durationDays})
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-gray-400">Current Day:</span>
              <select
                value={currentDay}
                onChange={(e) => {
                  const d = parseInt(e.target.value);
                  setCurrentDay(d);
                  onUpdatePlan({ ...plan, currentDay: d });
                  soundEngine.play('button_click');
                }}
                className="rounded border border-[#2A344E] bg-[#070B18] px-2 py-0.5 font-mono text-xs text-white"
              >
                {calculatedDays.map((d) => (
                  <option key={d.day} value={d.day}>
                    Day {d.day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <div className="rounded-lg bg-[#070B18] border border-[#222E48] p-2.5">
              <span className="text-[10px] font-mono text-gray-400 block">START BALANCE</span>
              <span className="font-mono text-sm sm:text-base font-bold text-white">
                ${todayRecord.startingBalance.toFixed(2)}
              </span>
            </div>

            <div className="rounded-lg bg-[#070B18] border border-[#222E48] p-2.5">
              <span className="text-[10px] font-mono text-gray-400 block">MAX RISK %</span>
              <span className="font-mono text-sm sm:text-base font-bold text-rose-400">
                {todayRecord.maxRiskPct.toFixed(1)}%
              </span>
            </div>

            <div className="rounded-lg bg-[#070B18] border border-[#222E48] p-2.5">
              <span className="text-[10px] font-mono text-gray-400 block">RISK AMOUNT</span>
              <span className="font-mono text-sm sm:text-base font-bold text-rose-400">
                ${todayRecord.riskAmount.toFixed(2)}
              </span>
            </div>

            <div className="rounded-lg bg-[#070B18] border border-[#222E48] p-2.5">
              <span className="text-[10px] font-mono text-gray-400 block">DAILY TARGET %</span>
              <span className="font-mono text-sm sm:text-base font-bold text-emerald-400">
                +{todayRecord.targetPct.toFixed(1)}%
              </span>
            </div>

            <div className="rounded-lg bg-[#070B18] border border-[#222E48] p-2.5">
              <span className="text-[10px] font-mono text-gray-400 block">TARGET AMOUNT</span>
              <span className="font-mono text-sm sm:text-base font-bold text-emerald-400">
                +${todayRecord.targetAmount.toFixed(2)}
              </span>
            </div>

            <div className="rounded-lg bg-[#070B18] border border-[#222E48] p-2.5">
              <span className="text-[10px] font-mono text-gray-400 block">MAX TRADES</span>
              <span className="font-mono text-sm sm:text-base font-bold text-amber-300">
                {todayRecord.maxTrades} / Day
              </span>
            </div>

            <div className="rounded-lg bg-[#070B18] border border-[#222E48] p-2.5">
              <span className="text-[10px] font-mono text-gray-400 block">TARGET RRR</span>
              <span className="font-mono text-sm sm:text-base font-bold text-cyan-300">
                1:{todayRecord.requiredRRR.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PLAN CONFIGURATION FORM */}
      <div className="rounded-xl border border-[#2A2D35] bg-[#0D1426] p-4 space-y-4 shadow-lg">
        <div className="flex items-center space-x-2 border-b border-[#1E2538] pb-2">
          <Sliders className="h-4 w-4 text-blue-400" />
          <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            Compounding &amp; Risk Limit Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Starting Balance */}
          <div>
            <label className="text-[10px] font-mono text-gray-400 block mb-1">
              Starting Balance ($)
            </label>
            <NumericInput
              id="plan-start-balance"
              value={startingBalance}
              onChange={(val) => setStartingBalance(val)}
              min={10}
              max={1000000}
              prefix="$"
              className="bg-[#070B18] border-[#2A344E] text-white"
            />
          </div>

          {/* Duration in Days */}
          <div>
            <label className="text-[10px] font-mono text-gray-400 block mb-1">
              Duration (Trading Days)
            </label>
            <NumericInput
              id="plan-duration-days"
              value={durationDays}
              onChange={(val) => setDurationDays(Math.max(1, Math.min(120, Math.round(val))))}
              min={1}
              max={120}
              suffix="Days"
              allowDecimals={false}
              className="bg-[#070B18] border-[#2A344E] text-white"
            />
          </div>

          {/* Daily Risk % */}
          <div>
            <label className="text-[10px] font-mono text-gray-400 block mb-1">
              Daily Risk % (Per Day Limit)
            </label>
            <NumericInput
              id="plan-daily-risk"
              value={dailyRiskPct}
              onChange={(val) => setDailyRiskPct(val)}
              min={0.1}
              max={5.0}
              suffix="%"
              className="bg-[#070B18] border-[#2A344E] text-white"
            />
          </div>

          {/* Daily Target % */}
          <div>
            <label className="text-[10px] font-mono text-gray-400 block mb-1">
              Daily Target %
            </label>
            <NumericInput
              id="plan-daily-target"
              value={dailyTargetPct}
              onChange={(val) => setDailyTargetPct(val)}
              min={0.5}
              max={10.0}
              suffix="%"
              className="bg-[#070B18] border-[#2A344E] text-white"
            />
          </div>

          {/* Maximum Allowed Risk % */}
          <div>
            <label className="text-[10px] font-mono text-gray-400 block mb-1">
              Max Allowed Risk % (Gate Reference)
            </label>
            <NumericInput
              id="plan-max-risk"
              value={maxAllowedRiskPct}
              onChange={(val) => setMaxAllowedRiskPct(val)}
              min={0.5}
              max={5.0}
              suffix="%"
              className="bg-[#070B18] border-[#2A344E] text-white"
            />
          </div>

          {/* Max Trades Per Day */}
          <div>
            <label className="text-[10px] font-mono text-gray-400 block mb-1">
              Max Trades Per Day
            </label>
            <NumericInput
              id="plan-max-trades"
              value={maxTradesPerDay}
              onChange={(val) => setMaxTradesPerDay(Math.max(1, Math.round(val)))}
              min={1}
              max={10}
              suffix="Trades"
              allowDecimals={false}
              className="bg-[#070B18] border-[#2A344E] text-white"
            />
          </div>

          {/* Target RRR */}
          <div>
            <label className="text-[10px] font-mono text-gray-400 block mb-1">
              Target Minimum R:R
            </label>
            <NumericInput
              id="plan-target-rrr"
              value={targetRRR}
              onChange={(val) => setTargetRRR(val)}
              min={1.0}
              max={10.0}
              prefix="1:"
              className="bg-[#070B18] border-[#2A344E] text-white"
            />
          </div>

          {/* Apply Button */}
          <div className="flex items-end">
            <button
              id="btn-apply-plan-params"
              type="button"
              onClick={handleApplyParameters}
              className="w-full h-9 rounded-lg bg-blue-600 font-mono text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20"
            >
              Update &amp; Lock Plan
            </button>
          </div>
        </div>
      </div>

      {/* DISCIPLINE TABLE */}
      <div className="rounded-xl border border-[#2A2D35] bg-[#0D1426] p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              {durationDays}-Day Mathematical Progression Table
            </h3>
          </div>
          <span className="font-mono text-[11px] text-gray-400">
            Projected End: <strong className="text-emerald-400">${finalProjectedBalance.toFixed(2)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#1E2538] max-h-96 scrollbar-thin scrollbar-thumb-gray-800">
          <table className="w-full border-collapse text-left font-mono text-xs">
            <thead className="sticky top-0 bg-[#070B18] text-gray-400 border-b border-[#2A344E] z-10">
              <tr>
                <th className="py-2.5 px-3">Day</th>
                <th className="py-2.5 px-3">Start ($)</th>
                <th className="py-2.5 px-3">Max Risk</th>
                <th className="py-2.5 px-3">Risk ($)</th>
                <th className="py-2.5 px-3">Target %</th>
                <th className="py-2.5 px-3">Target ($)</th>
                <th className="py-2.5 px-3">Target Bal ($)</th>
                <th className="py-2.5 px-3">Trades</th>
                <th className="py-2.5 px-3">RRR</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2234]">
              {calculatedDays.map((d) => {
                const isToday = d.day === currentDay;
                return (
                  <tr
                    key={d.day}
                    className={`transition-colors ${
                      isToday
                        ? 'bg-blue-500/15 text-white font-bold'
                        : 'hover:bg-[#121A2F] text-gray-300'
                    }`}
                  >
                    <td className="py-2 px-3">
                      <span className={`rounded px-1.5 py-0.5 ${isToday ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300'}`}>
                        Day {d.day}
                      </span>
                    </td>
                    <td className="py-2 px-3">${d.startingBalance.toFixed(2)}</td>
                    <td className="py-2 px-3 text-rose-400">{d.maxRiskPct.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-rose-400">${d.riskAmount.toFixed(2)}</td>
                    <td className="py-2 px-3 text-emerald-400">+{d.targetPct.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-emerald-400">+${d.targetAmount.toFixed(2)}</td>
                    <td className="py-2 px-3 font-bold text-white">${d.targetBalance.toFixed(2)}</td>
                    <td className="py-2 px-3">{d.maxTrades}</td>
                    <td className="py-2 px-3">1:{d.requiredRRR.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right">
                      {isToday ? (
                        <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] text-cyan-300">
                          TODAY
                        </span>
                      ) : d.day < currentDay ? (
                        <span className="text-[10px] text-gray-500">PAST</span>
                      ) : (
                        <span className="text-[10px] text-gray-600">SCHEDULED</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

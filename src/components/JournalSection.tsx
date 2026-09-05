import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Filter,
  PlusCircle,
  XCircle,
  Eye,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { JournalEntry, TradeOutcome, StrategyType } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface JournalSectionProps {
  entries: JournalEntry[];
  onAddNoTradeLog: (reason: string, notes: string) => void;
  onUpdateEntryOutcome: (id: string, outcome: TradeOutcome) => void;
  onExportCSV: () => void;
}

const NO_TRADE_REASONS = [
  'No valid setup',
  'Outside trading window',
  'Risk too high',
  'Checklist incomplete',
  'Not confident',
  'Emotional state not suitable',
  'No confirmation',
  'Spread too wide',
  'High-impact news upcoming',
];

export const JournalSection: React.FC<JournalSectionProps> = ({
  entries,
  onAddNoTradeLog,
  onUpdateEntryOutcome,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [strategyFilter, setStrategyFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [showNoTradeModal, setShowNoTradeModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(NO_TRADE_REASONS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<JournalEntry | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.noTradeReason || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStrategy = strategyFilter === 'ALL' || entry.strategy === strategyFilter;
    const matchesOutcome = outcomeFilter === 'ALL' || entry.outcome === outcomeFilter;

    return matchesSearch && matchesStrategy && matchesOutcome;
  });

  const handleSaveNoTrade = () => {
    soundEngine.play('data_saved');
    onAddNoTradeLog(selectedReason, customNotes);
    setShowNoTradeModal(false);
    setCustomNotes('');
  };

  return (
    <div className="rounded-lg border border-[#2A2D35] bg-[#1A1D23] p-4 sm:p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#2A2D35] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              TRADING JOURNAL &amp; LOGS
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Disciplined historical ledger &bull; {entries.length} total recorded setups
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* NO TRADE Button */}
          <button
            id="log-no-trade-btn"
            onClick={() => {
              soundEngine.play('button_click');
              setShowNoTradeModal(true);
            }}
            className="flex items-center space-x-1.5 rounded border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 font-mono text-xs font-bold text-orange-300 transition-colors hover:bg-orange-500/20"
          >
            <XCircle className="h-3.5 w-3.5 text-orange-400" />
            <span>LOG NO TRADE</span>
          </button>

          {/* Export CSV Button */}
          <button
            id="export-csv-btn"
            onClick={() => {
              soundEngine.play('button_click');
              onExportCSV();
            }}
            className="flex items-center space-x-1.5 rounded border border-[#2A2D35] bg-[#0F1115] px-3 py-1.5 font-mono text-xs text-gray-300 transition-colors hover:bg-[#252A35] hover:text-white"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search pair, notes, or reasons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border border-[#2A2D35] bg-[#0F1115] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Strategy Filter */}
        <select
          value={strategyFilter}
          onChange={(e) => setStrategyFilter(e.target.value)}
          className="rounded border border-[#2A2D35] bg-[#0F1115] px-2.5 py-1.5 font-mono text-xs text-gray-300 focus:border-blue-500 focus:outline-none"
        >
          <option value="ALL">All Strategies</option>
          <option value="ICT_SILVER_BULLET">ICT Silver Bullet</option>
          <option value="EMA_SWING">9/20 EMA Swing</option>
        </select>

        {/* Outcome Filter */}
        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="rounded border border-[#2A2D35] bg-[#0F1115] px-2.5 py-1.5 font-mono text-xs text-gray-300 focus:border-blue-500 focus:outline-none"
        >
          <option value="ALL">All Outcomes</option>
          <option value="WIN">Win</option>
          <option value="LOSS">Loss</option>
          <option value="BREAKEVEN">Breakeven</option>
          <option value="OPEN">Open</option>
          <option value="NO_TRADE">No Trade</option>
        </select>
      </div>

      {/* Journal Cards List */}
      {filteredEntries.length === 0 ? (
        <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-8 text-center text-gray-500 text-xs">
          No trading entries match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => {
                soundEngine.play('button_click');
                setSelectedDetailEntry(entry);
              }}
              className="group relative cursor-pointer rounded border border-[#2A2D35] bg-[#0F1115] p-3.5 transition-all hover:border-blue-500/40 hover:bg-[#151921] shadow-sm"
            >
              {/* Card Header: Pair, Direction, Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-white">{entry.pair}</span>
                  {!entry.isNoTrade && (
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                        entry.direction === 'LONG'
                          ? 'border border-[#00C853]/30 bg-[#00C853]/10 text-[#00C853]'
                          : 'border border-rose-500/30 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {entry.direction}
                    </span>
                  )}
                </div>

                {/* Outcome Pill */}
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold ${
                    entry.outcome === 'WIN'
                      ? 'bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/40'
                      : entry.outcome === 'LOSS'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : entry.outcome === 'NO_TRADE'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : entry.outcome === 'BREAKEVEN'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  {entry.outcome}
                </span>
              </div>

              {/* Subtitle: Strategy & Session */}
              <div className="mt-2 text-[11px] text-gray-400">
                {entry.isNoTrade ? (
                  <span className="font-medium text-orange-300">
                    Reason: {entry.noTradeReason}
                  </span>
                ) : (
                  <span>
                    {entry.strategy === 'ICT_SILVER_BULLET' ? 'ICT Silver Bullet' : '9/20 EMA Swing'}{' '}
                    &bull; {entry.session}
                  </span>
                )}
              </div>

              {/* Metrics Grid */}
              {!entry.isNoTrade && (
                <div className="mt-3 grid grid-cols-3 gap-1 rounded bg-[#1A1D23] border border-[#2A2D35] p-1.5 font-mono text-[10px] text-gray-300">
                  <div>
                    <span className="text-[8px] text-gray-500">RISK</span>
                    <div className="font-bold text-white">{entry.riskPercentage}%</div>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-500">R:R</span>
                    <div className="font-bold text-blue-400">1:{entry.rrRatio.toFixed(1)}</div>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-500">SIZE</span>
                    <div className="font-bold text-white">
                      {entry.positionSizeLots ? `${entry.positionSizeLots.toFixed(2)}L` : '—'}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer: Date & Time */}
              <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 border-t border-[#2A2D35] pt-2">
                <span>
                  {entry.dateStr} &bull; {entry.timeStr}
                </span>
                <span className="text-blue-400 group-hover:underline">View details &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NO TRADE LOG MODAL */}
      {showNoTradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-lg border border-orange-500/30 bg-[#1A1D23] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2D35] pb-3">
              <div className="flex items-center space-x-2 text-orange-400">
                <XCircle className="h-5 w-5" />
                <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">LOG NO-TRADE DECISION</h3>
              </div>
              <button
                onClick={() => setShowNoTradeModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Acknowledging why you skipped a setup reinforces psychological discipline and prevents
              overtrading.
            </p>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400">DISCIPLINE REASON</label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                {NO_TRADE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400">NOTES (OPTIONAL)</label>
              <textarea
                rows={3}
                placeholder="Market context or session observations..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 text-xs text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowNoTradeModal(false)}
                className="rounded border border-[#2A2D35] px-3 py-1.5 text-xs text-gray-300 hover:bg-[#252A35]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNoTrade}
                className="rounded bg-orange-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-orange-400 shadow"
              >
                Save No-Trade Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedDetailEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-lg border border-[#2A2D35] bg-[#1A1D23] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2A2D35] pb-3">
              <div>
                <span className="font-mono text-[9px] text-blue-400 uppercase font-bold">
                  TRADE RECORD &bull; {selectedDetailEntry.dateStr}
                </span>
                <h3 className="font-mono text-base font-bold text-white">
                  {selectedDetailEntry.pair} Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailEntry(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 rounded border border-[#2A2D35] bg-[#0F1115] p-3 font-mono text-xs">
              <div>
                <span className="text-[9px] text-gray-500 uppercase">STRATEGY</span>
                <div className="text-white font-bold">
                  {selectedDetailEntry.strategy.replace(/_/g, ' ')}
                </div>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase">DIRECTION</span>
                <div className="text-white font-bold">{selectedDetailEntry.direction}</div>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase">ENTRY</span>
                <div className="text-white">{selectedDetailEntry.entryPrice || '—'}</div>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase">STOP LOSS</span>
                <div className="text-rose-400">{selectedDetailEntry.stopLossPrice || '—'}</div>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase">TAKE PROFIT</span>
                <div className="text-[#00C853]">{selectedDetailEntry.takeProfitPrice || '—'}</div>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase">R:R RATIO</span>
                <div className="text-blue-400">1:{selectedDetailEntry.rrRatio.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase">CASH RISK</span>
                <div className="text-white">
                  ${selectedDetailEntry.cashRisk ? selectedDetailEntry.cashRisk.toFixed(2) : '—'}
                </div>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase">POSITION SIZE</span>
                <div className="text-white">
                  {selectedDetailEntry.positionSizeLots
                    ? `${selectedDetailEntry.positionSizeLots.toFixed(2)} Lots`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Note */}
            {selectedDetailEntry.notes && (
              <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-3 text-xs">
                <span className="font-mono text-[9px] text-gray-500 uppercase font-bold">TRADE NOTE</span>
                <p className="mt-1 text-gray-300 leading-relaxed">{selectedDetailEntry.notes}</p>
              </div>
            )}

            {/* Outcome Updater */}
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                UPDATE OUTCOME
              </label>
              <div className="grid grid-cols-5 gap-1 font-mono text-xs">
                {(['OPEN', 'WIN', 'LOSS', 'BREAKEVEN', 'NO_TRADE'] as TradeOutcome[]).map((oc) => (
                  <button
                    key={oc}
                    onClick={() => {
                      soundEngine.play('data_saved');
                      onUpdateEntryOutcome(selectedDetailEntry.id, oc);
                      setSelectedDetailEntry({ ...selectedDetailEntry, outcome: oc });
                    }}
                    className={`rounded py-1.5 font-bold transition-all ${
                      selectedDetailEntry.outcome === oc
                        ? 'bg-blue-600 text-white shadow'
                        : 'border border-[#2A2D35] bg-[#0F1115] text-gray-400 hover:text-white'
                    }`}
                  >
                    {oc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

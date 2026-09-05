import React, { useState, useEffect } from 'react';
import { FileText, Save, ArrowLeft, Check, Copy, Trash2, Sparkles, BookOpen } from 'lucide-react';
import { AppView } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface NotesSectionProps {
  onNavigate: (view: AppView) => void;
  userId?: string | null;
  onSaveNoteToStorage?: (note: string) => void;
  initialNote?: string;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  onNavigate,
  userId,
  onSaveNoteToStorage,
  initialNote = '',
}) => {
  const [note, setNote] = useState<string>(() => {
    return initialNote || localStorage.getItem('trade_gate_user_notes') || '';
  });
  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('trade_gate_user_notes', note);
      if (onSaveNoteToStorage) {
        onSaveNoteToStorage(note);
      }
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 600);
    return () => clearTimeout(timer);
  }, [note, onSaveNoteToStorage]);

  const handleCopy = () => {
    soundEngine.play('button_click');
    navigator.clipboard.writeText(note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (!note.trim()) return;
    if (window.confirm('Clear your trade scratchpad notes?')) {
      soundEngine.play('button_click');
      setNote('');
      localStorage.removeItem('trade_gate_user_notes');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-2 sm:px-4 sm:py-4">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#2A2D35] bg-[#121620] p-4 sm:flex-row sm:items-center sm:justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            id="btn-back-dashboard-notes"
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
                Trader Notes & Scratchpad
              </h1>
              <span className="rounded bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                PRE-MARKET
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Daily session notes, trade thesis & key observations</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {lastSaved && (
            <span className="font-mono text-[11px] text-gray-400">
              Saved at {lastSaved}
            </span>
          )}
        </div>
      </div>

      {/* Daily Golden Discipline Rules */}
      <div className="rounded-xl border border-[#2A2D35] bg-[#0B0E14] p-4 text-xs">
        <div className="flex items-center space-x-2 text-blue-400 font-mono font-bold uppercase tracking-wider mb-2">
          <Sparkles className="h-4 w-4" />
          <span>Core Execution Rules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-300 font-medium text-[11px]">
          <div className="rounded border border-[#2A2D35]/60 bg-[#121620] p-2.5">
            1. Never execute before all checklist steps are confirmed.
          </div>
          <div className="rounded border border-[#2A2D35]/60 bg-[#121620] p-2.5">
            2. Never risk more than your predefined daily loss limit.
          </div>
          <div className="rounded border border-[#2A2D35]/60 bg-[#121620] p-2.5">
            3. Respect Silver Bullet time windows (London 15–16 / NY 20–21 BDT).
          </div>
          <div className="rounded border border-[#2A2D35]/60 bg-[#121620] p-2.5">
            4. If no setup triggers, log a No-Trade entry with pride.
          </div>
        </div>
      </div>

      {/* Scratchpad Textarea */}
      <div className="rounded-xl border border-[#2A2D35] bg-[#121620] p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-[#2A2D35] pb-2.5">
          <div className="flex items-center space-x-2 font-mono text-xs font-bold text-white">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span>Session Observation & Plan</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 rounded border border-[#2A2D35] bg-[#1A1F2C] px-2.5 py-1 text-[11px] text-gray-300 transition-colors hover:text-white"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleClear}
              className="flex items-center space-x-1 rounded border border-red-500/20 bg-red-950/20 px-2.5 py-1 text-[11px] text-red-400 transition-colors hover:bg-red-900/40"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <textarea
          id="notes-scratchpad-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your session prep here... (e.g. DXY trend bias, key liquidity pools, high-impact news times at 18:30 BDT, EURUSD PDH/PDL levels, planned entry models)"
          rows={12}
          className="w-full rounded-lg border border-[#2A2D35] bg-[#0B0E14] p-3.5 font-mono text-xs text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
        />

        <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <span>{note.length} characters</span>
          <span>{userId ? 'Auto-synced with Cloud' : 'Saved locally in browser'}</span>
        </div>
      </div>
    </div>
  );
};

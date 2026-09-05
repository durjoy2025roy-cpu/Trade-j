import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, RefreshCw, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

const SUGGESTED_CHIPS = [
  { label: 'Pip?', prompt: 'What is a pip in Forex and how is its value calculated?' },
  { label: 'Lot Size?', prompt: 'What is a standard lot, mini lot, and micro lot?' },
  { label: 'R:R?', prompt: 'What does 1:2 and 1:3 Risk-to-Reward (R:R) ratio mean?' },
  { label: 'PDH / PDL?', prompt: 'What does Previous Day High (PDH) and Previous Day Low (PDL) mean in market structure?' },
  { label: 'FVG?', prompt: 'What is a Fair Value Gap (FVG) and how is it identified?' },
  { label: 'Session Time?', prompt: 'What time is the London and New York session overlap in Bangladesh time (BST)?' },
];

interface GeminiQuickBoardProps {
  isFirebaseConnected?: boolean;
}

export const GeminiQuickBoard: React.FC<GeminiQuickBoardProps> = ({ isFirebaseConnected = false }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState<boolean | null>(null);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'ai'; text: string; isError?: boolean }>>([
    {
      role: 'ai',
      text: 'Welcome to the Trade Gate Educational Assistant. Ask concise questions on terminology, pips, FVG, session overlaps, or risk math.',
    },
  ]);

  // Check Gemini backend status on mount
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await fetch('/api/gemini/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setGeminiAvailable(Boolean(data.configured));
        } else {
          if (isMounted) setGeminiAvailable(false);
        }
      } catch {
        if (isMounted) setGeminiAvailable(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChipClick = (chipPrompt: string) => {
    soundEngine.play('button_click');
    // Place the question into the input, do NOT automatically send it
    setPrompt(chipPrompt);
  };

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = prompt.trim();
    if (!q || loading) return;

    if (q.length > 500) {
      soundEngine.play('warning');
      setHistory((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Question exceeds maximum length of 500 characters. Please ask a more concise question.',
          isError: true,
        },
      ]);
      return;
    }

    soundEngine.play('button_click');
    setLoading(true);
    setHistory((prev) => [...prev, { role: 'user', text: q }]);
    setPrompt('');

    try {
      const res = await fetch('/api/gemini/quick-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      });

      if (!res.ok) {
        let errorText = 'Gemini is temporarily unavailable.';
        try {
          const errData = await res.json();
          if (errData?.error) {
            errorText = errData.error;
          }
        } catch {}

        if (res.status === 429) {
          errorText = 'Too many requests. Please try again shortly.';
        } else if (res.status === 503) {
          errorText = 'Gemini AI is not configured.';
          setGeminiAvailable(false);
        }

        throw new Error(errorText);
      }

      const data = await res.json();
      soundEngine.play('data_saved');
      setGeminiAvailable(true);
      setHistory((prev) => [...prev, { role: 'ai', text: data.text || 'No response generated.' }]);
    } catch (err: any) {
      soundEngine.play('warning');
      const msg =
        err?.message === 'Failed to fetch'
          ? 'Connection unavailable.'
          : err?.message || 'Gemini is temporarily unavailable.';
      setHistory((prev) => [
        ...prev,
        {
          role: 'ai',
          text: msg,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-[#2A2D35] bg-[#1A1D23] p-4 sm:p-5 shadow-lg space-y-4">
      {/* Header & Status Section (Section 20 requirement) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2D35] pb-3">
        <div className="flex items-center space-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white shadow-sm">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              GEMINI QUICK BOARD
            </h3>
            <p className="text-[10px] text-gray-500">Educational Trading Concept Reference</p>
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="flex items-center space-x-3 text-[9px] font-mono">
          {/* Firebase Status */}
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">FIREBASE:</span>
            {isFirebaseConnected ? (
              <span className="flex items-center text-[#00C853] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00C853] mr-1 animate-pulse" />
                CONNECTED
              </span>
            ) : (
              <span className="flex items-center text-gray-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-500 mr-1" />
                DEMO / OFFLINE
              </span>
            )}
          </div>

          {/* Gemini Status */}
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">GEMINI:</span>
            {geminiAvailable === true ? (
              <span className="flex items-center text-[#00C853] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00C853] mr-1" />
                AVAILABLE
              </span>
            ) : geminiAvailable === false ? (
              <span className="flex items-center text-orange-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 mr-1" />
                UNAVAILABLE
              </span>
            ) : (
              <span className="flex items-center text-gray-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mr-1 animate-ping" />
                CHECKING
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Quick Chips (Section 16: Place question into input, do not auto-send) */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-1 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
          <HelpCircle className="h-3 w-3 text-blue-400" />
          <span>Suggested Questions (click to fill input):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => handleChipClick(chip.prompt)}
              className="rounded border border-[#2A2D35] bg-[#0F1115] px-2.5 py-1 text-[10px] font-mono text-gray-300 transition-colors hover:border-blue-500 hover:text-white"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Output Box */}
      <div className="max-h-60 overflow-y-auto space-y-2.5 rounded border border-[#2A2D35] bg-[#0F1115] p-3 text-xs">
        {history.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2 transition-opacity duration-300 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'ai' && (
              <Sparkles
                className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                  msg.isError ? 'text-red-400' : 'text-blue-400'
                }`}
              />
            )}
            <div
              className={`rounded p-2.5 leading-relaxed text-xs transition-all ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30 max-w-[85%]'
                  : msg.isError
                  ? 'bg-red-950/30 text-red-300 border border-red-500/30 max-w-[90%]'
                  : 'bg-[#1A1D23] text-gray-200 border border-[#2A2D35] max-w-[90%]'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Processing Indicator (Section 17 requirement: "● Gemini is thinking...") */}
        {loading && (
          <div className="flex items-center space-x-2 rounded border border-blue-500/20 bg-blue-950/20 p-2.5 text-xs text-blue-300 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
            <span className="font-mono text-[11px] font-medium">● Gemini is thinking...</span>
          </div>
        )}
      </div>

      {/* Input Box & ASK GEMINI button (Section 15: disabled while processing) */}
      <form onSubmit={handleAsk} className="flex items-center space-x-2">
        <input
          type="text"
          maxLength={500}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a short question (e.g. What is FVG?)..."
          className="flex-1 rounded border border-[#2A2D35] bg-[#0F1115] px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="flex h-8 items-center space-x-1.5 rounded bg-blue-600 px-3 font-mono text-xs font-bold text-white transition-opacity disabled:opacity-40 hover:bg-blue-500 shadow-sm"
        >
          <span>ASK GEMINI</span>
          {loading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
        </button>
      </form>
    </div>
  );
};

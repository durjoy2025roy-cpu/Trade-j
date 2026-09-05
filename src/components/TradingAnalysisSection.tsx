import React, { useState, useRef } from 'react';
import {
  LineChart,
  BarChart3,
  Layers,
  UploadCloud,
  Maximize2,
  Minimize2,
  Sparkles,
  Shield,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Send,
  ExternalLink,
} from 'lucide-react';
import { RiskSettings, TradeParameters, CalculatedRisk } from '../types';
import { soundEngine } from '../utils/soundEngine';
import { TradingViewWidget, mapPairToTradingViewSymbol } from './TradingViewWidget';

interface TradingAnalysisSectionProps {
  parameters?: TradeParameters;
  riskSettings?: RiskSettings;
  calculatedRisk?: CalculatedRisk;
  onNavigate?: (view: any) => void;
  onNavigateChecklist?: (strategy: 'ICT_SILVER_BULLET' | 'EMA_SWING') => void;
  onApplyToGate?: (draft: {
    pair?: string;
    direction?: 'LONG' | 'SHORT';
    entryPrice?: string;
    stopLossPrice?: string;
    takeProfitPrice?: string;
    notes?: string;
  }) => void;
}

const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD', 'US30', 'NAS100'];
const TIMEFRAMES = ['M1', 'M5', 'M15', 'H1', 'H4', '1D'];

export const TradingAnalysisSection: React.FC<TradingAnalysisSectionProps> = ({
  parameters,
  riskSettings,
  calculatedRisk,
  onNavigate,
  onNavigateChecklist,
  onApplyToGate,
}) => {
  const initialPair = parameters?.pair || 'EURUSD';
  const [selectedPair, setSelectedPair] = useState<string>(initialPair);
  const [selectedTf, setSelectedTf] = useState<string>(parameters?.timeframe || 'M5');
  const [selectedDirection, setSelectedDirection] = useState<'LONG' | 'SHORT'>(
    parameters?.direction || 'LONG'
  );
  const [entryPrice, setEntryPrice] = useState<string>(parameters?.entryPrice || '');
  const [stopLossPrice, setStopLossPrice] = useState<string>(parameters?.stopLossPrice || '');
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>(parameters?.takeProfitPrice || '');
  const [analysisNote, setAnalysisNote] = useState<string>(parameters?.tradeNote || '');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [showEma9, setShowEma9] = useState(true);
  const [showEma20, setShowEma20] = useState(true);
  const [showPdhPdl, setShowPdhPdl] = useState(true);
  const [showFvgZone, setShowFvgZone] = useState(true);

  // Screenshot Analysis State
  const [screenshot, setScreenshot] = useState<{
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      soundEngine.play('warning');
      alert('Please upload an image (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: reader.result as string,
        mimeType: file.type,
      });
      setAnalysisResult(null);
      soundEngine.play('data_saved');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeWithAi = async () => {
    if (!screenshot) return;
    setAnalyzing(true);
    soundEngine.play('button_click');

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Analyze this chart for pair ${selectedPair} on timeframe ${selectedTf}. Identify visible PDH/PDL, FVG, MSS, liquidity sweeps, and 9/20 EMA interactions. Remind that manual confirmation is required.`,
          image: {
            mimeType: screenshot.mimeType,
            data: screenshot.base64,
          },
        }),
      });
      const data = await res.json();
      setAnalysisResult(data.text || 'Analysis completed.');
      soundEngine.play('ai_response_ready');
    } catch (err) {
      soundEngine.play('warning');
      setAnalysisResult('Analysis request failed. Please check network connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendToGate = () => {
    if (onApplyToGate) {
      onApplyToGate({
        pair: selectedPair,
        direction: selectedDirection,
        entryPrice,
        stopLossPrice,
        takeProfitPrice,
        notes: analysisNote,
      });
    } else if (onNavigate) {
      onNavigate('DASHBOARD');
    }
  };

  // Safe metrics calculations
  const balance = riskSettings?.accountBalance ?? 10000;
  const riskPct = riskSettings?.riskPercentage ?? 1.0;
  const cashRisk = (balance * (riskPct / 100));
  const displayRR = calculatedRisk?.rrRatio ? calculatedRisk.rrRatio.toFixed(2) : '0.00';
  const displaySlPips = calculatedRisk?.slDistancePips ? calculatedRisk.slDistancePips.toFixed(1) : '0.0';

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-2 sm:px-4 py-2">
      {/* Top Header Card */}
      <div className="flex items-center justify-between rounded-xl border border-[#2A2D35] bg-[#121620] p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              soundEngine.play('button_click');
              if (onNavigate) onNavigate('DASHBOARD');
            }}
            className="flex items-center space-x-1.5 rounded-lg border border-[#2A2D35] bg-[#1A1F2C] px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:text-white hover:border-blue-500"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
            <span>Dashboard</span>
          </button>
          <div>
            <h1 className="font-mono text-base sm:text-lg font-bold text-white">
              Trading Analysis &amp; Visual Structure Workspace
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              Institutional price levels, chart vision review, and setup drafting
            </p>
          </div>
        </div>

        <button
          onClick={handleSendToGate}
          className="flex items-center space-x-2 rounded-lg border border-blue-500/40 bg-blue-600/30 px-3.5 py-1.5 font-mono text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition-all shadow-md shadow-blue-500/10"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Send To Pre-Trade Gate</span>
          <span className="sm:hidden">To Gate</span>
        </button>
      </div>

      {/* Top Controls Bar */}
      <div className="rounded-xl border border-[#2A2D35] bg-[#0D1426] p-3 shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Pair Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] font-mono text-gray-400 mr-1 hidden sm:inline">PAIR:</span>
          {PAIRS.map((pair) => (
            <button
              key={pair}
              onClick={() => {
                setSelectedPair(pair);
                soundEngine.play('tab_switch');
              }}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition-colors ${
                selectedPair === pair
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-[#070B18] text-gray-400 hover:text-white border border-[#1E2638]'
              }`}
            >
              {pair}
            </button>
          ))}
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center space-x-1 overflow-x-auto">
          <span className="text-[11px] font-mono text-gray-400 mr-1 hidden sm:inline">TF:</span>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setSelectedTf(tf);
                soundEngine.play('button_click');
              }}
              className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
                selectedTf === tf
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Technical Overlays Toggle */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <label className="flex items-center space-x-1 text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showEma9}
              onChange={(e) => setShowEma9(e.target.checked)}
              className="accent-blue-500"
            />
            <span className="text-[11px] text-blue-400 font-bold">9 EMA</span>
          </label>
          <label className="flex items-center space-x-1 text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showEma20}
              onChange={(e) => setShowEma20(e.target.checked)}
              className="accent-violet-500"
            />
            <span className="text-[11px] text-violet-400 font-bold">20 EMA</span>
          </label>
          <label className="flex items-center space-x-1 text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showPdhPdl}
              onChange={(e) => setShowPdhPdl(e.target.checked)}
              className="accent-amber-500"
            />
            <span className="text-[11px] text-amber-400">PDH/PDL</span>
          </label>
          <label className="flex items-center space-x-1 text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showFvgZone}
              onChange={(e) => setShowFvgZone(e.target.checked)}
              className="accent-cyan-500"
            />
            <span className="text-[11px] text-cyan-400">FVG</span>
          </label>
        </div>
      </div>

      {/* Main Workspace: Chart Canvas Area & Side Discipline Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Stage & Screenshot Inspection Area (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live Real-Time TradingView Interactive Chart */}
          <div className="rounded-xl border border-[#2A2D35] bg-[#070B18] shadow-xl overflow-hidden flex flex-col">
            {/* Header / Current Pair Meta & Window Controls */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#1A2234] bg-[#0A0F1D] px-3.5 py-2.5 text-xs font-mono gap-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <LineChart className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold text-white text-sm tracking-wide">{selectedPair}</span>
                <span className="text-gray-400">&bull; {selectedTf}</span>
                <span className="flex items-center space-x-1 rounded bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 text-[9px] border border-emerald-500/30 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE TRADINGVIEW</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="flex items-center space-x-1 rounded-lg border border-[#2A344E] bg-[#121826] px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Chart Window'}
                >
                  {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{isFullscreen ? 'Minimize' : 'Expand'}</span>
                </button>

                <a
                  href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(mapPairToTradingViewSymbol(selectedPair))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 rounded-lg border border-[#2A344E] bg-[#121826] px-2 py-1 text-xs text-gray-400 hover:text-blue-300 transition-colors"
                  title="Open in TradingView Web"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="text-[10px] hidden sm:inline">TV Web</span>
                </a>
              </div>
            </div>

            {/* TradingView Live Chart Container */}
            <div className={`w-full transition-all duration-300 ${isFullscreen ? 'h-[720px]' : 'h-[520px]'}`}>
              <TradingViewWidget
                pair={selectedPair}
                timeframe={selectedTf}
                theme="dark"
                height="100%"
                allowSymbolChange={true}
                enableStudies={true}
                className="rounded-none border-0"
              />
            </div>

            {/* Strategy quick checklist jumper buttons */}
            <div className="border-t border-[#1A2234] bg-[#090E1C] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-400 uppercase">Checklist Jump:</span>
                <button
                  onClick={() => {
                    if (onNavigateChecklist) onNavigateChecklist('ICT_SILVER_BULLET');
                    else if (onNavigate) onNavigate('ICT_SILVER_BULLET');
                  }}
                  className="rounded px-2 py-0.5 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30 text-[10px]"
                >
                  ICT Silver Bullet &rarr;
                </button>
                <button
                  onClick={() => {
                    if (onNavigateChecklist) onNavigateChecklist('EMA_SWING');
                    else if (onNavigate) onNavigate('EMA_SWING');
                  }}
                  className="rounded px-2 py-0.5 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border border-violet-500/30 text-[10px]"
                >
                  9/20 EMA Swing &rarr;
                </button>
              </div>

              <div className="text-[10px] text-gray-500">
                <span>Rule Engine: Synchronized with Pre-Trade Gate</span>
              </div>
            </div>
          </div>

          {/* Screenshot Upload & Durjoy AI Vision Inspection */}
          <div className="rounded-xl border border-[#2A2D35] bg-[#0D1426] p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#1E2538] pb-2">
              <div className="flex items-center space-x-2">
                <UploadCloud className="h-4 w-4 text-cyan-400" />
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Chart Screenshot Analysis (Durjoy AI Vision)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-gray-400">PNG / JPG / WEBP</span>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
                screenshot
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : 'border-[#2A344E] hover:border-blue-400/50 bg-[#070B18]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="workspace-screenshot-input"
              />

              {screenshot ? (
                <div className="flex flex-col items-center space-y-2">
                  <img
                    src={screenshot.previewUrl}
                    alt="Uploaded chart preview"
                    className="max-h-40 rounded border border-blue-500/30 object-contain shadow-md"
                  />
                  <span className="font-mono text-xs font-bold text-white">
                    {screenshot.file.name} ({(screenshot.file.size / 1024).toFixed(1)} KB)
                  </span>
                  <p className="text-[11px] text-gray-400">Tap to replace image</p>
                </div>
              ) : (
                <div className="space-y-1.5 py-3">
                  <UploadCloud className="mx-auto h-8 w-8 text-gray-500" />
                  <p className="font-mono text-xs text-gray-300 font-bold">
                    Drag and drop your chart screenshot, or tap to browse
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Upload TradingView setups, entry frames, or marked charts for AI structural review
                  </p>
                </div>
              )}
            </div>

            {screenshot && (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAnalyzeWithAi}
                  disabled={analyzing}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 font-mono text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{analyzing ? 'Analyzing Chart...' : 'Analyze with Durjoy AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setScreenshot(null);
                    setAnalysisResult(null);
                  }}
                  className="text-xs text-gray-400 hover:text-rose-400 font-mono"
                >
                  Clear Image
                </button>
              </div>
            )}

            {/* Analysis Output */}
            {analysisResult && (
              <div className="rounded-lg border border-blue-500/30 bg-[#090E1C] p-3 text-xs space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-blue-300 font-mono text-[11px] border-b border-white/5 pb-1">
                  <span>DURJOY AI VISION FEEDBACK</span>
                  <span className="text-[9px] text-amber-400">MANUAL CONFIRMATION REQUIRED</span>
                </div>
                <div className="text-gray-200 whitespace-pre-wrap leading-relaxed font-normal">
                  {analysisResult}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Discipline & Positioning Panel (Col 3) */}
        <div className="space-y-4">
          {/* Setup Drafting Card */}
          <div className="rounded-xl border border-[#2A2D35] bg-[#0D1426] p-4 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 border-b border-[#1E2538] pb-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Setup Parameters Draft
              </h4>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {/* Direction Selection */}
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                  DIRECTION
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDirection('LONG');
                      soundEngine.play('button_click');
                    }}
                    className={`rounded-lg py-1.5 font-bold transition-colors ${
                      selectedDirection === 'LONG'
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                        : 'bg-[#070B18] text-gray-400 border border-[#1E2538]'
                    }`}
                  >
                    LONG / BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDirection('SHORT');
                      soundEngine.play('button_click');
                    }}
                    className={`rounded-lg py-1.5 font-bold transition-colors ${
                      selectedDirection === 'SHORT'
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                        : 'bg-[#070B18] text-gray-400 border border-[#1E2538]'
                    }`}
                  >
                    SHORT / SELL
                  </button>
                </div>
              </div>

              {/* Entry Price */}
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                  ENTRY PRICE
                </label>
                <input
                  type="text"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="e.g. 1.08500"
                  className="w-full rounded-lg border border-[#1E2538] bg-[#070B18] px-3 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Stop Loss Price */}
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                  STOP LOSS PRICE
                </label>
                <input
                  type="text"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  placeholder="e.g. 1.08300"
                  className="w-full rounded-lg border border-[#1E2538] bg-[#070B18] px-3 py-1.5 text-white font-mono focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Take Profit Price */}
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                  TAKE PROFIT PRICE
                </label>
                <input
                  type="text"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  placeholder="e.g. 1.08950"
                  className="w-full rounded-lg border border-[#1E2538] bg-[#070B18] px-3 py-1.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Setup Note */}
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                  SETUP NOTE / BIAS
                </label>
                <textarea
                  value={analysisNote}
                  onChange={(e) => setAnalysisNote(e.target.value)}
                  placeholder="e.g. PDL sweep in London session, MSS on M1 with FVG retest."
                  rows={2}
                  className="w-full rounded-lg border border-[#1E2538] bg-[#070B18] px-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={handleSendToGate}
                className="w-full flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 font-mono text-xs font-bold text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md shadow-blue-500/20"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Apply Setup To Pre-Trade Gate</span>
              </button>
            </div>
          </div>

          {/* Active Risk Summary Card */}
          <div className="rounded-xl border border-[#2A2D35] bg-[#0D1426] p-4 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 border-b border-[#1E2538] pb-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Risk &amp; Lots Guard
              </h4>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[#1A2234]">
                <span className="text-gray-400">Account Balance</span>
                <span className="font-bold text-white">${balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1A2234]">
                <span className="text-gray-400">Risk %</span>
                <span className="font-bold text-rose-400">{riskPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1A2234]">
                <span className="text-gray-400">Cash at Risk</span>
                <span className="font-bold text-rose-400">${cashRisk.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1A2234]">
                <span className="text-gray-400">SL Distance</span>
                <span className="font-bold text-white">{displaySlPips} Pips</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1A2234]">
                <span className="text-gray-400">Target RRR</span>
                <span className="font-bold text-cyan-300">1:{displayRR}</span>
              </div>
            </div>
          </div>

          {/* Institutional Reminders */}
          <div className="rounded-xl border border-blue-500/20 bg-[#090E1D] p-4 shadow-lg space-y-2.5">
            <h4 className="font-mono text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>Execution Windows (BST)</span>
            </h4>
            <div className="space-y-1.5 text-[11px] text-gray-300 font-mono">
              <div className="p-1.5 rounded bg-[#070B18] border border-[#1E2538]">
                <span className="text-cyan-400 font-bold block">London Silver Bullet</span>
                03:00 PM &ndash; 04:00 PM BST
              </div>
              <div className="p-1.5 rounded bg-[#070B18] border border-[#1E2538]">
                <span className="text-violet-400 font-bold block">NY Silver Bullet</span>
                08:00 PM &ndash; 09:00 PM BST
              </div>
              <div className="p-1.5 rounded bg-[#070B18] border border-[#1E2538]">
                <span className="text-emerald-400 font-bold block">9/20 EMA Swing</span>
                H4 Trend + H1 Pullback Entry
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

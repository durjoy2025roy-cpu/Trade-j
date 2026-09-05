import React from 'react';
import { Clock, Globe, Zap } from 'lucide-react';
import { MarketSessionInfo, SilverBulletWindowInfo } from '../utils/timeAndSessions';

interface SessionMonitorProps {
  bangladeshTime: string;
  bangladeshDate: string;
  indiaTime: string;
  indiaDate: string;
  londonTime: string;
  londonDate: string;
  newYorkTime: string;
  newYorkDate: string;
  sessions: MarketSessionInfo[];
  silverBullet: {
    isInsideAnyWindow: boolean;
    windows: SilverBulletWindowInfo[];
    activeWindowText: string;
  };
}

export const SessionMonitor: React.FC<SessionMonitorProps> = ({
  bangladeshTime,
  bangladeshDate,
  indiaTime,
  indiaDate,
  londonTime,
  londonDate,
  newYorkTime,
  newYorkDate,
  sessions,
  silverBullet,
}) => {
  return (
    <div className="space-y-4">
      {/* 5. LIVE TIMEZONE BOARD */}
      <div className="rounded-lg border border-[#2A2D35] bg-[#1A1D23] p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              GLOBAL TIME ZONES
            </h3>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">IANA LIVE ENGINE</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {/* Bangladesh */}
          <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-2.5 transition-colors hover:border-blue-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                BANGLADESH
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-white">{bangladeshTime}</div>
            <div className="text-[10px] text-gray-500 truncate">{bangladeshDate}</div>
          </div>

          {/* India */}
          <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-2.5 transition-colors hover:border-blue-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">INDIA</span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-white">{indiaTime}</div>
            <div className="text-[10px] text-gray-500 truncate">{indiaDate}</div>
          </div>

          {/* London */}
          <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-2.5 transition-colors hover:border-blue-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">LONDON</span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-white">{londonTime}</div>
            <div className="text-[10px] text-gray-500 truncate">{londonDate}</div>
          </div>

          {/* New York */}
          <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-2.5 transition-colors hover:border-blue-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                NEW YORK
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-white">{newYorkTime}</div>
            <div className="text-[10px] text-gray-500 truncate">{newYorkDate}</div>
          </div>
        </div>
      </div>

      {/* 6. SESSION MONITOR & SILVER BULLET WINDOWS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Session Progress Cards */}
        {sessions.map((sess) => (
          <div
            key={sess.id}
            className={`relative overflow-hidden rounded-lg border p-4 transition-all ${
              sess.isOpen
                ? 'border-blue-500/40 bg-[#1A1D23] shadow-sm'
                : 'border-[#2A2D35] bg-[#1A1D23]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {sess.name}
              </span>
              <span
                className={`flex items-center space-x-1.5 rounded px-2 py-0.5 text-[10px] font-bold ${
                  sess.isOpen
                    ? 'border border-[#00C853]/40 bg-[#00C853]/15 text-[#00C853]'
                    : 'border border-[#2A2D35] bg-[#0F1115] text-gray-400'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    sess.isOpen ? 'bg-[#00C853] animate-pulse' : 'bg-gray-500'
                  }`}
                />
                <span>{sess.isOpen ? 'OPEN' : 'CLOSED'}</span>
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between text-[11px]">
              <span className="text-gray-400">
                {sess.startFormatted} &ndash; {sess.endFormatted}
              </span>
              <span className="font-mono text-white font-medium">
                {sess.timeRemainingStr}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[#2A2D35]">
              <div
                className={`h-full transition-all duration-1000 ${
                  sess.isOpen
                    ? 'bg-blue-500'
                    : 'bg-gray-700'
                }`}
                style={{ width: `${sess.progressPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Silver Bullet Banner */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-xs transition-colors ${
          silverBullet.isInsideAnyWindow
            ? 'border-blue-500/40 bg-blue-950/20 text-blue-200'
            : 'border-[#2A2D35] bg-[#1A1D23] text-gray-400'
        }`}
      >
        <div className="flex items-center space-x-2">
          <Zap
            className={`h-4 w-4 ${
              silverBullet.isInsideAnyWindow ? 'text-blue-400 animate-pulse' : 'text-gray-500'
            }`}
          />
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            SILVER BULLET WINDOW:
          </span>
          <span
            className={
              silverBullet.isInsideAnyWindow ? 'text-blue-300 font-medium' : 'text-gray-400'
            }
          >
            {silverBullet.activeWindowText}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          {silverBullet.windows.map((w) => (
            <span
              key={w.session}
              className={`rounded px-2 py-0.5 font-mono ${
                w.isInsideWindow
                  ? 'border border-blue-400/40 bg-blue-400/10 text-blue-300 font-semibold'
                  : 'bg-[#0F1115] border border-[#2A2D35] text-gray-400'
              }`}
            >
              {w.session} ({w.windowStart}–{w.windowEnd}): {w.timeUntilOrRemaining}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

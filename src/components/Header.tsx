import React from 'react';
import {
  Volume2,
  VolumeX,
  Settings,
  ShieldCheck,
  Radio,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Clock,
  User as UserIcon,
  LogIn,
  LineChart,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { soundEngine } from '../utils/soundEngine';

interface HeaderProps {
  bangladeshTime: string;
  bangladeshDate: string;
  indiaTime: string;
  londonTime: string;
  newYorkTime: string;
  activeSession: string;
  isOnline: boolean;
  saveStatus: 'SAVED' | 'SAVING' | 'OFFLINE';
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  soundVolume: number;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
  onOpenTradingViewModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  bangladeshTime,
  bangladeshDate,
  indiaTime,
  londonTime,
  newYorkTime,
  activeSession,
  isOnline,
  saveStatus,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  soundVolume,
  currentUser,
  onOpenAuthModal,
  onOpenTradingViewModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2A2D35] bg-[#15181E]/95 backdrop-blur-md">
      {/* Top Primary Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-bold text-white shadow-md shadow-blue-600/30">
            TG
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-sans text-base sm:text-lg font-bold tracking-tight text-white">
                TRADE GATE <span className="text-blue-500">PRO</span>
              </span>
              <span className="hidden rounded bg-[#252A35] px-1.5 py-0.5 text-[9px] font-mono font-semibold text-gray-400 sm:inline-block border border-[#2A2D35]">
                DISCIPLINE v2.4
              </span>
            </div>
            <p className="text-[10px] font-medium tracking-wide text-gray-400">
              PRE-TRADE PROTOCOL &bull; THINK. CONFIRM. CONTROL.
            </p>
          </div>
        </div>

        {/* Live Market Clocks (Desktop / Tablet) */}
        <div className="hidden items-center space-x-4 lg:flex">
          {/* Bangladesh */}
          <div className="flex flex-col items-end border-r border-[#2A2D35] pr-4">
            <div className="flex items-center space-x-1.5">
              <Clock className="h-3 w-3 text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Dhaka
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-gray-200">{bangladeshTime}</span>
          </div>

          {/* London */}
          <div className="flex flex-col items-end border-r border-[#2A2D35] pr-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              London
            </span>
            <span className="font-mono text-xs font-bold text-gray-200">{londonTime}</span>
          </div>

          {/* New York */}
          <div className="flex flex-col items-end border-r border-[#2A2D35] pr-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              New York
            </span>
            <span className="font-mono text-xs font-bold text-gray-200">{newYorkTime}</span>
          </div>

          {/* Active Session Pill */}
          <div className="flex items-center space-x-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-blue-400 uppercase">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            <span>{activeSession}</span>
          </div>
        </div>

        {/* Right Controls: Connection, Sync, Sound Toggle, Auth/Profile, Settings */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Connection Status */}
          <div
            title={isOnline ? 'Network Online' : 'Operating in Offline Mode'}
            className="flex items-center space-x-1.5 rounded bg-[#1A1D23] border border-[#2A2D35] px-2 py-1 text-[10px] text-gray-300"
          >
            {isOnline ? (
              <>
                <span className="h-2 w-2 rounded-full bg-[#00C853] shadow-[0_0_8px_rgba(0,200,83,0.6)]" />
                <span className="hidden sm:inline font-mono font-bold text-gray-300">ONLINE</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-[#FF9100]" />
                <span className="hidden sm:inline font-mono font-bold text-orange-400">OFFLINE</span>
              </>
            )}
          </div>

          {/* Sync Status Indicator */}
          <div
            className="hidden items-center space-x-1.5 rounded bg-[#1A1D23] border border-[#2A2D35] px-2 py-1 text-[10px] text-gray-400 md:flex"
            title="Auto-save state"
          >
            {saveStatus === 'SAVING' ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
                <span className="font-mono text-[9px] text-blue-400 uppercase font-bold">SAVING...</span>
              </>
            ) : saveStatus === 'SAVED' ? (
              <>
                <CloudCheck className="h-3.5 w-3.5 text-[#00C853]" />
                <span className="font-mono text-[9px] text-[#00C853] uppercase font-bold">
                  {currentUser ? 'FIRESTORE ✓' : 'SYNCED ✓'}
                </span>
              </>
            ) : (
              <>
                <CloudOff className="h-3.5 w-3.5 text-orange-400" />
                <span className="font-mono text-[9px] text-orange-400 uppercase font-bold">LOCAL</span>
              </>
            )}
          </div>

          {/* SOUND TOGGLE BUTTON */}
          <button
            id="sound-toggle-btn"
            onClick={() => {
              onToggleSound();
              soundEngine.play('button_click');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
              soundEnabled
                ? 'bg-[#1A1D23] border border-[#3D85FF]/40 text-blue-400 hover:bg-[#252A35] shadow-[0_0_12px_rgba(61,133,255,0.15)]'
                : 'bg-[#1A1D23] border border-[#2A2D35] text-gray-500 hover:bg-[#252A35] hover:text-gray-300'
            }`}
            title={soundEnabled ? `Sound ON (${Math.round(soundVolume * 100)}%)` : 'Sound OFF (Muted)'}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-blue-400" />
                <span className="hidden md:inline font-mono text-[10px] font-bold tracking-wider text-blue-300">
                  ON
                </span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-gray-500" />
                <span className="hidden md:inline font-mono text-[10px] font-bold tracking-wider text-gray-500">
                  OFF
                </span>
              </>
            )}
          </button>

          {/* User Profile / Auth Button */}
          {currentUser ? (
            <button
              onClick={() => {
                soundEngine.play('button_click');
                onOpenSettings();
              }}
              title={`Logged in as ${currentUser.email}`}
              className="flex items-center space-x-1.5 rounded border border-[#2A2D35] bg-[#1A1D23] px-2.5 py-1.5 font-mono text-xs text-gray-300 hover:border-blue-500 hover:text-white"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                {(currentUser.email || 'U')[0].toUpperCase()}
              </div>
              <span className="hidden xl:inline max-w-[90px] truncate text-[11px]">
                {currentUser.email?.split('@')[0]}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#00C853]" />
            </button>
          ) : (
            <button
              onClick={() => {
                soundEngine.play('button_click');
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              title="Sign in for Cloud Firestore synchronization"
              className="flex items-center space-x-1 rounded border border-blue-500/40 bg-blue-600/10 px-2.5 py-1.5 font-mono text-[11px] font-bold text-blue-300 hover:bg-blue-600/20"
            >
              <LogIn className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">SIGN IN</span>
            </button>
          )}

          {/* TRADINGVIEW LIVE WINDOW TRIGGER */}
          <button
            id="tradingview-window-btn"
            onClick={() => {
              soundEngine.play('button_click');
              if (onOpenTradingViewModal) onOpenTradingViewModal();
            }}
            title="Open Live TradingView Chart Window (Pop-out)"
            className="flex items-center space-x-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 px-2.5 py-1.5 font-mono text-[11px] font-bold text-cyan-300 hover:border-cyan-400 hover:text-white transition-all shadow-sm shadow-cyan-500/10"
          >
            <LineChart className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">TRADINGVIEW</span>
            <span className="sm:hidden">CHART</span>
          </button>

          {/* Settings Trigger */}
          <button
            id="settings-open-btn"
            onClick={() => {
              soundEngine.play('button_click');
              onOpenSettings();
            }}
            aria-label="Open Settings"
            className="rounded border border-[#2A2D35] bg-[#1A1D23] p-1.5 text-gray-400 hover:border-[#3A3F4B] hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar for Mobile: Dhaka, London, NY Clocks */}
      <div className="flex items-center justify-between border-t border-[#2A2D35] bg-[#0F1115] px-4 py-1 text-[11px] font-mono text-gray-400 lg:hidden">
        <div className="flex items-center space-x-1">
          <span className="text-gray-500 font-bold">Dhaka:</span>
          <span className="text-white">{bangladeshTime}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-500 font-bold">London:</span>
          <span>{londonTime}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-500 font-bold">NY:</span>
          <span>{newYorkTime}</span>
        </div>
      </div>
    </header>
  );
};

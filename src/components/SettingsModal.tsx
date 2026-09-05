import React, { useState } from 'react';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Shield,
  Clock,
  ExternalLink,
  Download,
  Upload,
  Database,
  CheckCircle2,
  User as UserIcon,
  LogIn,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { AppSettings } from '../types';
import { soundEngine, SoundEvent } from '../utils/soundEngine';
import { logoutUser } from '../utils/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onExportSettings: () => void;
  onImportSettings: (jsonStr: string) => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onExportSettings,
  onImportSettings,
  currentUser,
  onOpenAuthModal,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'SOUND' | 'RISK' | 'TIME' | 'FIREBASE'>('SOUND');

  if (!isOpen) return null;

  const handleSoundToggle = (enabled: boolean) => {
    soundEngine.setSoundEnabled(enabled);
    setLocalSettings((prev) => ({ ...prev, soundEnabled: enabled }));
    if (enabled) {
      soundEngine.play('button_click');
    }
  };

  const handleVolumeChange = (volPercent: number) => {
    const vol = volPercent / 100;
    soundEngine.setVolume(vol);
    setLocalSettings((prev) => ({ ...prev, soundVolume: vol }));
  };

  const testSound = (evt: SoundEvent) => {
    soundEngine.play(evt);
  };

  const handleSaveAll = () => {
    soundEngine.play('data_saved');
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-lg border border-[#2A2D35] bg-[#1A1D23] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2D35] pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-blue-400" />
            <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              TERMINAL SETTINGS &amp; SOUND SYSTEM
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-[#252A35] hover:text-white"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-[#2A2D35] pb-2 text-xs font-mono font-semibold">
          {[
            { id: 'SOUND' as const, label: 'SOUND EFFECTS' },
            { id: 'RISK' as const, label: 'RISK & RULES' },
            { id: 'TIME' as const, label: 'WINDOWS & TIME' },
            { id: 'FIREBASE' as const, label: 'FIREBASE & DATA' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.play('tab_switch');
                setActiveTab(tab.id);
              }}
              className={`rounded px-3 py-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SOUND EFFECTS */}
        {activeTab === 'SOUND' && (
          <div className="space-y-4 text-xs">
            <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-4 space-y-4">
              {/* Sound ON/OFF Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-sm font-bold text-white">
                    UI AUDIO MICRO-FEEDBACK
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Synthesized browser oscillator feedback for gate transitions, alerts, and approvals.
                  </p>
                </div>
                <button
                  id="settings-sound-master-toggle"
                  onClick={() => handleSoundToggle(!localSettings.soundEnabled)}
                  className={`flex items-center space-x-2 rounded px-3 py-2 font-mono text-xs font-bold transition-all ${
                    localSettings.soundEnabled
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'border border-[#2A2D35] bg-[#1A1D23] text-gray-400'
                  }`}
                >
                  {localSettings.soundEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4 text-white" />
                      <span>SOUND ACTIVE</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4 text-gray-500" />
                      <span>MUTED</span>
                    </>
                  )}
                </button>
              </div>

              {/* Master Volume Slider */}
              <div className="space-y-2 border-t border-[#2A2D35] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    MASTER SOUND VOLUME
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-400">
                    {Math.round(localSettings.soundVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={!localSettings.soundEnabled}
                  value={Math.round(localSettings.soundVolume * 100)}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded bg-[#2A2D35] accent-blue-500 disabled:opacity-30"
                />
              </div>
            </div>

            {/* Sound Audition Matrix */}
            <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-4 space-y-3">
              <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                AUDITION SOUND MATRIX
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: 'gate_approved' as const, label: 'Gate Approved' },
                  { id: 'tab_switch' as const, label: 'Tab Switch' },
                  { id: 'gate_locked' as const, label: 'Gate Locked' },
                  { id: 'approval_expired' as const, label: 'Timeout Expired' },
                  { id: 'checkbox_check' as const, label: 'Check Box' },
                  { id: 'button_click' as const, label: 'Button Click' },
                  { id: 'warning' as const, label: 'Risk Warning' },
                  { id: 'data_saved' as const, label: 'Data Saved' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => testSound(s.id)}
                    className="flex items-center justify-between rounded border border-[#2A2D35] bg-[#1A1D23] px-2.5 py-1.5 text-[11px] font-mono text-gray-300 hover:border-blue-500 hover:text-white"
                  >
                    <span>{s.label}</span>
                    <Play className="h-3 w-3 text-blue-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RISK & RULES */}
        {activeTab === 'RISK' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400">DEFAULT RISK %</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.defaultRiskPercentage}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      defaultRiskPercentage: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400">MAX ALLOWED RISK %</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.maxAllowedRiskPercentage}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      maxAllowedRiskPercentage: parseFloat(e.target.value) || 2,
                    })
                  }
                  className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400">DAILY LOSS LIMIT %</label>
                <input
                  type="number"
                  step="0.5"
                  value={localSettings.dailyLossLimit}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      dailyLossLimit: parseFloat(e.target.value) || 4,
                    })
                  }
                  className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400">MAX TRADES PER DAY</label>
                <input
                  type="number"
                  value={localSettings.maxTradesPerDay}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      maxTradesPerDay: parseInt(e.target.value, 10) || 3,
                    })
                  }
                  className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400">SILVER BULLET MIN R:R</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.silverBulletMinRR}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      silverBulletMinRR: parseFloat(e.target.value) || 2.0,
                    })
                  }
                  className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400">9/20 EMA SWING MIN R:R</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.emaSwingMinRR}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      emaSwingMinRR: parseFloat(e.target.value) || 3.0,
                    })
                  }
                  className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400">BROKER / TRADING TERMINAL URL</label>
              <input
                type="text"
                value={localSettings.brokerUrl}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    brokerUrl: e.target.value,
                  })
                }
                placeholder="https://www.tradingview.com"
                className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 3: WINDOWS & TIME */}
        {activeTab === 'TIME' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400">LONDON SILVER BULLET START</label>
                <input
                  type="text"
                  value={localSettings.londonWindowStart}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, londonWindowStart: e.target.value })
                  }
                  placeholder="15:00"
                  className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400">LONDON SILVER BULLET END</label>
                <input
                  type="text"
                  value={localSettings.londonWindowEnd}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, londonWindowEnd: e.target.value })
                  }
                  placeholder="16:00"
                  className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400">NEW YORK SILVER BULLET START</label>
                <input
                  type="text"
                  value={localSettings.nyWindowStart}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, nyWindowStart: e.target.value })
                  }
                  placeholder="20:00"
                  className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400">NEW YORK SILVER BULLET END</label>
                <input
                  type="text"
                  value={localSettings.nyWindowEnd}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, nyWindowEnd: e.target.value })
                  }
                  placeholder="21:00"
                  className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400">APPROVAL EXPIRATION (SECONDS)</label>
              <input
                type="number"
                value={localSettings.approvalExpirationSeconds}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    approvalExpirationSeconds: parseInt(e.target.value, 10) || 600,
                  })
                }
                className="mt-1 w-full rounded border border-[#2A2D35] bg-[#0F1115] p-2 font-mono text-white focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-gray-500">
                Default: 600s (10 minutes) countdown before Gate auto-locks.
              </span>
            </div>
          </div>
        )}

        {/* TAB 4: FIREBASE & DATA (Section 2, 3, 4, 23 requirements) */}
        {activeTab === 'FIREBASE' && (
          <div className="space-y-4 text-xs">
            {/* User Account / Workspace Status */}
            <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-blue-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    USER WORKSPACE
                  </span>
                </div>
                {currentUser ? (
                  <span className="flex items-center space-x-1 rounded bg-green-500/10 border border-green-500/30 px-2 py-0.5 text-[9px] font-mono text-[#00C853] font-bold">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>AUTHENTICATED</span>
                  </span>
                ) : (
                  <span className="rounded bg-gray-800 border border-[#2A2D35] px-2 py-0.5 text-[9px] font-mono text-gray-400">
                    DEMO MODE (OFFLINE CACHE)
                  </span>
                )}
              </div>

              {currentUser ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-300">
                    Logged in as: <strong className="text-white">{currentUser.email}</strong>
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    User UID: {currentUser.uid}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Your checklists, risk drafts, trading journal, and no-trade logs are automatically synced
                    to private Cloud Firestore under <code className="text-blue-400">users/{currentUser.uid}</code>.
                  </p>
                  <div className="pt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        logoutUser();
                        soundEngine.play('button_click');
                      }}
                      className="flex items-center space-x-1.5 rounded bg-red-600/80 hover:bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    You are currently operating in <strong>Demo Mode</strong>. Your data is stored locally in
                    your browser’s storage cache. Sign in or create a free account to enable cloud persistence across devices.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuthModal();
                      }}
                      className="flex items-center space-x-1.5 rounded bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Sign In / Create Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reference Configuration (Section 23) */}
            <div className="rounded border border-[#2A2D35] bg-[#0F1115] p-3 space-y-2 font-mono text-[10px]">
              <div className="flex items-center justify-between text-gray-400 font-bold uppercase tracking-wider">
                <span>FIREBASE WEB APP CONFIGURATION</span>
                <span className="text-blue-400">ACTIVE PROJECT</span>
              </div>
              <pre className="overflow-x-auto rounded bg-black/40 p-2 text-gray-300">
{`const firebaseConfig = {
  projectId: "tactile-botany-vdw77",
  authDomain: "tactile-botany-vdw77.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-tradegate-41047552-4f01-403b-bc6a-afdafec76742",
  storageBucket: "tactile-botany-vdw77.firebasestorage.app"
};`}
              </pre>
            </div>

            {/* Export & Import Backup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-gray-400">BACKUP SETTINGS (JSON)</label>
                <button
                  type="button"
                  onClick={onExportSettings}
                  className="w-full flex items-center justify-center space-x-1.5 rounded border border-[#2A2D35] bg-[#0F1115] px-3 py-2 text-gray-300 hover:bg-[#252A35] hover:text-white"
                >
                  <Download className="h-3.5 w-3.5 text-blue-400" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-gray-400">IMPORT SETTINGS JSON</label>
                <div className="flex space-x-1">
                  <input
                    type="text"
                    placeholder="Paste JSON..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="flex-1 rounded border border-[#2A2D35] bg-[#0F1115] px-2 py-1.5 text-xs font-mono text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  {importText && (
                    <button
                      type="button"
                      onClick={() => {
                        onImportSettings(importText);
                        setImportText('');
                      }}
                      className="rounded bg-blue-600 px-2.5 py-1.5 text-white font-bold hover:bg-blue-500 text-xs font-mono"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 border-t border-[#2A2D35] pt-4">
          <button
            onClick={onClose}
            className="rounded border border-[#2A2D35] px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-[#252A35]"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="rounded bg-blue-600 px-5 py-2 font-mono text-xs font-bold text-white shadow hover:bg-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

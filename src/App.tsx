import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { User } from 'firebase/auth';
import { Header } from './components/Header';
import { SessionMonitor } from './components/SessionMonitor';
import { ConfirmationSection } from './components/ConfirmationSection';
import { RiskSection } from './components/RiskSection';
import { PreTradeGate } from './components/PreTradeGate';
import { JournalSection } from './components/JournalSection';
import { GeminiQuickBoard } from './components/GeminiQuickBoard';
import { TodayDashboard } from './components/TodayDashboard';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { MobileNav } from './components/MobileNav';
import { NavigationTabs } from './components/NavigationTabs';
import { DashboardStrategyLauncher } from './components/DashboardStrategyLauncher';
import { SilverBulletChecklistPage } from './components/SilverBulletChecklistPage';
import { EmaSwingChecklistPage } from './components/EmaSwingChecklistPage';
import { NotesSection } from './components/NotesSection';
import { TradingAnalysisSection } from './components/TradingAnalysisSection';
import { CompoundingPlanSection } from './components/CompoundingPlanSection';
import { DurjoyAiSection } from './components/DurjoyAiSection';
import { TradingViewModal } from './components/TradingViewModal';

import {
  StrategyType,
  ChecklistItem,
  TradeParameters,
  ManualConfirmations,
  RiskSettings,
  CalculatedRisk,
  JournalEntry,
  AppSettings,
  TradeOutcome,
  AppView,
  CompoundingPlan,
} from './types';
import { getDefaultChecklist } from './utils/strategiesData';
import { evaluateGate } from './utils/gatekeeper';
import {
  formatTimeInZone,
  formatDateInZone,
  getMarketSessions,
  getSilverBulletStatus,
} from './utils/timeAndSessions';
import { soundEngine } from './utils/soundEngine';
import { exportJournalToCsv } from './utils/csvExport';
import {
  subscribeToAuthChanges,
  saveUserDraft,
  loadUserDraft,
  saveUserSettings,
  loadUserSettings,
  saveJournalEntryToFirestore,
  updateJournalEntryInFirestore,
  subscribeUserJournal,
  saveNoTradeLogToFirestore,
  saveCompoundingPlanToFirestore,
  fetchCompoundingPlanFromFirestore,
} from './utils/firebase';
import { ArrowLeft, LineChart, Maximize2 } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  defaultRiskPercentage: 1.0,
  maxAllowedRiskPercentage: 2.0,
  dailyLossLimit: 4.0,
  maxTradesPerDay: 3,
  silverBulletMinRR: 2.0,
  emaSwingMinRR: 3.0,
  approvalExpirationSeconds: 600, // 10 minutes
  accountBalance: 10000,
  currency: 'USD',
  londonWindowStart: '15:00',
  londonWindowEnd: '16:00',
  nyWindowStart: '20:00',
  nyWindowEnd: '21:00',
  brokerUrl: 'https://www.tradingview.com',
  animationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.35,
};

export default function App() {
  // Navigation View
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // TradingView Popup Window State
  const [isTradingViewModalOpen, setIsTradingViewModalOpen] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('trade_gate_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return soundEngine.isSoundEnabled();
  });

  const [soundVolume, setSoundVolume] = useState<number>(() => {
    return soundEngine.getVolume();
  });

  // Strategy & Checklist State (Independent 5-step and 4-step checklists)
  const [strategy, setStrategy] = useState<StrategyType>('ICT_SILVER_BULLET');

  const [silverBulletChecklist, setSilverBulletChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem('trade_gate_checklist_ICT_SILVER_BULLET');
      if (saved) {
        const parsed: ChecklistItem[] = JSON.parse(saved);
        if (parsed.length === 5) return parsed;
      }
    } catch {}
    return getDefaultChecklist('ICT_SILVER_BULLET');
  });

  const [emaSwingChecklist, setEmaSwingChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem('trade_gate_checklist_EMA_SWING');
      if (saved) {
        const parsed: ChecklistItem[] = JSON.parse(saved);
        if (parsed.length === 4) return parsed;
      }
    } catch {}
    return getDefaultChecklist('EMA_SWING');
  });

  // Current active checklist depending on active strategy
  const activeChecklist = useMemo(() => {
    return strategy === 'ICT_SILVER_BULLET' ? silverBulletChecklist : emaSwingChecklist;
  }, [strategy, silverBulletChecklist, emaSwingChecklist]);

  // Trade Parameters State
  const [parameters, setParameters] = useState<TradeParameters>(() => {
    try {
      const saved = localStorage.getItem('trade_gate_parameters');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      pair: 'EURUSD',
      direction: 'LONG',
      bias: 'BULLISH',
      timeframe: 'M5',
      entryPrice: '1.08500',
      stopLossPrice: '1.08300',
      takeProfitPrice: '1.08950',
      tradeNote: '',
      emotionalState: 'CALM',
    };
  });

  // Manual Confirmations (6 items + final liability)
  const [confirmations, setConfirmations] = useState<ManualConfirmations>(() => {
    try {
      const saved = localStorage.getItem('trade_gate_confirmations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      reviewedMarketStructure: false,
      reviewedLiquidity: false,
      confirmedEntryArea: false,
      definedStopLoss: false,
      definedTakeProfit: false,
      acceptedOwnDecision: false,
      finalLiabilityConfirmed: false,
    };
  });

  // Risk Parameters State
  const [riskSettings, setRiskSettings] = useState<RiskSettings>(() => {
    return {
      accountBalance: settings.accountBalance,
      riskPercentage: settings.defaultRiskPercentage,
      maxAllowedRiskPercentage: settings.maxAllowedRiskPercentage,
      dailyLossLimit: settings.dailyLossLimit,
      maxTradesPerDay: settings.maxTradesPerDay,
      pipValue: 10,
      silverBulletMinRR: settings.silverBulletMinRR,
      emaSwingMinRR: settings.emaSwingMinRR,
    };
  });

  const [slDistanceInput, setSlDistanceInput] = useState<string>('');

  // Gatekeeper Approval State & Timer
  const [isApprovedState, setIsApprovedState] = useState<boolean>(false);
  const [approvalExpirationCountdown, setApprovalExpirationCountdown] = useState<number>(
    settings.approvalExpirationSeconds
  );
  const [isApprovalExpired, setIsApprovalExpired] = useState<boolean>(false);

  // Journal Entries
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('trade_gate_journal');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'init_sample_1',
        timestamp: Date.now() - 3600000 * 24,
        dateStr: 'Yesterday',
        timeStr: '15:32',
        pair: 'EURUSD',
        strategy: 'ICT_SILVER_BULLET',
        direction: 'LONG',
        entryPrice: 1.0845,
        stopLossPrice: 1.083,
        takeProfitPrice: 1.088,
        riskPercentage: 1.0,
        cashRisk: 100,
        positionSizeLots: 0.67,
        rrRatio: 2.33,
        session: 'London',
        bias: 'BULLISH',
        emotionalState: 'FOCUSED',
        reason: 'London Silver Bullet FVG retest after PDL sweep.',
        notes: 'Price reached target cleanly within 45 mins.',
        status: 'APPROVED',
        outcome: 'WIN',
      },
    ];
  });

  // Compounding Plan State
  const [compoundingPlan, setCompoundingPlan] = useState<CompoundingPlan>(() => {
    try {
      const saved = localStorage.getItem('trade_gate_compounding_plan');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default 30-day discipline plan
    const initialBal = settings.accountBalance || 10000;
    const dailyTarget = 1.5;
    const days = Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const start = initialBal * Math.pow(1 + dailyTarget / 100, i);
      const target = start * (1 + dailyTarget / 100);
      return {
        day,
        startingBalance: Math.round(start * 100) / 100,
        maxRiskPct: 1.0,
        riskAmount: Math.round(start * 0.01 * 100) / 100,
        targetPct: dailyTarget,
        targetAmount: Math.round((target - start) * 100) / 100,
        targetBalance: Math.round(target * 100) / 100,
        maxTrades: 2,
        requiredRRR: 2.0,
        completed: false,
      };
    });
    return {
      id: 'standard_compounding_plan',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: 'Institutional 30-Day Growth & Capital Preservation Plan',
      startingBalance: initialBal,
      targetBalance: days[days.length - 1].targetBalance,
      durationDays: 30,
      dailyRiskPct: 1.0,
      dailyTargetPct: dailyTarget,
      weeklyTargetPct: 5.0,
      maxAllowedRiskPct: 2.0,
      tradingDaysPerWeek: 5,
      maxTradesPerDay: 2,
      targetRRR: 2.0,
      currentDay: 1,
      days,
      disclaimerAccepted: true,
    };
  });

  const handleUpdateCompoundingPlan = (newPlan: CompoundingPlan) => {
    setCompoundingPlan(newPlan);
    try {
      localStorage.setItem('trade_gate_compounding_plan', JSON.stringify(newPlan));
    } catch {}
    if (currentUser) {
      saveCompoundingPlanToFirestore(currentUser.uid, newPlan);
    }
  };

  // UI Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'OFFLINE'>('SAVED');
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Live Time state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Keep track of parameters for major change invalidation
  const approvedParamsRef = useRef<string>('');

  // Live Timer effect (every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      soundEngine.play('online_restored');
    };
    const handleOffline = () => {
      setIsOnline(false);
      soundEngine.play('offline_mode');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Firebase Auth Listener & Remote Draft / Settings Loader
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user);
      if (user) {
        soundEngine.play('data_saved');
        try {
          // Load User Draft from Firestore
          const remoteDraft = await loadUserDraft(user.uid);
          if (remoteDraft) {
            if (remoteDraft.strategy) setStrategy(remoteDraft.strategy as StrategyType);
            if (remoteDraft.silverBulletChecklist && remoteDraft.silverBulletChecklist.length === 5) {
              setSilverBulletChecklist(remoteDraft.silverBulletChecklist);
            }
            if (remoteDraft.emaSwingChecklist && remoteDraft.emaSwingChecklist.length === 4) {
              setEmaSwingChecklist(remoteDraft.emaSwingChecklist);
            }
            if (remoteDraft.parameters) setParameters(remoteDraft.parameters);
            if (remoteDraft.confirmations) setConfirmations(remoteDraft.confirmations);
          }

          // Load User Settings from Firestore
          const remoteSettings = await loadUserSettings(user.uid);
          if (remoteSettings) {
            setSettings((prev) => {
              const updated = { ...prev, ...remoteSettings };
              soundEngine.setSoundEnabled(updated.soundEnabled);
              soundEngine.setVolume(updated.soundVolume);
              setSoundEnabled(updated.soundEnabled);
              setSoundVolume(updated.soundVolume);
              return updated;
            });
          }

          // Load Compounding Plan from Firestore
          const remotePlan = await fetchCompoundingPlanFromFirestore(user.uid);
          if (remotePlan) {
            setCompoundingPlan(remotePlan);
          }
        } catch (err) {
          console.error('Error hydrating remote user data:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-Time Journal Subscription for Authenticated User
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeUserJournal(currentUser.uid, (entries) => {
      if (entries && entries.length > 0) {
        setJournalEntries(entries);
        try {
          localStorage.setItem('trade_gate_journal', JSON.stringify(entries));
        } catch {}
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Approval Expiration Countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isApprovedState && !isApprovalExpired) {
      timer = setInterval(() => {
        setApprovalExpirationCountdown((prev) => {
          if (prev <= 1) {
            setIsApprovalExpired(true);
            setIsApprovedState(false);
            soundEngine.play('approval_expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isApprovedState, isApprovalExpired]);

  // Debounced auto-save to LocalStorage + Cloud Firestore (user-scoped)
  useEffect(() => {
    setSaveStatus('SAVING');
    const timeout = setTimeout(async () => {
      try {
        // LocalStorage fallback persistence (always kept fresh)
        localStorage.setItem('trade_gate_checklist_ICT_SILVER_BULLET', JSON.stringify(silverBulletChecklist));
        localStorage.setItem('trade_gate_checklist_EMA_SWING', JSON.stringify(emaSwingChecklist));
        localStorage.setItem('trade_gate_parameters', JSON.stringify(parameters));
        localStorage.setItem('trade_gate_confirmations', JSON.stringify(confirmations));
        localStorage.setItem('trade_gate_settings', JSON.stringify(settings));
        localStorage.setItem('trade_gate_journal', JSON.stringify(journalEntries));

        // If user is authenticated & online, sync draft to Firestore
        if (currentUser && isOnline) {
          await saveUserDraft(currentUser.uid, {
            strategy,
            checklist: activeChecklist,
            silverBulletChecklist,
            emaSwingChecklist,
            parameters,
            confirmations,
            lastUpdated: Date.now(),
          });
        }

        setSaveStatus(isOnline ? 'SAVED' : 'OFFLINE');
      } catch (err) {
        console.warn('Auto-save error:', err);
        setSaveStatus(isOnline ? 'SAVED' : 'OFFLINE');
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [silverBulletChecklist, emaSwingChecklist, activeChecklist, parameters, confirmations, settings, journalEntries, strategy, isOnline, currentUser]);

  // Major Change Invalidation
  useEffect(() => {
    if (isApprovedState) {
      const currentParamFingerprint = `${parameters.pair}|${parameters.direction}|${parameters.entryPrice}|${parameters.stopLossPrice}|${parameters.takeProfitPrice}|${riskSettings.riskPercentage}|${strategy}|${parameters.timeframe}`;
      if (approvedParamsRef.current && approvedParamsRef.current !== currentParamFingerprint) {
        setIsApprovedState(false);
        setIsApprovalExpired(false);
        setConfirmations((prev) => ({ ...prev, finalLiabilityConfirmed: false }));
        soundEngine.play('gate_locked');
      }
    }
  }, [
    parameters.pair,
    parameters.direction,
    parameters.entryPrice,
    parameters.stopLossPrice,
    parameters.takeProfitPrice,
    riskSettings.riskPercentage,
    strategy,
    parameters.timeframe,
    isApprovedState,
  ]);

  // Risk Calculation
  const calculatedRisk = useMemo<CalculatedRisk>(() => {
    const balance = riskSettings.accountBalance || 0;
    const riskPct = riskSettings.riskPercentage || 0;
    const cashRisk = (balance * riskPct) / 100;

    const entry = parseFloat(parameters.entryPrice) || 0;
    const sl = parseFloat(parameters.stopLossPrice) || 0;
    const tp = parseFloat(parameters.takeProfitPrice) || 0;

    let riskDist = 0;
    let rewardDist = 0;

    if (entry > 0 && sl > 0) {
      riskDist = Math.abs(entry - sl);
    }
    if (entry > 0 && tp > 0) {
      rewardDist = Math.abs(tp - entry);
    }

    let slDistanceInPips = parseFloat(slDistanceInput) || 0;
    if (slDistanceInPips <= 0 && riskDist > 0) {
      slDistanceInPips = parameters.pair.includes('JPY') ? riskDist * 100 : riskDist * 10000;
    }

    let positionSizeLots = 0;
    if (slDistanceInPips > 0 && riskSettings.pipValue > 0) {
      positionSizeLots = cashRisk / (slDistanceInPips * riskSettings.pipValue);
    }

    let rrRatio = 0;
    if (riskDist > 0 && rewardDist > 0) {
      rrRatio = rewardDist / riskDist;
    }

    const minRequiredRR =
      strategy === 'ICT_SILVER_BULLET'
        ? settings.silverBulletMinRR
        : settings.emaSwingMinRR;

    const isRiskExceeded = riskPct > settings.maxAllowedRiskPercentage;
    const isRRSatisfied = rrRatio >= minRequiredRR;

    return {
      cashRisk,
      positionSizeLots,
      potentialReward: cashRisk * rrRatio,
      rrRatio,
      isRiskExceeded,
      isRRSatisfied,
      riskDistance: riskDist,
      rewardDistance: rewardDist,
    };
  }, [riskSettings, parameters, slDistanceInput, strategy, settings]);

  // Daily Statistics
  const tradesTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return journalEntries.filter(
      (j) => !j.isNoTrade && new Date(j.timestamp).toDateString() === today
    ).length;
  }, [journalEntries]);

  const dailyLossUsedPct = useMemo(() => {
    const today = new Date().toDateString();
    return journalEntries
      .filter((j) => !j.isNoTrade && new Date(j.timestamp).toDateString() === today)
      .reduce((sum, j) => sum + (j.riskPercentage || 0), 0);
  }, [journalEntries]);

  const noTradeSessionsCount = useMemo(() => {
    const today = new Date().toDateString();
    return journalEntries.filter(
      (j) => j.isNoTrade && new Date(j.timestamp).toDateString() === today
    ).length;
  }, [journalEntries]);

  const approvedSetupsCount = useMemo(() => {
    return journalEntries.filter((j) => j.status === 'APPROVED').length;
  }, [journalEntries]);

  // Gate Evaluation (Deterministic Gatekeeper Engine)
  const gateEvaluation = useMemo(() => {
    return evaluateGate({
      checklist: activeChecklist,
      parameters,
      confirmations,
      calculatedRisk,
      strategy,
      maxAllowedRiskPercentage: settings.maxAllowedRiskPercentage,
      tradesCountToday: tradesTodayCount,
      maxTradesPerDay: settings.maxTradesPerDay,
      dailyLossUsedPercentage: dailyLossUsedPct,
      dailyLossLimitPercentage: settings.dailyLossLimit,
      isApprovalExpired,
      isApprovedState,
    });
  }, [
    activeChecklist,
    parameters,
    confirmations,
    calculatedRisk,
    strategy,
    settings,
    tradesTodayCount,
    dailyLossUsedPct,
    isApprovalExpired,
    isApprovedState,
  ]);

  // Progress metrics for tabs
  const silverBulletProgress = useMemo(() => {
    const completed = silverBulletChecklist.filter((i) => i.checked).length;
    return {
      completed,
      total: silverBulletChecklist.length || 5,
      isApproved: completed === 5,
    };
  }, [silverBulletChecklist]);

  const emaSwingProgress = useMemo(() => {
    const completed = emaSwingChecklist.filter((i) => i.checked).length;
    return {
      completed,
      total: emaSwingChecklist.length || 4,
      isApproved: completed === 4,
    };
  }, [emaSwingChecklist]);

  // Handlers
  const handleToggleSound = () => {
    const newSoundState = !soundEnabled;
    soundEngine.setSoundEnabled(newSoundState);
    setSoundEnabled(newSoundState);
    setSettings((prev) => {
      const updated = { ...prev, soundEnabled: newSoundState };
      if (currentUser) {
        saveUserSettings(currentUser.uid, updated);
      }
      return updated;
    });
  };

  const handleSelectStrategy = (newStrat: StrategyType) => {
    setStrategy(newStrat);
    setIsApprovedState(false);
    setIsApprovalExpired(false);
    setConfirmations((prev) => ({ ...prev, finalLiabilityConfirmed: false }));
  };

  const handleToggleSilverBulletItem = (id: string) => {
    setSilverBulletChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
    setIsApprovedState(false);
    setConfirmations((prev) => ({ ...prev, finalLiabilityConfirmed: false }));
  };

  const handleResetSilverBulletChecklist = () => {
    setSilverBulletChecklist(getDefaultChecklist('ICT_SILVER_BULLET'));
    setIsApprovedState(false);
    setIsApprovalExpired(false);
    setConfirmations((prev) => ({ ...prev, finalLiabilityConfirmed: false }));
  };

  const handleToggleEmaSwingItem = (id: string) => {
    setEmaSwingChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
    setIsApprovedState(false);
    setConfirmations((prev) => ({ ...prev, finalLiabilityConfirmed: false }));
  };

  const handleResetEmaSwingChecklist = () => {
    setEmaSwingChecklist(getDefaultChecklist('EMA_SWING'));
    setIsApprovedState(false);
    setIsApprovalExpired(false);
    setConfirmations((prev) => ({ ...prev, finalLiabilityConfirmed: false }));
  };

  const handleUpdateParameters = (params: Partial<TradeParameters>) => {
    setParameters((prev) => ({ ...prev, ...params }));
  };

  const handleToggleConfirmation = (key: keyof ManualConfirmations) => {
    setConfirmations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirmFinalApproval = () => {
    setConfirmations((prev) => ({ ...prev, finalLiabilityConfirmed: true }));
    setIsApprovedState(true);
    setIsApprovalExpired(false);
    setApprovalExpirationCountdown(settings.approvalExpirationSeconds);

    approvedParamsRef.current = `${parameters.pair}|${parameters.direction}|${parameters.entryPrice}|${parameters.stopLossPrice}|${parameters.takeProfitPrice}|${riskSettings.riskPercentage}|${strategy}|${parameters.timeframe}`;

    // Record entry to journal
    const newEntry: JournalEntry = {
      id: 'trade_' + Date.now(),
      timestamp: Date.now(),
      dateStr: formatDateInZone(currentTime, 'Asia/Dhaka'),
      timeStr: formatTimeInZone(currentTime, 'Asia/Dhaka', false),
      pair: parameters.pair,
      strategy,
      direction: parameters.direction,
      entryPrice: parseFloat(parameters.entryPrice) || 0,
      stopLossPrice: parseFloat(parameters.stopLossPrice) || 0,
      takeProfitPrice: parseFloat(parameters.takeProfitPrice) || 0,
      riskPercentage: riskSettings.riskPercentage,
      cashRisk: calculatedRisk.cashRisk,
      positionSizeLots: calculatedRisk.positionSizeLots,
      rrRatio: calculatedRisk.rrRatio,
      session: sessions.find((s) => s.isOpen)?.name || 'Off-Session',
      bias: parameters.bias,
      emotionalState: parameters.emotionalState,
      reason: parameters.tradeNote || 'Pre-trade gate approval criteria met.',
      notes: parameters.tradeNote,
      status: 'APPROVED',
      outcome: 'OPEN',
    };

    setJournalEntries((prev) => [newEntry, ...prev]);

    if (currentUser) {
      saveJournalEntryToFirestore(currentUser.uid, newEntry);
    }
  };

  const handleResetApproval = () => {
    setIsApprovedState(false);
    setIsApprovalExpired(false);
    setConfirmations((prev) => ({ ...prev, finalLiabilityConfirmed: false }));
  };

  const handleAddNoTradeLog = (reason: string, notes: string) => {
    const noTradeEntry: JournalEntry = {
      id: 'notrade_' + Date.now(),
      timestamp: Date.now(),
      dateStr: formatDateInZone(currentTime, 'Asia/Dhaka'),
      timeStr: formatTimeInZone(currentTime, 'Asia/Dhaka', false),
      pair: parameters.pair || 'GENERAL',
      strategy,
      direction: parameters.direction,
      entryPrice: 0,
      stopLossPrice: 0,
      takeProfitPrice: 0,
      riskPercentage: 0,
      cashRisk: 0,
      positionSizeLots: 0,
      rrRatio: 0,
      session: sessions.find((s) => s.isOpen)?.name || 'Off-Session',
      bias: parameters.bias,
      emotionalState: parameters.emotionalState,
      reason: `No-Trade discipline: ${reason}`,
      notes: notes || reason,
      status: 'NO_TRADE',
      outcome: 'NO_TRADE',
      isNoTrade: true,
      noTradeReason: reason,
    };

    setJournalEntries((prev) => [noTradeEntry, ...prev]);

    if (currentUser) {
      saveNoTradeLogToFirestore(currentUser.uid, {
        id: noTradeEntry.id,
        timestamp: noTradeEntry.timestamp,
        reason,
        notes: notes || reason,
        session: noTradeEntry.session,
      });
      saveJournalEntryToFirestore(currentUser.uid, noTradeEntry);
    }
  };

  const handleUpdateEntryOutcome = (id: string, outcome: TradeOutcome) => {
    setJournalEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, outcome } : e))
    );

    if (currentUser) {
      updateJournalEntryInFirestore(currentUser.uid, id, { outcome });
    }
  };

  const handleExportCSV = () => {
    exportJournalToCsv(journalEntries);
  };

  const handleApplyAnalysisToGate = (draft: {
    pair?: string;
    direction?: 'LONG' | 'SHORT';
    entryPrice?: string;
    stopLossPrice?: string;
    takeProfitPrice?: string;
    notes?: string;
  }) => {
    setParameters((prev) => ({
      ...prev,
      pair: draft.pair || prev.pair,
      direction: draft.direction || prev.direction,
      entryPrice: draft.entryPrice || prev.entryPrice,
      stopLossPrice: draft.stopLossPrice || prev.stopLossPrice,
      takeProfitPrice: draft.takeProfitPrice || prev.takeProfitPrice,
      tradeNote: draft.notes || prev.tradeNote,
    }));
    setCurrentView('DASHBOARD');
    soundEngine.play('button_click');
  };

  const handleExportSettings = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `trade_gate_settings_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportSettings = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      setSettings(merged);
      soundEngine.setSoundEnabled(merged.soundEnabled);
      soundEngine.setVolume(merged.soundVolume);
      setSoundEnabled(merged.soundEnabled);
      setSoundVolume(merged.soundVolume);
      soundEngine.play('data_saved');

      if (currentUser) {
        saveUserSettings(currentUser.uid, merged);
      }
    } catch {
      soundEngine.play('warning');
    }
  };

  // Timezones and Sessions
  const bangladeshTime = formatTimeInZone(currentTime, 'Asia/Dhaka');
  const bangladeshDate = formatDateInZone(currentTime, 'Asia/Dhaka');
  const indiaTime = formatTimeInZone(currentTime, 'Asia/Kolkata');
  const londonTime = formatTimeInZone(currentTime, 'Europe/London');
  const newYorkTime = formatTimeInZone(currentTime, 'America/New_York');

  const sessions = useMemo(() => getMarketSessions(currentTime), [currentTime]);
  const activeSessionName = useMemo(() => {
    const openSess = sessions.filter((s) => s.isOpen);
    if (openSess.length === 0) return 'OFF-MARKET';
    return openSess.map((s) => s.name).join(' + ');
  }, [sessions]);

  const silverBullet = useMemo(
    () =>
      getSilverBulletStatus(
        currentTime,
        settings.londonWindowStart,
        settings.londonWindowEnd,
        settings.nyWindowStart,
        settings.nyWindowEnd
      ),
    [currentTime, settings]
  );

  const checklistCompletionAvg = useMemo(() => {
    if (activeChecklist.length === 0) return 0;
    const checked = activeChecklist.filter((i) => i.checked).length;
    return Math.round((checked / activeChecklist.length) * 100);
  }, [activeChecklist]);

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E0E0E0] pb-20 lg:pb-12 selection:bg-blue-500/30 selection:text-white font-sans">
      {/* 4. HEADER WITH SOUND TOGGLE & AUTH */}
      <Header
        bangladeshTime={bangladeshTime}
        bangladeshDate={bangladeshDate}
        indiaTime={indiaTime}
        londonTime={londonTime}
        newYorkTime={newYorkTime}
        activeSession={activeSessionName}
        isOnline={isOnline}
        saveStatus={saveStatus}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSettings={() => setIsSettingsOpen(true)}
        soundVolume={soundVolume}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenTradingViewModal={() => setIsTradingViewModalOpen(true)}
      />

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 py-4 space-y-5">
        {/* TOP NAVIGATION TABS */}
        <NavigationTabs
          currentView={currentView}
          onSelectView={setCurrentView}
          silverBulletProgress={silverBulletProgress}
          emaSwingProgress={emaSwingProgress}
          journalCount={journalEntries.length}
          compoundingPlanActive={Boolean(compoundingPlan)}
        />

        {/* ROUTING VIEWS */}

        {/* 1. DEDICATED ICT SILVER BULLET PAGE */}
        {currentView === 'ICT_SILVER_BULLET' && (
          <SilverBulletChecklistPage
            checklist={silverBulletChecklist}
            onToggleItem={handleToggleSilverBulletItem}
            onResetChecklist={handleResetSilverBulletChecklist}
            onNavigate={setCurrentView}
          />
        )}

        {/* 2. DEDICATED 9/20 EMA SWING PAGE */}
        {currentView === 'EMA_SWING' && (
          <EmaSwingChecklistPage
            checklist={emaSwingChecklist}
            onToggleItem={handleToggleEmaSwingItem}
            onResetChecklist={handleResetEmaSwingChecklist}
            onNavigate={setCurrentView}
          />
        )}

        {/* 3. DEDICATED RISK CALCULATOR PAGE */}
        {currentView === 'RISK_CALCULATOR' && (
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center space-x-3 rounded-xl border border-[#2A2D35] bg-[#121620] p-4 shadow-lg">
              <button
                onClick={() => {
                  soundEngine.play('button_click');
                  setCurrentView('DASHBOARD');
                }}
                className="flex items-center space-x-1.5 rounded-lg border border-[#2A2D35] bg-[#1A1F2C] px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:text-white hover:border-blue-500"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
                <span>Dashboard</span>
              </button>
              <div>
                <h1 className="font-mono text-base sm:text-lg font-bold text-white">
                  Risk &amp; Position Sizing Engine
                </h1>
                <p className="text-xs text-gray-400 font-medium">
                  Capital protection &amp; mathematical lot calculation
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RiskSection
                riskSettings={riskSettings}
                calculatedRisk={calculatedRisk}
                slDistanceInput={slDistanceInput}
                onUpdateSLDistance={setSlDistanceInput}
                onUpdateRiskSettings={(newR) => setRiskSettings((prev) => ({ ...prev, ...newR }))}
                tradesTodayCount={tradesTodayCount}
                dailyLossUsedPct={dailyLossUsedPct}
                compoundingPlan={compoundingPlan}
              />
              <TodayDashboard
                tradesCount={tradesTodayCount}
                maxTrades={settings.maxTradesPerDay}
                riskUsedPct={dailyLossUsedPct}
                dailyLossLimitPct={settings.dailyLossLimit}
                approvedCount={approvedSetupsCount}
                noTradeCount={noTradeSessionsCount}
                checklistCompletionAvg={checklistCompletionAvg}
                compoundingPlan={compoundingPlan}
                onNavigateCompounding={() => setCurrentView('COMPOUNDING_PLAN')}
              />
            </div>
          </div>
        )}

        {/* 4. DEDICATED TRADING ANALYSIS PAGE */}
        {currentView === 'TRADING_ANALYSIS' && (
          <TradingAnalysisSection
            parameters={parameters}
            riskSettings={riskSettings}
            calculatedRisk={calculatedRisk}
            onNavigate={setCurrentView}
            onNavigateChecklist={(strat) => setCurrentView(strat)}
            onApplyToGate={handleApplyAnalysisToGate}
          />
        )}

        {/* 5. DEDICATED COMPOUNDING PLAN PAGE */}
        {currentView === 'COMPOUNDING_PLAN' && (
          <CompoundingPlanSection
            plan={compoundingPlan}
            onSavePlan={handleUpdateCompoundingPlan}
            onNavigate={setCurrentView}
            currentBalance={riskSettings.accountBalance}
          />
        )}

        {/* 6. DEDICATED DURJOY AI PAGE */}
        {currentView === 'DURJOY_AI' && (
          <DurjoyAiSection
            onNavigate={setCurrentView}
            isFirebaseConnected={Boolean(currentUser && isOnline)}
          />
        )}

        {/* 7. DEDICATED JOURNAL PAGE */}
        {currentView === 'JOURNAL' && (
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex items-center space-x-3 rounded-xl border border-[#2A2D35] bg-[#121620] p-4 shadow-lg">
              <button
                onClick={() => {
                  soundEngine.play('button_click');
                  setCurrentView('DASHBOARD');
                }}
                className="flex items-center space-x-1.5 rounded-lg border border-[#2A2D35] bg-[#1A1F2C] px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:text-white hover:border-blue-500"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
                <span>Dashboard</span>
              </button>
              <div>
                <h1 className="font-mono text-base sm:text-lg font-bold text-white">
                  Trading Journal &amp; Discipline Log
                </h1>
                <p className="text-xs text-gray-400 font-medium">
                  Complete ledger of approved trades &amp; disciplined no-trade sessions
                </p>
              </div>
            </div>

            <JournalSection
              entries={journalEntries}
              onAddNoTradeLog={handleAddNoTradeLog}
              onUpdateEntryOutcome={handleUpdateEntryOutcome}
              onExportCSV={handleExportCSV}
            />
          </div>
        )}

        {/* 8. DEDICATED NOTES PAGE */}
        {currentView === 'NOTES' && (
          <NotesSection
            onNavigate={setCurrentView}
            userId={currentUser?.uid}
          />
        )}

        {/* 9. DEDICATED GEMINI AI QUICK BOARD PAGE (LEGACY ROUTE) */}
        {currentView === 'GEMINI_AI' && (
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center space-x-3 rounded-xl border border-[#2A2D35] bg-[#121620] p-4 shadow-lg">
              <button
                onClick={() => {
                  soundEngine.play('button_click');
                  setCurrentView('DASHBOARD');
                }}
                className="flex items-center space-x-1.5 rounded-lg border border-[#2A2D35] bg-[#1A1F2C] px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:text-white hover:border-blue-500"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
                <span>Dashboard</span>
              </button>
              <div>
                <h1 className="font-mono text-base sm:text-lg font-bold text-white">
                  Gemini AI Trading Board
                </h1>
                <p className="text-xs text-gray-400 font-medium">
                  AI-assisted rule auditor, setup reviewer &amp; risk validator
                </p>
              </div>
            </div>

            <GeminiQuickBoard isFirebaseConnected={Boolean(currentUser && isOnline)} />
          </div>
        )}

        {/* 10. MAIN DASHBOARD VIEW */}
        {currentView === 'DASHBOARD' && (
          <>
            {/* 5 & 6. SESSION MONITOR & GLOBAL TIME STRIP */}
            <SessionMonitor
              bangladeshTime={bangladeshTime}
              bangladeshDate={bangladeshDate}
              indiaTime={indiaTime}
              londonTime={londonTime}
              newYorkTime={newYorkTime}
              sessions={sessions}
              silverBullet={silverBullet}
            />

            {/* 12. PRE-TRADE GATE (CENTRAL HERO DISCIPLINE ENGINE) */}
            <section id="section-gate">
              <PreTradeGate
                evaluation={gateEvaluation}
                parameters={parameters}
                calculatedRisk={calculatedRisk}
                strategy={strategy}
                expirationCountdownSec={approvalExpirationCountdown}
                onConfirmFinalApproval={handleConfirmFinalApproval}
                onResetApproval={handleResetApproval}
                brokerUrl={settings.brokerUrl}
                onOpenTradingViewModal={() => setIsTradingViewModalOpen(true)}
              />
            </section>

            {/* QUICK TRADINGVIEW LIVE WINDOW BAR */}
            <div className="flex flex-wrap items-center justify-between rounded-xl border border-cyan-500/30 bg-gradient-to-r from-[#0C1527] via-[#0E1A33] to-[#0A1224] p-3.5 shadow-lg gap-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm">
                  <LineChart className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-white tracking-wide">
                      TRADINGVIEW LIVE WINDOW
                    </span>
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
                      STREAMING REAL-TIME
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Live candles, drawing tools, indicators &amp; direct parameters sync to Pre-Trade Gate
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    soundEngine.play('button_click');
                    setIsTradingViewModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 rounded-lg border border-cyan-400/50 bg-cyan-600/30 px-3.5 py-2 font-mono text-xs font-bold text-cyan-200 hover:bg-cyan-500 hover:text-white transition-all shadow-md shadow-cyan-500/15"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Open Chart Window</span>
                </button>

                <button
                  onClick={() => {
                    soundEngine.play('tab_switch');
                    setCurrentView('TRADING_ANALYSIS');
                  }}
                  className="flex items-center space-x-1.5 rounded-lg border border-[#2A344E] bg-[#1A1F2C] px-3 py-2 font-mono text-xs font-semibold text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                >
                  <span>Full Workspace &rarr;</span>
                </button>
              </div>
            </div>

            {/* 51. DESKTOP 3-COLUMN MAIN GRID */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* LEFT COLUMN: Dedicated Strategy Launchers (5 Cols on Large) */}
              <div className="space-y-6 lg:col-span-5" id="section-checklist">
                <DashboardStrategyLauncher
                  activeStrategy={strategy}
                  onSelectStrategy={handleSelectStrategy}
                  onNavigate={setCurrentView}
                  silverBulletChecklist={silverBulletChecklist}
                  emaSwingChecklist={emaSwingChecklist}
                />
              </div>

              {/* CENTER COLUMN: My Confirmation (4 Cols on Large) */}
              <div className="space-y-6 lg:col-span-4" id="section-confirm">
                <ConfirmationSection
                  parameters={parameters}
                  confirmations={confirmations}
                  onUpdateParameters={handleUpdateParameters}
                  onToggleConfirmation={handleToggleConfirmation}
                  calculatedRR={calculatedRisk.rrRatio}
                  isRRSatisfied={calculatedRisk.isRRSatisfied}
                  requiredRR={
                    strategy === 'ICT_SILVER_BULLET'
                      ? settings.silverBulletMinRR
                      : settings.emaSwingMinRR
                  }
                />
              </div>

              {/* RIGHT COLUMN: Risk Calculator + Daily Discipline (3 Cols on Large) */}
              <div className="space-y-6 lg:col-span-3" id="section-risk">
                <RiskSection
                  riskSettings={riskSettings}
                  calculatedRisk={calculatedRisk}
                  slDistanceInput={slDistanceInput}
                  onUpdateSLDistance={setSlDistanceInput}
                  onUpdateRiskSettings={(newR) => setRiskSettings((prev) => ({ ...prev, ...newR }))}
                  tradesTodayCount={tradesTodayCount}
                  dailyLossUsedPct={dailyLossUsedPct}
                  compoundingPlan={compoundingPlan}
                />

                {/* 42. DAILY DISCIPLINE DASHBOARD */}
                <TodayDashboard
                  tradesCount={tradesTodayCount}
                  maxTrades={settings.maxTradesPerDay}
                  riskUsedPct={dailyLossUsedPct}
                  dailyLossLimitPct={settings.dailyLossLimit}
                  approvedCount={approvedSetupsCount}
                  noTradeCount={noTradeSessionsCount}
                  checklistCompletionAvg={checklistCompletionAvg}
                  compoundingPlan={compoundingPlan}
                  onNavigateCompounding={() => setCurrentView('COMPOUNDING_PLAN')}
                />
              </div>
            </div>

            {/* LOWER SECTION: TRADING JOURNAL & GEMINI QUICK BOARD */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Journal (7 Cols) */}
              <div className="lg:col-span-7" id="section-journal">
                <JournalSection
                  entries={journalEntries}
                  onAddNoTradeLog={handleAddNoTradeLog}
                  onUpdateEntryOutcome={handleUpdateEntryOutcome}
                  onExportCSV={handleExportCSV}
                />
              </div>

              {/* Gemini Quick Board (5 Cols) */}
              <div className="lg:col-span-5" id="section-ai">
                <GeminiQuickBoard isFirebaseConnected={Boolean(currentUser && isOnline)} />
              </div>
            </div>
          </>
        )}

        {/* IMPORTANT FINANCIAL DISCLAIMER & FOOTER WITH COPYRIGHT */}
        <footer className="border-t border-[#1E2538] bg-[#070B18]/60 rounded-xl p-5 text-center text-xs text-gray-400 space-y-2.5">
          <p className="max-w-2xl mx-auto leading-relaxed text-[11px] text-gray-500">
            This tool is for personal organization, education, and decision-discipline purposes
            only. It does not provide financial advice, automated trading signals, or profit guarantees.
            Trading financial markets involves substantial risk of loss.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[11px] font-mono text-gray-400">
            <span className="font-bold text-gray-200">&copy; 2026 Durjoy. All Rights Reserved.</span>
            <span>&bull;</span>
            <span className="text-blue-400">TRADE GATE &bull; INSTITUTIONAL PRE-TRADE TERMINAL</span>
            <span>&bull;</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-cyan-400 hover:underline"
            >
              Sound &amp; Settings
            </button>
          </div>
        </footer>
      </main>

      {/* MOBILE STICKY BOTTOM NAVIGATION */}
      <MobileNav
        currentView={currentView}
        onSelectView={setCurrentView}
        silverBulletApproved={silverBulletProgress.isApproved}
        emaSwingApproved={emaSwingProgress.isApproved}
      />

      {/* SETTINGS & SOUND CONFIGURATION DRAWER */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newS) => {
          setSettings(newS);
          setSoundEnabled(newS.soundEnabled);
          setSoundVolume(newS.soundVolume);
          soundEngine.setSoundEnabled(newS.soundEnabled);
          soundEngine.setVolume(newS.soundVolume);
          if (currentUser) {
            saveUserSettings(currentUser.uid, newS);
          }
        }}
        onExportSettings={handleExportSettings}
        onImportSettings={handleImportSettings}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* FIREBASE AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          soundEngine.play('data_saved');
        }}
      />

      {/* TRADINGVIEW LIVE POPUP WINDOW */}
      <TradingViewModal
        isOpen={isTradingViewModalOpen}
        onClose={() => setIsTradingViewModalOpen(false)}
        defaultPair={parameters.pair}
        defaultTimeframe={parameters.timeframe}
        onApplyToGate={handleApplyAnalysisToGate}
      />
    </div>
  );
}


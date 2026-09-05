import React from 'react';
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  Calculator,
  LineChart,
  CalendarCheck,
  BookOpen,
  FileText,
  Bot,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AppView } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface NavigationTabsProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  silverBulletProgress: { completed: number; total: number; isApproved: boolean };
  emaSwingProgress: { completed: number; total: number; isApproved: boolean };
  journalCount: number;
  compoundingPlanActive?: boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentView,
  onSelectView,
  silverBulletProgress,
  emaSwingProgress,
  journalCount,
  compoundingPlanActive,
}) => {
  const tabs: Array<{
    id: AppView;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }> = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-3.5 w-3.5" />,
    },
    {
      id: 'ICT_SILVER_BULLET',
      label: 'ICT Silver Bullet',
      icon: <Target className="h-3.5 w-3.5 text-blue-400" />,
      badge: silverBulletProgress.isApproved
        ? 'APPROVED'
        : `${silverBulletProgress.completed}/${silverBulletProgress.total}`,
      badgeColor: silverBulletProgress.isApproved
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'EMA_SWING',
      label: '9/20 EMA Swing',
      icon: <TrendingUp className="h-3.5 w-3.5 text-violet-400" />,
      badge: emaSwingProgress.isApproved
        ? 'APPROVED'
        : `${emaSwingProgress.completed}/${emaSwingProgress.total}`,
      badgeColor: emaSwingProgress.isApproved
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    },
    {
      id: 'RISK_CALCULATOR',
      label: 'Risk Calculator',
      icon: <Calculator className="h-3.5 w-3.5 text-cyan-400" />,
    },
    {
      id: 'TRADING_ANALYSIS',
      label: 'TradingView & Analysis',
      icon: <LineChart className="h-3.5 w-3.5 text-cyan-400" />,
      badge: 'LIVE CHART',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'COMPOUNDING_PLAN',
      label: 'Compounding Plan',
      icon: <CalendarCheck className="h-3.5 w-3.5 text-emerald-400" />,
      badge: compoundingPlanActive ? 'ACTIVE' : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'JOURNAL',
      label: 'Journal',
      icon: <BookOpen className="h-3.5 w-3.5 text-amber-400" />,
      badge: journalCount > 0 ? `${journalCount}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'DURJOY_AI',
      label: 'Durjoy AI',
      icon: <Sparkles className="h-3.5 w-3.5 text-cyan-400" />,
      badge: 'ASSISTANT',
      badgeColor: 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'NOTES',
      label: 'Notes',
      icon: <FileText className="h-3.5 w-3.5 text-gray-400" />,
    },
  ];

  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-800">
      <div className="flex items-center space-x-1.5 min-w-max border-b border-[#2A2D35]/80 pb-2 px-1">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id.toLowerCase()}`}
              onClick={() => {
                soundEngine.play('tab_switch');
                onSelectView(tab.id);
              }}
              className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all select-none ${
                isActive
                  ? 'border border-blue-500/40 bg-gradient-to-r from-blue-600/30 to-violet-600/20 text-white shadow-sm shadow-blue-500/10'
                  : 'border border-transparent bg-transparent text-gray-400 hover:border-[#2A2D35] hover:bg-[#1A1F2C] hover:text-gray-200'
              }`}
            >
              <span className={isActive ? 'text-blue-400' : 'text-gray-400'}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full border px-1.5 py-0.2 font-mono text-[9px] font-bold ${tab.badgeColor}`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

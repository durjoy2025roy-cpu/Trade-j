import React, { useState } from 'react';
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  Calculator,
  BookOpen,
  FileText,
  Bot,
  MoreHorizontal,
  X,
  LineChart,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { AppView } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface MobileNavProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  silverBulletApproved: boolean;
  emaSwingApproved: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onSelectView,
  silverBulletApproved,
  emaSwingApproved,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainItems: Array<{ id: AppView; label: string; icon: React.ReactNode; isDot?: boolean }> = [
    {
      id: 'DASHBOARD',
      label: 'DASH',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'ICT_SILVER_BULLET',
      label: 'SILVER',
      icon: <Target className="h-4 w-4" />,
      isDot: silverBulletApproved,
    },
    {
      id: 'EMA_SWING',
      label: '9/20 EMA',
      icon: <TrendingUp className="h-4 w-4" />,
      isDot: emaSwingApproved,
    },
    {
      id: 'RISK_CALCULATOR',
      label: 'RISK',
      icon: <Calculator className="h-4 w-4" />,
    },
    {
      id: 'JOURNAL',
      label: 'JOURNAL',
      icon: <BookOpen className="h-4 w-4" />,
    },
  ];

  const handleSelect = (view: AppView) => {
    soundEngine.play('tab_switch');
    onSelectView(view);
    setShowMoreMenu(false);
  };

  const isMoreActive =
    currentView === 'TRADING_ANALYSIS' ||
    currentView === 'COMPOUNDING_PLAN' ||
    currentView === 'DURJOY_AI' ||
    currentView === 'NOTES' ||
    currentView === 'GEMINI_AI';

  return (
    <>
      {/* More Menu Bottom Sheet */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="rounded-t-2xl border-t border-[#2A2D35] bg-[#121620] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2A2D35] pb-3 mb-3">
              <span className="font-mono text-xs font-bold text-gray-300 uppercase tracking-wider">
                Additional Sections
              </span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="rounded p-1 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="mobile-more-analysis"
                onClick={() => handleSelect('TRADING_ANALYSIS')}
                className={`flex items-center space-x-2.5 rounded-xl border p-3 text-left transition-all ${
                  currentView === 'TRADING_ANALYSIS'
                    ? 'border-blue-500/50 bg-blue-600/20 text-blue-300'
                    : 'border-[#2A2D35] bg-[#1A1F2C] text-gray-300 hover:text-white'
                }`}
              >
                <LineChart className="h-4 w-4 text-blue-400" />
                <div>
                  <div className="text-xs font-bold">Analysis</div>
                  <div className="text-[10px] text-gray-400">Chart &amp; Vision</div>
                </div>
              </button>

              <button
                id="mobile-more-compounding"
                onClick={() => handleSelect('COMPOUNDING_PLAN')}
                className={`flex items-center space-x-2.5 rounded-xl border p-3 text-left transition-all ${
                  currentView === 'COMPOUNDING_PLAN'
                    ? 'border-emerald-500/50 bg-emerald-600/20 text-emerald-300'
                    : 'border-[#2A2D35] bg-[#1A1F2C] text-gray-300 hover:text-white'
                }`}
              >
                <CalendarCheck className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold">Compounding</div>
                  <div className="text-[10px] text-gray-400">Discipline Plan</div>
                </div>
              </button>

              <button
                id="mobile-more-durjoy-ai"
                onClick={() => handleSelect('DURJOY_AI')}
                className={`flex items-center space-x-2.5 rounded-xl border p-3 text-left transition-all ${
                  currentView === 'DURJOY_AI'
                    ? 'border-cyan-500/50 bg-cyan-600/20 text-cyan-300'
                    : 'border-[#2A2D35] bg-[#1A1F2C] text-gray-300 hover:text-white'
                }`}
              >
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold">Durjoy AI</div>
                  <div className="text-[10px] text-gray-400">Educational Assistant</div>
                </div>
              </button>

              <button
                id="mobile-more-notes"
                onClick={() => handleSelect('NOTES')}
                className={`flex items-center space-x-2.5 rounded-xl border p-3 text-left transition-all ${
                  currentView === 'NOTES'
                    ? 'border-blue-500/50 bg-blue-600/20 text-blue-300'
                    : 'border-[#2A2D35] bg-[#1A1F2C] text-gray-300 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-xs font-bold">Notes</div>
                  <div className="text-[10px] text-gray-400">Scratchpad</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#2A2D35] bg-[#0F1115]/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-around px-1 py-1.5">
          {mainItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id.toLowerCase()}`}
                onClick={() => handleSelect(item.id)}
                className={`relative flex flex-col items-center justify-center space-y-0.5 rounded-lg py-1 px-2.5 transition-all ${
                  isActive
                    ? 'border border-blue-500/40 bg-blue-600/20 text-blue-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {item.icon}
                <span className="font-mono text-[9px] font-bold tracking-wider">{item.label}</span>
                {item.isDot && (
                  <span className="absolute top-1 right-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                )}
              </button>
            );
          })}

          {/* More button */}
          <button
            id="mobile-nav-more"
            onClick={() => {
              soundEngine.play('button_click');
              setShowMoreMenu(!showMoreMenu);
            }}
            className={`flex flex-col items-center justify-center space-y-0.5 rounded-lg py-1 px-2.5 transition-all ${
              isMoreActive
                ? 'border border-blue-500/40 bg-blue-600/20 text-blue-400 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="font-mono text-[9px] font-bold tracking-wider">MORE</span>
          </button>
        </div>
      </nav>
    </>
  );
};

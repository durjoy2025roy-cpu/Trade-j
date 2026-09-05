export type AppView =
  | 'DASHBOARD'
  | 'ICT_SILVER_BULLET'
  | 'EMA_SWING'
  | 'RISK_CALCULATOR'
  | 'TRADING_ANALYSIS'
  | 'JOURNAL'
  | 'COMPOUNDING_PLAN'
  | 'DURJOY_AI'
  | 'NOTES'
  | 'GEMINI_AI';

export type StrategyType = 'ICT_SILVER_BULLET' | 'EMA_SWING';

export type MarketDirection = 'LONG' | 'SHORT';
export type MarketBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type TimeFrame = 'M1' | 'M5' | 'H1' | 'H4';

export type EmotionalState = 'CALM' | 'FOCUSED' | 'UNCERTAIN' | 'FOMO' | 'REVENGE' | 'TIRED';

export type GateStatus = 'LOCKED' | 'READY' | 'APPROVED' | 'EXPIRED';

export type TradeOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'NO_TRADE' | 'OPEN';

export interface ChecklistItem {
  id: string;
  step: string;
  label: string;
  description?: string;
  checked: boolean;
  stepNumber?: number;
  stepTitle?: string;
  timeframe?: string;
  instruction?: string;
}

export interface TradeParameters {
  pair: string;
  direction: MarketDirection;
  bias: MarketBias;
  timeframe: TimeFrame;
  entryPrice: string;
  stopLossPrice: string;
  takeProfitPrice: string;
  tradeNote: string;
  emotionalState: EmotionalState;
}

export interface ManualConfirmations {
  reviewedMarketStructure: boolean;
  reviewedLiquidity: boolean;
  confirmedEntryArea: boolean;
  definedStopLoss: boolean;
  definedTakeProfit: boolean;
  acceptedOwnDecision: boolean;
  finalLiabilityConfirmed: boolean;
}

export interface RiskSettings {
  accountBalance: number;
  riskPercentage: number;
  maxAllowedRiskPercentage: number;
  dailyLossLimit: number;
  maxTradesPerDay: number;
  pipValue: number; // e.g. 10 for standard EURUSD lot
  silverBulletMinRR: number; // 2.0
  emaSwingMinRR: number; // 3.0
}

export interface CalculatedRisk {
  cashRisk: number;
  positionSizeLots: number;
  potentialReward: number;
  rrRatio: number;
  isRiskExceeded: boolean;
  isRRSatisfied: boolean;
  riskDistance: number;
  rewardDistance: number;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  pair: string;
  strategy: StrategyType;
  direction: MarketDirection;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskPercentage: number;
  cashRisk: number;
  positionSizeLots: number;
  rrRatio: number;
  session: string;
  bias: MarketBias;
  emotionalState: EmotionalState;
  reason: string;
  notes: string;
  status: 'APPROVED' | 'REJECTED' | 'NO_TRADE';
  outcome: TradeOutcome;
  isNoTrade?: boolean;
  noTradeReason?: string;
}

export interface AppSettings {
  defaultRiskPercentage: number;
  maxAllowedRiskPercentage: number;
  dailyLossLimit: number;
  maxTradesPerDay: number;
  silverBulletMinRR: number;
  emaSwingMinRR: number;
  approvalExpirationSeconds: number;
  accountBalance: number;
  currency: string;
  londonWindowStart: string; // "15:00"
  londonWindowEnd: string;   // "16:00"
  nyWindowStart: string;     // "20:00"
  nyWindowEnd: string;       // "21:00"
  brokerUrl: string;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1 (e.g. 0.35)
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

export interface GateEvaluation {
  status: GateStatus;
  failedConditions: string[];
  completedConditionsCount: number;
  totalConditionsCount: number;
  warnings: string[];
  canApprove: boolean;
  readyForFinalReview: boolean;
}

export interface CompoundingPlanDay {
  day: number;
  startingBalance: number;
  maxRiskPct: number;
  riskAmount: number;
  targetPct: number;
  targetAmount: number;
  targetBalance: number;
  maxTrades: number;
  requiredRRR: number;
  completed?: boolean;
}

export interface CompoundingPlan {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  startingBalance: number;
  targetBalance: number;
  durationDays: number;
  dailyRiskPct: number;
  dailyTargetPct: number;
  weeklyTargetPct: number;
  maxAllowedRiskPct: number;
  tradingDaysPerWeek: number;
  maxTradesPerDay: number;
  targetRRR: number;
  currentDay: number;
  days: CompoundingPlanDay[];
  disclaimerAccepted: boolean;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  imageUrl?: string;
  isError?: boolean;
}

import {
  ChecklistItem,
  TradeParameters,
  ManualConfirmations,
  CalculatedRisk,
  StrategyType,
  GateEvaluation,
  GateStatus,
} from '../types';

export interface GateInput {
  checklist: ChecklistItem[];
  parameters: TradeParameters;
  confirmations: ManualConfirmations;
  calculatedRisk: CalculatedRisk;
  strategy: StrategyType;
  maxAllowedRiskPercentage: number;
  tradesCountToday: number;
  maxTradesPerDay: number;
  dailyLossUsedPercentage: number;
  dailyLossLimitPercentage: number;
  isApprovalExpired: boolean;
  isApprovedState: boolean;
}

export function evaluateGate(input: GateInput): GateEvaluation {
  const failedConditions: string[] = [];
  const warnings: string[] = [];
  let completedCount = 0;
  let totalCount = 10;

  // 1. Strategy Checklist
  const uncheckedItems = input.checklist.filter((item) => !item.checked);
  if (uncheckedItems.length === 0 && input.checklist.length > 0) {
    completedCount++;
  } else {
    failedConditions.push(
      `Strategy Checklist incomplete (${input.checklist.length - uncheckedItems.length}/${input.checklist.length} conditions checked)`
    );
  }

  // 2. Market Confirmation (6 manual items)
  const confirmationFields = [
    { key: input.confirmations.reviewedMarketStructure, name: 'Market Structure review' },
    { key: input.confirmations.reviewedLiquidity, name: 'Liquidity review' },
    { key: input.confirmations.confirmedEntryArea, name: 'Entry area verification' },
    { key: input.confirmations.definedStopLoss, name: 'Stop Loss definition' },
    { key: input.confirmations.definedTakeProfit, name: 'Take Profit definition' },
    { key: input.confirmations.acceptedOwnDecision, name: 'Personal decision acceptance' },
  ];
  const unconfirmed = confirmationFields.filter((c) => !c.key);
  if (unconfirmed.length === 0) {
    completedCount++;
  } else {
    failedConditions.push(`Market Confirmation: Missing ${unconfirmed.map((u) => u.name).join(', ')}`);
  }

  // 3. Trade Parameters valid
  const entry = parseFloat(input.parameters.entryPrice);
  const sl = parseFloat(input.parameters.stopLossPrice);
  const tp = parseFloat(input.parameters.takeProfitPrice);

  let paramsValid = false;
  if (
    input.parameters.pair.trim() &&
    !isNaN(entry) &&
    entry > 0 &&
    !isNaN(sl) &&
    sl > 0 &&
    !isNaN(tp) &&
    tp > 0
  ) {
    if (input.parameters.direction === 'LONG') {
      if (sl < entry && tp > entry) {
        paramsValid = true;
      } else {
        failedConditions.push('Invalid Long levels: SL must be below Entry, TP must be above Entry');
      }
    } else {
      if (sl > entry && tp < entry) {
        paramsValid = true;
      } else {
        failedConditions.push('Invalid Short levels: SL must be above Entry, TP must be below Entry');
      }
    }
  } else {
    failedConditions.push('Trade Parameters: Valid Pair, Entry, Stop Loss, and Take Profit are required');
  }

  if (paramsValid) {
    completedCount++;
  }

  // 4. Risk within limit
  if (!input.calculatedRisk.isRiskExceeded && input.calculatedRisk.cashRisk > 0) {
    completedCount++;
  } else {
    failedConditions.push(
      `Risk limit exceeded: Current risk is above allowed max ${input.maxAllowedRiskPercentage}%`
    );
  }

  // 5. Required R:R achieved
  const requiredRR = input.strategy === 'ICT_SILVER_BULLET' ? 2.0 : 3.0;
  if (input.calculatedRisk.isRRSatisfied && input.calculatedRisk.rrRatio >= requiredRR) {
    completedCount++;
  } else {
    failedConditions.push(
      `Minimum R:R requirement failed: Minimum 1:${requiredRR.toFixed(1)} required (Current 1:${input.calculatedRisk.rrRatio.toFixed(2)})`
    );
  }

  // 6. Daily trade limit
  if (input.tradesCountToday < input.maxTradesPerDay) {
    completedCount++;
  } else {
    failedConditions.push(`Daily Trade Limit reached: Maximum ${input.maxTradesPerDay} trades allowed per day`);
  }

  // 7. Daily loss limit
  if (input.dailyLossUsedPercentage < input.dailyLossLimitPercentage) {
    completedCount++;
  } else {
    failedConditions.push(
      `Daily Loss Limit reached: Max daily risk tolerance ${input.dailyLossLimitPercentage}% exhausted`
    );
  }

  // 8. Emotional state confirmation
  if (input.parameters.emotionalState) {
    completedCount++;
    if (['FOMO', 'REVENGE', 'TIRED'].includes(input.parameters.emotionalState)) {
      warnings.push(`Caution: Emotional state set to "${input.parameters.emotionalState}". Consider taking a breather before execution.`);
    }
  } else {
    failedConditions.push('Emotional State not selected');
  }

  // Trade Note review
  if (!input.parameters.tradeNote.trim()) {
    warnings.push('Trade Note: Briefly explaining why you are taking this setup helps prevent impulse trades.');
  }

  // 9. Final confirmation check
  const readyForFinalReview = failedConditions.length === 0;
  if (input.confirmations.finalLiabilityConfirmed) {
    completedCount++;
  } else {
    failedConditions.push('Final review confirmation unacknowledged');
  }

  // 10. Approval Expiration check
  if (!input.isApprovalExpired) {
    completedCount++;
  } else {
    failedConditions.push('Approval has expired (10-minute timeout reached)');
  }

  let status: GateStatus = 'LOCKED';
  const canApprove = readyForFinalReview && input.confirmations.finalLiabilityConfirmed && !input.isApprovalExpired;

  if (input.isApprovedState && canApprove) {
    status = 'APPROVED';
  } else if (input.isApprovalExpired) {
    status = 'EXPIRED';
  } else if (readyForFinalReview) {
    status = 'READY';
  } else {
    status = 'LOCKED';
  }

  return {
    status,
    failedConditions,
    completedConditionsCount: completedCount,
    totalConditionsCount: totalCount,
    warnings,
    canApprove,
    readyForFinalReview,
  };
}

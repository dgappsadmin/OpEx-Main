import React from 'react';
import { useCurrentPendingStage } from '@/hooks/useWorkflowTransactions';

interface CurrentStageProps {
  initiativeId: number | string;
  fallbackStage?: number;
}

// Correct workflow stage names matching backend
const WORKFLOW_STAGE_NAMES: { [key: number]: string } = {
  1: 'Register Initiative',
  2: 'Approval',
  3: 'Define Responsibilities',
  4: 'MOC Stage',
  5: 'CAPEX Stage',
  6: 'Initiative Timeline Tracker',
  7: 'Trial Implementation & Performance Check',
  8: 'Periodic Status Review with CMO',
  9: 'Savings Monitoring (1 Month)',
  10: 'Saving Validation with F&A',
  11: 'Initiative Closure'
};

export default function CurrentStage({ initiativeId, fallbackStage = 1 }: CurrentStageProps) {
  const { data: currentStageData, isLoading } = useCurrentPendingStage(Number(initiativeId));
  
  const stageName = currentStageData?.stageName || 
    WORKFLOW_STAGE_NAMES[fallbackStage] || 
    'Register Initiative';

  if (isLoading) {
    return <span className="text-muted-foreground animate-pulse">Loading...</span>;
  }

  return <span className="font-medium">{stageName}</span>;
}
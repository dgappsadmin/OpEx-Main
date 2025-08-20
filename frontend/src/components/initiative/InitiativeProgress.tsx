import React from 'react';
import { useProgressPercentage } from '@/hooks/useWorkflowTransactions';

interface InitiativeProgressProps {
  initiativeId: number | string;
  fallbackProgress?: number;
}

export default function InitiativeProgress({ initiativeId, fallbackProgress = 0 }: InitiativeProgressProps) {
  const { data: progressData, isLoading } = useProgressPercentage(Number(initiativeId));
  
  const actualProgress = progressData?.progressPercentage ?? fallbackProgress;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-12 bg-muted rounded-full h-1.5">
          <div className="bg-muted-foreground/30 h-1.5 rounded-full animate-pulse w-6"></div>
        </div>
        <span className="text-xs font-medium w-8">--</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 bg-muted rounded-full h-1.5">
        <div 
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${actualProgress}%` }}
        ></div>
      </div>
      <span className="text-xs font-medium w-8">{actualProgress}%</span>
    </div>
  );
}
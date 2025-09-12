// Dashboard stats types
export interface DashboardStats {
  totalInitiatives: number;
  actualSavings: number;
  completedInitiatives: number;
  pendingApprovals: number;
  totalInitiativesTrend: number;
  actualSavingsTrend: number;
  completedInitiativesTrend: number;
  pendingApprovalsTrend: number;
}

// Performance analysis types
export interface PerformanceMetrics {
  totalInitiatives: number;
  potentialSavingsAnnualized: number;
  potentialSavingsCurrentFY: number;
  actualSavingsCurrentFY: number;
  savingsProjectionCurrentFY: number;
  progressPercentage: number;
  // Trend fields for real-time comparison
  totalInitiativesTrend?: number;
  potentialSavingsAnnualizedTrend?: number;
  potentialSavingsCurrentFYTrend?: number;
  actualSavingsCurrentFYTrend?: number;
  savingsProjectionCurrentFYTrend?: number;
  progressPercentageTrend?: number;
}

export interface PerformanceAnalysisData {
  overall: PerformanceMetrics;
  budget: PerformanceMetrics;
  nonBudget: PerformanceMetrics;
  currentFinancialYear: string;
}
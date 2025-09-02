// Performance analysis types
export interface PerformanceMetrics {
  totalInitiatives: number;
  potentialSavingsAnnualized: number;
  potentialSavingsCurrentFY: number;
  actualSavingsCurrentFY: number;
  savingsProjectionCurrentFY: number;
  progressPercentage: number;
}

export interface PerformanceAnalysisData {
  overall: PerformanceMetrics;
  budget: PerformanceMetrics;
  nonBudget: PerformanceMetrics;
  currentFinancialYear: string;
}
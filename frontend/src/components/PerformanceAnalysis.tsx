import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Target, 
  IndianRupee,
  BarChart3,
  Activity,
  PieChart,
  TrendingDown
} from "lucide-react";
import { PerformanceMetrics } from "@/lib/types";

interface PerformanceAnalysisProps {
  title: string;
  subtitle: string;
  metrics: PerformanceMetrics;
  variant: 'overall' | 'budget' | 'nonBudget';
  isLoading: boolean;
  initiatives?: any[]; // Add initiatives data for filtering
}

export default function PerformanceAnalysis({ 
  title, 
  subtitle, 
  metrics, 
  variant, 
  isLoading,
  initiatives = [] // Add initiatives prop with default empty array
}: PerformanceAnalysisProps) {
  
  // Filter out rejected and dropped initiatives (similar to KPI.tsx logic)
  const filteredInitiatives = initiatives.filter((i: any) => 
    i.status !== 'Rejected' && i.status !== 'Dropped'
  );
  
  // Calculate filtered potential savings for Annualized and Current FY
  const filteredPotentialSavingsAnnualized = filteredInitiatives.length > 0 
    ? filteredInitiatives.reduce((sum: number, i: any) => {
        const savings = typeof i.expectedSavings === 'string' 
          ? parseFloat(i.expectedSavings.replace(/[₹L,]/g, '')) || 0
          : i.expectedSavings || 0;
        return sum + savings;
      }, 0)
    : 0;
    
  const filteredPotentialSavingsCurrentFY = filteredInitiatives.length > 0
    ? filteredInitiatives.reduce((sum: number, i: any) => {
        const savings = typeof i.expectedSavings === 'string' 
          ? parseFloat(i.expectedSavings.replace(/[₹L,]/g, '')) || 0
          : i.expectedSavings || 0;
        return sum + savings;
      }, 0)
    : 0;
  
  // Use filtered values for Annualized Potential and Current FY Potential, 
  // but keep original metrics for other values like Actual Savings
  const adjustedMetrics = {
    ...metrics,
    potentialSavingsAnnualized: filteredPotentialSavingsAnnualized,
    potentialSavingsCurrentFY: filteredPotentialSavingsCurrentFY,
  };
  
  // Smart currency formatting that handles all amounts automatically and removes trailing zeros
  const formatCurrencyInLakhs = (amount: number): string => {
    if (amount === 0) return "₹0";
    
    // Helper function to remove trailing zeros and unnecessary decimal points
    const cleanNumber = (num: number, decimals: number): string => {
      return parseFloat(num.toFixed(decimals)).toString();
    };
    
    if (amount >= 1000000000000) {
      // >= 1 Trillion: show in Trillion
      const trillions = amount / 1000000000000;
      return `₹${cleanNumber(trillions, 2)}T`;
    } else if (amount >= 10000000000) {
      // >= 1000 Crores: show in Thousand Crores
      const thousandCrores = amount / 10000000000;
      return `₹${cleanNumber(thousandCrores, 2)}TCr`;
    } else if (amount >= 10000000) {
      // >= 1 Crore: show in Crores
      const crores = amount / 10000000;
      return `₹${cleanNumber(crores, 2)}Cr`;
    } else if (amount >= 100000) {
      // >= 1 Lakh: show in Lakhs
      const lakhs = amount / 100000;
      return `₹${cleanNumber(lakhs, 2)}L`;
    } else if (amount >= 1000) {
      // >= 1 Thousand: show in Thousands
      const thousands = amount / 1000;
      return `₹${cleanNumber(thousands, 2)}K`;
    } else if (amount >= 1) {
      // >= 1 Rupee: show in Rupees without decimals for whole numbers
      return amount % 1 === 0 ? `₹${amount}` : `₹${cleanNumber(amount, 2)}`;
    } else {
      // < 1 Rupee: show in paisa with appropriate decimals
      return `₹${cleanNumber(amount, 2)}`;
    }
  };

  const getVariantColors = () => {
    switch (variant) {
      case 'overall': 
        return {
          primary: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          gradient: 'from-blue-500 to-blue-600',
          accent: 'bg-blue-100'
        };
      case 'budget': 
        return {
          primary: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          gradient: 'from-green-500 to-green-600',
          accent: 'bg-green-100'
        };
      case 'nonBudget': 
        return {
          primary: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          gradient: 'from-orange-500 to-orange-600',
          accent: 'bg-orange-100'
        };
      default: 
        return {
          primary: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          gradient: 'from-gray-500 to-gray-600',
          accent: 'bg-gray-100'
        };
    }
  };

  const colors = getVariantColors();

  // Calculate progress bar value (capped at 100% for display, but percentage can exceed 100%)
  const progressValue = Math.min(metrics?.progressPercentage || 0, 100);

  // Helper function to format trend percentage with proper rounding and no trailing zeros
  const formatTrend = (trend: number | null | undefined): string => {
    if (trend === null || trend === undefined || isNaN(trend)) return "0%";
    const sign = trend >= 0 ? "+" : "";
    const cleanTrend = parseFloat(trend.toFixed(2));
    return `${sign}${cleanTrend}%`;
  };

  // Helper function to determine trend direction
  const getTrendDirection = (trend: number | null | undefined): "up" | "down" => {
    if (trend === null || trend === undefined || isNaN(trend)) return "up";
    return trend >= 0 ? "up" : "down";
  };

  const kpiCards = [
    {
      title: "Total Initiatives",
      value: metrics?.totalInitiatives?.toString() || "0",
      subtitle: "Listed initiatives",
      icon: Target,
      trend: formatTrend(metrics?.totalInitiativesTrend) + " vs last period",
      trendDirection: getTrendDirection(metrics?.totalInitiativesTrend)
    },
    {
      title: "Annualized Potential",
      value: formatCurrencyInLakhs(adjustedMetrics?.potentialSavingsAnnualized || 0),
      subtitle: "Total yearly potential",
      icon: TrendingUp,
      trend: formatTrend(adjustedMetrics?.potentialSavingsAnnualizedTrend || metrics?.potentialSavingsAnnualizedTrend) + " vs target",
      trendDirection: getTrendDirection(adjustedMetrics?.potentialSavingsAnnualizedTrend || metrics?.potentialSavingsAnnualizedTrend)
    },
    {
      title: "Current FY Potential",
      value: formatCurrencyInLakhs(adjustedMetrics?.potentialSavingsCurrentFY || 0),
      subtitle: "This financial year",
      icon: IndianRupee,
      trend: formatTrend(adjustedMetrics?.potentialSavingsCurrentFYTrend || metrics?.potentialSavingsCurrentFYTrend) + " vs last FY",
      trendDirection: getTrendDirection(adjustedMetrics?.potentialSavingsCurrentFYTrend || metrics?.potentialSavingsCurrentFYTrend)
    },
    {
      title: "Actual Savings",
      value: formatCurrencyInLakhs(metrics?.actualSavingsCurrentFY || 0),
      subtitle: "Achieved this FY",
      icon: BarChart3,
      trend: formatTrend(metrics?.actualSavingsCurrentFYTrend) + " vs last FY",
      trendDirection: getTrendDirection(metrics?.actualSavingsCurrentFYTrend)
    },
    {
      title: "Projected Savings",
      value: formatCurrencyInLakhs(metrics?.savingsProjectionCurrentFY || 0),
      subtitle: "Expected this FY",
      icon: Activity,
      trend: formatTrend(metrics?.savingsProjectionCurrentFYTrend) + " vs forecast",
      trendDirection: getTrendDirection(metrics?.savingsProjectionCurrentFYTrend)
    }
  ];

  if (isLoading) {
    return (
      <Card className={`${colors.border} ${colors.bg} shadow-sm`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 bg-muted animate-pulse rounded"></div>
            <div className="space-y-1">
              <div className="h-4 w-40 bg-muted animate-pulse rounded"></div>
              <div className="h-2.5 w-28 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-2.5 bg-white rounded-lg border animate-pulse">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-2.5 w-2.5 bg-muted rounded"></div>
                    <div className="h-2.5 w-10 bg-muted rounded"></div>
                  </div>
                  <div className="h-5 w-14 bg-muted rounded"></div>
                  <div className="h-2 w-16 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${colors.border} ${colors.bg} shadow-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-lg bg-gradient-to-r ${colors.gradient} shadow-sm`}>
            <PieChart className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <CardTitle className={`text-base font-bold ${colors.primary}`}>
              {title}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {subtitle}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {kpiCards.map((kpi, index) => (
            <Card key={index} className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    <kpi.icon className={`h-3.5 w-3.5 ${colors.primary}`} />
                    {kpi.trendDirection === 'up' ? (
                      <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5 text-red-600" />
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-2xs px-1 py-0.5 ${
                      kpi.trendDirection === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                    }`}
                  >
                    {kpi.trend}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-lg text-foreground">{kpi.value}</h3>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xs text-muted-foreground">{kpi.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

 
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-lg ${colors.accent}`}>
                  <Target className={`h-3.5 w-3.5 ${colors.primary}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Performance Tracking</h3>
                  <p className="text-xs text-muted-foreground">Actual Savings vs Target Projection</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  (metrics?.progressPercentage || 0) > 100 
                    ? 'text-green-600' 
                    : (metrics?.progressPercentage || 0) >= 75 
                      ? 'text-blue-600' 
                      : 'text-foreground'
                }`}>
                  {parseFloat((metrics?.progressPercentage || 0).toFixed(2))}%
                </div>
                <div className="text-2xs text-muted-foreground">
                  {(metrics?.progressPercentage || 0) > 100 
                    ? 'Over-achieved!' 
                    : (metrics?.progressPercentage || 0) >= 100 
                      ? 'Target Met' 
                      : 'Progress'}
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Progress 
                value={progressValue} 
                className="h-1.5"
              />
              <div className="flex justify-between text-2xs text-muted-foreground">
                <span>Actual: {formatCurrencyInLakhs(metrics?.actualSavingsCurrentFY || 0)}</span>
                <span>Target: {formatCurrencyInLakhs(adjustedMetrics?.potentialSavingsCurrentFY || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats - Performance, Efficiency, Momentum commented out as not required */}
        {/* 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="font-semibold text-xs">Performance</span>
              </div>
              <div className="text-base font-bold">
                {progressValue >= 75 ? 'Excellent' : progressValue >= 50 ? 'Good' : 'Needs Focus'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <IndianRupee className="h-3.5 w-3.5" />
                <span className="font-semibold text-xs">Efficiency</span>
              </div>
              <div className="text-base font-bold">
                {((metrics?.actualSavingsCurrentFY || 0) / (metrics?.savingsProjectionCurrentFY || 1) * 100).toFixed(0)}%
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="h-3.5 w-3.5" />
                <span className="font-semibold text-xs">Momentum</span>
              </div>
              <div className="text-base font-bold">
                {metrics?.totalInitiatives ? 'Active' : 'Inactive'}
              </div>
            </CardContent>
          </Card>
        </div>
        */}
      </CardContent>
    </Card>
  );
}
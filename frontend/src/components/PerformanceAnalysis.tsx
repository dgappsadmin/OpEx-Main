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
}

export default function PerformanceAnalysis({ 
  title, 
  subtitle, 
  metrics, 
  variant, 
  isLoading 
}: PerformanceAnalysisProps) {
  
  // Enhanced currency formatting to show values in Lakhs
  const formatCurrencyInLakhs = (amount: number): string => {
    const lakhs = amount / 100000;
    if (lakhs >= 100) {
      return `₹${(lakhs/100).toFixed(2)}Cr`;
    }
    return `₹${lakhs.toFixed(2)}L`;
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

  // Calculate progress bar value (capped at 100%)
  const progressValue = Math.min(metrics?.progressPercentage || 0, 100);

  const kpiCards = [
    {
      title: "Total Initiatives",
      value: metrics?.totalInitiatives?.toString() || "0",
      subtitle: "Listed initiatives",
      icon: Target,
      trend: "+12% vs last FY"
    },
    {
      title: "Annualized Potential",
      value: formatCurrencyInLakhs(metrics?.potentialSavingsAnnualized || 0),
      subtitle: "Total yearly potential",
      icon: TrendingUp,
      trend: "+18% vs target"
    },
    {
      title: "Current FY Potential",
      value: formatCurrencyInLakhs(metrics?.potentialSavingsCurrentFY || 0),
      subtitle: "This financial year",
      icon: IndianRupee,
      trend: "On track"
    },
    {
      title: "Actual Savings",
      value: formatCurrencyInLakhs(metrics?.actualSavingsCurrentFY || 0),
      subtitle: "Achieved this FY",
      icon: BarChart3,
      trend: "+24% vs last FY"
    },
    {
      title: "Projected Savings",
      value: formatCurrencyInLakhs(metrics?.savingsProjectionCurrentFY || 0),
      subtitle: "Expected this FY",
      icon: Activity,
      trend: "Forecasted"
    }
  ];

  if (isLoading) {
    return (
      <Card className={`${colors.border} ${colors.bg}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            <div className="space-y-1.5">
              <div className="h-5 w-48 bg-muted animate-pulse rounded"></div>
              <div className="h-3 w-36 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border animate-pulse">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-3 bg-muted rounded"></div>
                    <div className="h-3 w-12 bg-muted rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-muted rounded"></div>
                  <div className="h-2.5 w-20 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${colors.border} ${colors.bg} shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${colors.gradient} shadow-md`}>
            <PieChart className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className={`text-lg font-bold ${colors.primary}`}>
              {title}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {subtitle}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {kpiCards.map((kpi, index) => (
            <Card key={index} className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-4 w-4 ${colors.primary}`} />
                  <Badge variant="secondary" className="text-2xs px-1.5 py-0.5">
                    {kpi.trend}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-xl text-foreground">{kpi.value}</h3>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xs text-muted-foreground">{kpi.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress Section */}
        <Card className="bg-white border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${colors.accent}`}>
                  <Target className={`h-4 w-4 ${colors.primary}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Progress Tracking</h3>
                  <p className="text-xs text-muted-foreground">Savings Projection vs Potential Savings</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-foreground">
                  {(metrics?.progressPercentage || 0).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Completion</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={progressValue} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Projected: {formatCurrencyInLakhs(metrics?.savingsProjectionCurrentFY || 0)}</span>
                <span>Target: {formatCurrencyInLakhs(metrics?.potentialSavingsCurrentFY || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold text-sm">Performance</span>
              </div>
              <div className="text-lg font-bold">
                {progressValue >= 75 ? 'Excellent' : progressValue >= 50 ? 'Good' : 'Needs Focus'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <IndianRupee className="h-4 w-4" />
                <span className="font-semibold text-sm">Efficiency</span>
              </div>
              <div className="text-lg font-bold">
                {((metrics?.actualSavingsCurrentFY || 0) / (metrics?.savingsProjectionCurrentFY || 1) * 100).toFixed(0)}%
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Activity className="h-4 w-4" />
                <span className="font-semibold text-sm">Momentum</span>
              </div>
              <div className="text-lg font-bold">
                {metrics?.totalInitiatives ? 'Active' : 'Inactive'}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
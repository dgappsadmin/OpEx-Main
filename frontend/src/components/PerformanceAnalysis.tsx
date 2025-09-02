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
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-muted animate-pulse rounded"></div>
            <div className="space-y-2">
              <div className="h-6 w-64 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 bg-white rounded-lg border animate-pulse">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-4 bg-muted rounded"></div>
                    <div className="h-4 w-16 bg-muted rounded"></div>
                  </div>
                  <div className="h-8 w-20 bg-muted rounded"></div>
                  <div className="h-3 w-24 bg-muted rounded"></div>
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
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${colors.gradient} shadow-md`}>
            <PieChart className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className={`text-xl font-bold ${colors.primary}`}>
              {title}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {subtitle}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {kpiCards.map((kpi, index) => (
            <Card key={index} className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <kpi.icon className={`h-5 w-5 ${colors.primary}`} />
                  <Badge variant="secondary" className="text-xs">
                    {kpi.trend}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-2xl text-foreground">{kpi.value}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress Section */}
        <Card className="bg-white border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.accent}`}>
                  <Target className={`h-5 w-5 ${colors.primary}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Progress Tracking</h3>
                  <p className="text-sm text-muted-foreground">Savings Projection vs Potential Savings</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  {(metrics?.progressPercentage || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Completion</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Progress 
                value={progressValue} 
                className="h-3"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Projected: {formatCurrencyInLakhs(metrics?.savingsProjectionCurrentFY || 0)}</span>
                <span>Target: {formatCurrencyInLakhs(metrics?.potentialSavingsCurrentFY || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Performance</span>
              </div>
              <div className="text-2xl font-bold">
                {progressValue >= 75 ? 'Excellent' : progressValue >= 50 ? 'Good' : 'Needs Focus'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <IndianRupee className="h-5 w-5" />
                <span className="font-semibold">Efficiency</span>
              </div>
              <div className="text-2xl font-bold">
                {((metrics?.actualSavingsCurrentFY || 0) / (metrics?.savingsProjectionCurrentFY || 1) * 100).toFixed(0)}%
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="h-5 w-5" />
                <span className="font-semibold">Momentum</span>
              </div>
              <div className="text-2xl font-bold">
                {metrics?.totalInitiatives ? 'Active' : 'Inactive'}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
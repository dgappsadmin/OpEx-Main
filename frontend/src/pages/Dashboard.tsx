import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  IndianRupee,
  FileText,
  CheckCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  PieChart,
  Activity,
  TrendingDown,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { User } from "@/lib/mockData";
import { useDashboardStats, useRecentInitiatives, usePerformanceAnalysis, useDashboardSites } from "@/hooks/useDashboard";
import { useInitiatives } from "@/hooks/useInitiatives";
import { DashboardStats } from "@/lib/types";
import PerformanceAnalysis from "@/components/PerformanceAnalysis";
import { reportsAPI } from "@/lib/api";

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  
  // State for site filter - defaults to user's site
  const [selectedSite, setSelectedSite] = useState<string>(user.site || "overall");
  
  // State for financial year filter
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('');
  const [availableFinancialYears, setAvailableFinancialYears] = useState<string[]>([]);
  
  // Determine which site to use for API calls
  const apiSite = selectedSite === "overall" ? undefined : selectedSite;
  
  // Fetch available sites for filter
  const { data: availableSites, isLoading: sitesLoading } = useDashboardSites();
  
  // Fetch available financial years on component mount
  useEffect(() => {
    const fetchAvailableFinancialYears = async () => {
      try {
        const years = await reportsAPI.getAvailableFinancialYears();
        setAvailableFinancialYears(years);
        if (years.length > 0 && !selectedFinancialYear) {
          setSelectedFinancialYear(years[0]); // Set current FY as default
        }
      } catch (error) {
        console.error('Error fetching available financial years:', error);
      }
    };

    fetchAvailableFinancialYears();
  }, []);

  // Convert selectedFinancialYear to full year format for API calls (similar to Reports.tsx)
  const convertToFullYear = (year: string): string => {
    if (!year) return '';
    return year.length === 2 ? `20${year}` : year;
  };

  const fullYearForAPI = selectedFinancialYear ? convertToFullYear(selectedFinancialYear) : undefined;
  
  // Debug logging to verify financial year conversion
  console.log('🔍 Dashboard FY Debug:', {
    selectedFinancialYear,
    fullYearForAPI,
    apiSite
  });
  
  // Fetch real dashboard data based on selected filter
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useDashboardStats(apiSite, fullYearForAPI);
  const { data: recentInitiativesData, isLoading: initiativesLoading, error: initiativesError } = useRecentInitiatives(apiSite, fullYearForAPI);
  const { data: performanceAnalysisData, isLoading: performanceLoading, error: performanceError } = usePerformanceAnalysis(apiSite, fullYearForAPI);
  
  // Fetch initiatives data for filtering in PerformanceAnalysis
  const { data: initiativesData } = useInitiatives(apiSite ? { site: apiSite } : {});
  
  // Process initiatives data for PerformanceAnalysis
  const initiatives = (Array.isArray(initiativesData?.content) && initiativesData.content.length > 0) 
    ? initiativesData.content 
    : (Array.isArray(initiativesData) && initiativesData.length > 0) 
    ? initiativesData 
    : [];

  // Enhanced currency formatting
  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) { // 1 crore or more
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) { // 1 lakh or more
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) { // 1 thousand or more
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  // Helper function to format trend percentage
  const formatTrend = (trend: number | null | undefined): string => {
    if (trend === null || trend === undefined || isNaN(trend)) return "0%";
    const sign = trend >= 0 ? "+" : "";
    return `${sign}${trend.toFixed(1)}%`;
  };

  // Helper function to determine trend direction
  const getTrendDirection = (trend: number | null | undefined): "up" | "down" => {
    if (trend === null || trend === undefined || isNaN(trend)) return "up";
    return trend >= 0 ? "up" : "down";
  };

  // Create stats array from API data with real trends
  const stats = [
    {
      title: "Total Initiatives",
      value: statsLoading ? "..." : (dashboardStats?.totalInitiatives || 0).toString(),
      change: statsLoading ? "..." : formatTrend(dashboardStats?.totalInitiativesTrend),
      trend: getTrendDirection(dashboardStats?.totalInitiativesTrend),
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Actual Savings",
      value: statsLoading ? "..." : formatCurrency(dashboardStats?.actualSavings || 0),
      change: statsLoading ? "..." : formatTrend(dashboardStats?.actualSavingsTrend),
      trend: getTrendDirection(dashboardStats?.actualSavingsTrend),
      icon: IndianRupee,
      color: "text-green-600"
    },
    {
      title: "Completed",
      value: statsLoading ? "..." : (dashboardStats?.completedInitiatives || 0).toString(),
      change: statsLoading ? "..." : formatTrend(dashboardStats?.completedInitiativesTrend),
      trend: getTrendDirection(dashboardStats?.completedInitiativesTrend),
      icon: CheckCircle,
      color: "text-emerald-600"
    },
    {
      title: "Pending Approval",
      value: statsLoading ? "..." : (dashboardStats?.pendingApprovals || 0).toString(),
      change: statsLoading ? "..." : formatTrend(dashboardStats?.pendingApprovalsTrend),
      trend: getTrendDirection(dashboardStats?.pendingApprovalsTrend),
      icon: Clock,
      color: "text-orange-600"
    }
  ];

  // Format recent initiatives from API data
  const recentInitiatives = initiativesLoading ? [] : (recentInitiativesData || []).slice(0, 3).map((initiative: any) => {
    // Calculate progress based on current stage and status
    // Stage 1 approved = 10%, Stage 2 approved = 20%, ..., Stage 10 approved = 100%
    let progress = 0;
    const currentStage = initiative.currentStage || 1;
    const status = initiative.status?.trim();
    
    if (status === 'Completed') {
      // If status is Completed, show 100%
      progress = 100;
    } else {
      // Calculate progress: each approved stage = 10%
      // If currentStage is 3, it means stages 1 and 2 are approved = 20%
      // Current stage is the next pending stage, so approved stages = currentStage - 1
      const approvedStages = Math.max(0, currentStage - 1);
      progress = Math.min(100, (approvedStages * 100) / 10);
    }
    
    return {
      id: initiative.id,
      title: initiative.initiativeNumber || initiative.title,
      site: initiative.site,
      status: initiative.status,
      savings: formatCurrency(initiative.expectedSavings || 0),
      progress: Math.round(progress),
      priority: initiative.priority
    };
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved": 
      case "completed": 
        return "bg-green-500 hover:bg-green-600 text-white";
      case "under review": 
      case "pending": 
        return "bg-yellow-500 hover:bg-yellow-600 text-white";
      case "in progress": 
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "rejected": 
        return "bg-red-500 hover:bg-red-600 text-white";
      case "dropped": 
        return "bg-orange-500 hover:bg-orange-600 text-white";
      default: 
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            OpEx Dashboard {selectedSite !== "overall" && `- ${selectedSite}`}
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Welcome back, {user.fullName}! {selectedSite === "overall" ? "Viewing overall stats" : `Viewing ${selectedSite} site data`}
          </p>
        </div>
        <Button onClick={() => navigate('/initiative/new')} className="gap-1.5 shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-9 px-4 text-xs">
          <Plus className="h-3.5 w-3.5" />
          New Initiative
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Site Filter */}
        <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Filter by Site:</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-40 h-8 text-xs bg-white border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall" className="text-xs">Overall</SelectItem>
                {!sitesLoading && availableSites?.map((site: string) => (
                  <SelectItem key={site} value={site} className="text-xs">
                    {site}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSite !== "overall" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSite("overall")}
                className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Financial Year Filter */}
        <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Financial Year:</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedFinancialYear} onValueChange={setSelectedFinancialYear}>
              <SelectTrigger className="w-40 h-8 text-xs bg-white border-gray-300 focus:border-green-500">
                <SelectValue placeholder="Select FY" />
              </SelectTrigger>
              <SelectContent>
                {availableFinancialYears.map((fy) => (
                  <SelectItem key={fy} value={fy} className="text-xs">
                    FY {fy}-{(parseInt(fy) + 1).toString().slice(-2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto lg:mx-0 h-9">
          <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" />
            Performance Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {statsError ? (
              <div className="col-span-full">
                <Card className="border-red-200 bg-red-50 shadow-sm">
                  <CardContent className="p-3 text-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                    <p className="text-xs text-red-600">Failed to load dashboard statistics</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              stats.map((stat) => (
                <Card key={stat.title} className="relative overflow-hidden group hover:shadow-md transition-all duration-200 shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200`}>
                      <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 relative z-10 px-3">
                    <div className="text-xl font-bold break-words mb-1">
                      {statsLoading ? (
                        <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        stat.value
                      )}
                    </div>
                    <p className={`text-2xs flex items-center gap-1 ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend === 'up' ? (
                        <TrendingUp className="h-2.5 w-2.5" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5" />
                      )}
                      {stat.change} from last month
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Recent Initiatives and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Recent Initiatives {selectedSite !== "overall" && `- ${selectedSite}`}
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedSite === "overall" 
                    ? "Latest submitted initiatives requiring attention" 
                    : `Latest initiatives from ${selectedSite} site`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {initiativesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 border border-border rounded-lg space-y-2 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-10 bg-muted rounded"></div>
                            <div className="h-3 w-14 bg-muted rounded"></div>
                          </div>
                          <div className="h-3 w-16 bg-muted rounded"></div>
                        </div>
                        <div className="h-3 w-3/4 bg-muted rounded"></div>
                        <div className="h-1.5 w-full bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : initiativesError ? (
                  <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                    <p className="text-xs text-red-600">Failed to load recent initiatives</p>
                  </div>
                ) : recentInitiatives.length === 0 ? (
                  <div className="p-3 border border-dashed border-border rounded-lg text-center">
                    <FileText className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No recent initiatives found</p>
                  </div>
                ) : (
                  recentInitiatives.map((initiative) => (
                    <div key={initiative.id} className="p-3 border border-border rounded-lg space-y-2 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {/* <Badge variant="outline" className="font-mono text-2xs">
                            {initiative.id}
                          </Badge> */}
                          {/* <Badge variant={getPriorityColor(initiative.priority)} className="text-2xs">
                            {initiative.priority}
                          </Badge> */}
                        </div>
                        <Badge className={`${getStatusColor(initiative.status)} text-2xs`}>
                          {initiative.status}
                        </Badge>
                      </div>
                      
                      <h4 className="font-semibold text-foreground text-xs line-clamp-1">{initiative.title}</h4>
                      
                      <div className="flex items-center justify-between text-2xs text-muted-foreground">
                        <span>Site: {initiative.site}</span>
                        <span className="font-semibold text-green-600">{initiative.savings}</span>
                      </div>
                      
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${initiative.progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-2xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-medium">{initiative.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-blue-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-xs">
                  Frequently used actions and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2.5 h-10 text-xs hover:bg-blue-50 hover:border-blue-200 transition-all"
                  onClick={() => navigate('/initiative/new')}
                >
                  <div className="p-1 rounded bg-blue-100">
                    <Plus className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Submit New Initiative
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2.5 h-10 text-xs hover:bg-green-50 hover:border-green-200 transition-all"
                  onClick={() => navigate('/workflow')}
                >
                  <div className="p-1 rounded bg-green-100">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Review Pending Approvals
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2.5 h-10 text-xs hover:bg-purple-50 hover:border-purple-200 transition-all"
                  onClick={() => navigate('/reports')}
                >
                  <div className="p-1 rounded bg-purple-100">
                    <BarChart3 className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  Generate Monthly Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2.5 h-10 text-xs hover:bg-orange-50 hover:border-orange-200 transition-all"
                  onClick={() => navigate('/timeline-tracker')}
                >
                  <div className="p-1 rounded bg-orange-100">
                    <Clock className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  Update Timeline Status
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Notifications */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!statsLoading && dashboardStats && dashboardStats.pendingApprovals > 0 && (
                  <div className="flex items-start gap-2.5 p-3 border border-orange-200 bg-orange-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-xs">
                        {dashboardStats.pendingApprovals} initiative{dashboardStats.pendingApprovals !== 1 ? 's' : ''} pending approval
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dashboardStats.pendingApprovals === 1 ? 'Review required' : 'Reviews required'} for workflow stages
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('/workflow')} className="shrink-0 h-8 px-3 text-xs">
                      View
                    </Button>
                  </div>
                )}
                
                {!statsLoading && (!dashboardStats || dashboardStats.pendingApprovals === 0) && (
                  <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-xs">All caught up!</p>
                        <p className="text-xs text-muted-foreground mt-1">No pending approvals at this time</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analysis Tab */}
        <TabsContent value="performance" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Performance Analysis Dashboard</h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                Financial Year: <span className="font-semibold text-blue-600">
                  {selectedFinancialYear ? `FY ${selectedFinancialYear}-${(parseInt(selectedFinancialYear) + 1).toString().slice(-2)}` : 'Loading...'}
                </span>
              </p>
            </div>
            {performanceError && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                Failed to load performance data
              </div>
            )}
          </div>

          {/* Performance Analysis - Overall */}
          <PerformanceAnalysis
            title={selectedSite === "overall" ? "PERFORMANCE ANALYSIS - OVERALL" : `PERFORMANCE ANALYSIS - OVERALL (${selectedSite})`}
            subtitle={selectedSite === "overall" ? "Total performance metrics for all listed initiatives" : `Total performance metrics for ${selectedSite} site initiatives`}
            metrics={performanceAnalysisData?.overall || {
              totalInitiatives: 0,
              potentialSavingsAnnualized: 0,
              potentialSavingsCurrentFY: 0,
              actualSavingsCurrentFY: 0,
              savingsProjectionCurrentFY: 0,
              progressPercentage: 0
            }}
            variant="overall"
            isLoading={performanceLoading}
            initiatives={initiatives}
            selectedFinancialYear={selectedFinancialYear}
          />

          {/* Performance Analysis - Budget */}
          <PerformanceAnalysis
            title={selectedSite === "overall" ? "PERFORMANCE ANALYSIS - BUDGET" : `PERFORMANCE ANALYSIS - BUDGET (${selectedSite})`}
            subtitle={selectedSite === "overall" ? "Performance metrics for budgeted initiatives only" : `Performance metrics for ${selectedSite} site budgeted initiatives only`}
            metrics={performanceAnalysisData?.budget || {
              totalInitiatives: 0,
              potentialSavingsAnnualized: 0,
              potentialSavingsCurrentFY: 0,
              actualSavingsCurrentFY: 0,
              savingsProjectionCurrentFY: 0,
              progressPercentage: 0
            }}
            variant="budget"
            isLoading={performanceLoading}
            initiatives={initiatives.filter((i: any) => i.budgetStatus === 'Budgeted' || i.isBudgeted === true)}
            selectedFinancialYear={selectedFinancialYear}
          />

          {/* Performance Analysis - Non-Budget */}
          <PerformanceAnalysis
            title={selectedSite === "overall" ? "PERFORMANCE ANALYSIS - NON-BUDGET" : `PERFORMANCE ANALYSIS - NON-BUDGET (${selectedSite})`}
            subtitle={selectedSite === "overall" ? "Performance metrics for non-budgeted initiatives only" : `Performance metrics for ${selectedSite} site non-budgeted initiatives only`}
            metrics={performanceAnalysisData?.nonBudget || {
              totalInitiatives: 0,
              potentialSavingsAnnualized: 0,
              potentialSavingsCurrentFY: 0,
              actualSavingsCurrentFY: 0,
              savingsProjectionCurrentFY: 0,
              progressPercentage: 0
            }}
            variant="nonBudget"
            isLoading={performanceLoading}
            initiatives={initiatives.filter((i: any) => i.budgetStatus !== 'Budgeted' && i.isBudgeted !== true)}
            selectedFinancialYear={selectedFinancialYear}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/mockData";
import { useDashboardStats, useRecentInitiatives, usePerformanceAnalysis } from "@/hooks/useDashboard";
import PerformanceAnalysis from "@/components/PerformanceAnalysis";

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  
  // Use site-specific data if user has a site, otherwise get overall stats
  const userSite = user.site !== 'ALL' ? user.site : undefined;
  
  // Fetch real dashboard data
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useDashboardStats(userSite);
  const { data: recentInitiativesData, isLoading: initiativesLoading, error: initiativesError } = useRecentInitiatives(userSite);
  const { data: performanceAnalysisData, isLoading: performanceLoading, error: performanceError } = usePerformanceAnalysis();

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

  // Create stats array from API data
  const stats = [
    {
      title: "Total Initiatives",
      value: statsLoading ? "..." : (dashboardStats?.totalInitiatives || 0).toString(),
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Actual Savings",
      value: statsLoading ? "..." : formatCurrency(dashboardStats?.actualSavings || 0),
      change: "+28%",
      trend: "up",
      icon: IndianRupee,
      color: "text-green-600"
    },
    {
      title: "Completed",
      value: statsLoading ? "..." : (dashboardStats?.completedInitiatives || 0).toString(),
      change: "+5%",
      trend: "up",
      icon: CheckCircle,
      color: "text-emerald-600"
    },
    {
      title: "Pending Approval",
      value: statsLoading ? "..." : (dashboardStats?.pendingApprovals || 0).toString(),
      change: "-2%",
      trend: "down",
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
            OpEx Dashboard
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Welcome back, {user.fullName}!
          </p>
        </div>
        <Button onClick={() => navigate('/initiative/new')} className="gap-1.5 shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-9 px-4 text-xs">
          <Plus className="h-3.5 w-3.5" />
          New Initiative
        </Button>
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
                      <TrendingUp className="h-2.5 w-2.5" />
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
                  Recent Initiatives
                </CardTitle>
                <CardDescription className="text-xs">
                  Latest submitted initiatives requiring attention
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
                          <Badge variant="outline" className="font-mono text-2xs">
                            {initiative.id}
                          </Badge>
                          <Badge variant={getPriorityColor(initiative.priority)} className="text-2xs">
                            {initiative.priority}
                          </Badge>
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
                Financial Year: <span className="font-semibold text-blue-600">{performanceAnalysisData?.currentFinancialYear || 'Loading...'}</span>
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
            title="PERFORMANCE ANALYSIS - OVERALL"
            subtitle="Total performance metrics for all listed initiatives"
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
          />

          {/* Performance Analysis - Budget */}
          <PerformanceAnalysis
            title="PERFORMANCE ANALYSIS - BUDGET"
            subtitle="Performance metrics for budgeted initiatives only"
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
          />

          {/* Performance Analysis - Non-Budget */}
          <PerformanceAnalysis
            title="PERFORMANCE ANALYSIS - NON-BUDGET"
            subtitle="Performance metrics for non-budgeted initiatives only"
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
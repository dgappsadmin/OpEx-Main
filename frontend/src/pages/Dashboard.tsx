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
  const recentInitiatives = initiativesLoading ? [] : (recentInitiativesData || []).slice(0, 3).map((initiative: any) => ({
    id: initiative.id,
    title: initiative.initiativeNumber || initiative.title,
    site: initiative.site,
    status: initiative.status,
    savings: formatCurrency(initiative.expectedSavings || 0),
    progress: Math.round(((initiative.currentStage || 1) - 1) * 100 / 10), // Calculate progress based on current stage
    priority: initiative.priority
  }));

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
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            OpEx Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {user.fullName}! Monitor your operational excellence initiatives
          </p>
        </div>
        <Button onClick={() => navigate('/initiative/new')} className="gap-2 shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
          <Plus className="h-4 w-4" />
          New Initiative
        </Button>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto lg:mx-0">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsError ? (
              <div className="col-span-full">
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-600">Failed to load dashboard statistics</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              stats.map((stat) => (
                <Card key={stat.title} className="relative overflow-hidden group hover:shadow-lg transition-all duration-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 relative z-10">
                    <div className="text-2xl font-bold break-words mb-1">
                      {statsLoading ? (
                        <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                      ) : (
                        stat.value
                      )}
                    </div>
                    <p className={`text-xs flex items-center gap-1 ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="h-3 w-3" />
                      {stat.change} from last month
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Recent Initiatives and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Recent Initiatives
                </CardTitle>
                <CardDescription className="text-sm">
                  Latest submitted initiatives requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {initiativesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border border-border rounded-lg space-y-3 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-12 bg-muted rounded"></div>
                            <div className="h-4 w-16 bg-muted rounded"></div>
                          </div>
                          <div className="h-4 w-20 bg-muted rounded"></div>
                        </div>
                        <div className="h-4 w-3/4 bg-muted rounded"></div>
                        <div className="h-2 w-full bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : initiativesError ? (
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-600">Failed to load recent initiatives</p>
                  </div>
                ) : recentInitiatives.length === 0 ? (
                  <div className="p-4 border border-dashed border-border rounded-lg text-center">
                    <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent initiatives found</p>
                  </div>
                ) : (
                  recentInitiatives.map((initiative) => (
                    <div key={initiative.id} className="p-4 border border-border rounded-lg space-y-3 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {initiative.id}
                          </Badge>
                          <Badge variant={getPriorityColor(initiative.priority)} className="text-xs">
                            {initiative.priority}
                          </Badge>
                        </div>
                        <Badge className={`${getStatusColor(initiative.status)} text-xs`}>
                          {initiative.status}
                        </Badge>
                      </div>
                      
                      <h4 className="font-semibold text-foreground text-sm line-clamp-1">{initiative.title}</h4>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Site: {initiative.site}</span>
                        <span className="font-semibold text-green-600">{initiative.savings}</span>
                      </div>
                      
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${initiative.progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-medium">{initiative.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-sm">
                  Frequently used actions and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12 text-sm hover:bg-blue-50 hover:border-blue-200 transition-all"
                  onClick={() => navigate('/initiative/new')}
                >
                  <div className="p-1 rounded bg-blue-100">
                    <Plus className="h-4 w-4 text-blue-600" />
                  </div>
                  Submit New Initiative
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12 text-sm hover:bg-green-50 hover:border-green-200 transition-all"
                  onClick={() => navigate('/workflow')}
                >
                  <div className="p-1 rounded bg-green-100">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  Review Pending Approvals
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12 text-sm hover:bg-purple-50 hover:border-purple-200 transition-all"
                  onClick={() => navigate('/reports')}
                >
                  <div className="p-1 rounded bg-purple-100">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  Generate Monthly Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12 text-sm hover:bg-orange-50 hover:border-orange-200 transition-all"
                  onClick={() => navigate('/timeline')}
                >
                  <div className="p-1 rounded bg-orange-100">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  Update Timeline Status
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Notifications */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!statsLoading && dashboardStats && dashboardStats.pendingApprovals > 0 && (
                  <div className="flex items-start gap-3 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">
                        {dashboardStats.pendingApprovals} initiative{dashboardStats.pendingApprovals !== 1 ? 's' : ''} pending approval
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dashboardStats.pendingApprovals === 1 ? 'Review required' : 'Reviews required'} for workflow stages
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('/workflow')} className="shrink-0">
                      View
                    </Button>
                  </div>
                )}
                
                {!statsLoading && (!dashboardStats || dashboardStats.pendingApprovals === 0) && (
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">All caught up!</p>
                        <p className="text-sm text-muted-foreground mt-1">No pending approvals at this time</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analysis Tab */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Performance Analysis Dashboard</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Financial Year: <span className="font-semibold text-blue-600">{performanceAnalysisData?.currentFinancialYear || 'Loading...'}</span>
              </p>
            </div>
            {performanceError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
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
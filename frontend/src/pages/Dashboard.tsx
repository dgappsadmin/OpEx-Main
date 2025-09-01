import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/mockData";
import { useDashboardStats, useRecentInitiatives } from "@/hooks/useDashboard";

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
    <div className="container mx-auto p-4 space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user.fullName}! Monitor your operational excellence initiatives</p>
        </div>
        <Button onClick={() => navigate('/initiative/new')} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New Initiative
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            <Card key={stat.title} className="compact-kpi-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-xl font-bold break-words">
                  {statsLoading ? (
                    <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <p className={`text-xs flex items-center gap-1 mt-1 ${
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
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
                  <div key={i} className="p-3 border border-border rounded-lg space-y-2 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-12 bg-muted rounded"></div>
                        <div className="h-4 w-16 bg-muted rounded"></div>
                      </div>
                      <div className="h-4 w-20 bg-muted rounded"></div>
                    </div>
                    <div className="h-3 w-3/4 bg-muted rounded"></div>
                    <div className="h-2 w-full bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : initiativesError ? (
              <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-600">Failed to load recent initiatives</p>
              </div>
            ) : recentInitiatives.length === 0 ? (
              <div className="p-3 border border-dashed border-border rounded-lg text-center">
                <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent initiatives found</p>
              </div>
            ) : (
              recentInitiatives.map((initiative) => (
                <div key={initiative.id} className="p-3 border border-border rounded-lg space-y-2 hover:shadow-md transition-shadow">
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
                  
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all" 
                      style={{ width: `${initiative.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{initiative.progress}%</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-sm">
              Frequently used actions and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 h-10 text-sm"
              onClick={() => navigate('/initiative/new')}
            >
              <Plus className="h-4 w-4" />
              Submit New Initiative
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 h-10 text-sm"
              onClick={() => navigate('/workflow')}
            >
              <CheckCircle className="h-4 w-4" />
              Review Pending Approvals
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 h-10 text-sm"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="h-4 w-4" />
              Generate Monthly Report
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 h-10 text-sm"
              onClick={() => navigate('/timeline')}
            >
              <Clock className="h-4 w-4" />
              Update Timeline Status
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!statsLoading && dashboardStats && dashboardStats.pendingApprovals > 0 && (
              <div className="flex items-start gap-3 p-3 border border-orange-200 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {dashboardStats.pendingApprovals} initiative{dashboardStats.pendingApprovals !== 1 ? 's' : ''} pending approval
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dashboardStats.pendingApprovals === 1 ? 'Review required' : 'Reviews required'} for workflow stages
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/workflow')} className="shrink-0">
                  View
                </Button>
              </div>
            )}
            
            {statsLoading && (
              <div className="space-y-3">
                <div className="h-12 bg-muted animate-pulse rounded-lg"></div>
                <div className="h-12 bg-muted animate-pulse rounded-lg"></div>
              </div>
            )}
            
            {!statsLoading && (!dashboardStats || dashboardStats.pendingApprovals === 0) && (
              <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">All caught up!</p>
                    <p className="text-sm text-muted-foreground">No pending approvals at this time</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
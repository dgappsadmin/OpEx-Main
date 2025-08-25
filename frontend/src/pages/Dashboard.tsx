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
  Plus
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

  // Create stats array from API data
  const stats = [
    {
      title: "Total Initiatives",
      value: statsLoading ? "..." : (dashboardStats?.totalInitiatives || 0).toString(),
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Actual Savings",
      value: statsLoading ? "..." : `₹${(dashboardStats?.actualSavings || 0)}K`,
      change: "+28%",
      trend: "up",
      icon: IndianRupee,
      color: "text-success"
    },
    {
      title: "Completed",
      value: statsLoading ? "..." : (dashboardStats?.completedInitiatives || 0).toString(),
      change: "+5%",
      trend: "up",
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Pending Approval",
      value: statsLoading ? "..." : (dashboardStats?.pendingApprovals || 0).toString(),
      change: "-2%",
      trend: "down",
      icon: Clock,
      color: "text-warning"
    }
  ];

  // Format recent initiatives from API data
  const recentInitiatives = initiativesLoading ? [] : (recentInitiativesData || []).slice(0, 3).map((initiative: any) => ({
    id: initiative.id,
    title: initiative.initiativeNumber || initiative.title,
    site: initiative.site,
    status: initiative.status,
    savings: `₹${initiative.expectedSavings || 0}K`,
    progress: Math.round(((initiative.currentStage || 1) - 1) * 100 / 10), // Calculate progress based on current stage
    priority: initiative.priority
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "bg-success text-success-foreground";
      case "Under Review": return "bg-warning text-warning-foreground";
      case "In Progress": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-destructive text-destructive-foreground";
      case "Medium": return "bg-warning text-warning-foreground";
      case "Low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.fullName}! Monitor your operational excellence initiatives</p>
        </div>
        <Button onClick={() => navigate('/initiative/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Initiative
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsError ? (
          <div className="col-span-full">
            <Card className="border-destructive/20 bg-destructive/10">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive">Failed to load dashboard statistics</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <p className={`text-xs flex items-center gap-1 ${
                  stat.trend === 'up' ? 'text-success' : 'text-destructive'
                }`}>
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Initiatives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Recent Initiatives
            </CardTitle>
            <CardDescription>
              Latest submitted initiatives requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {initiativesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-border rounded-lg space-y-3 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-12 bg-muted rounded"></div>
                        <div className="h-5 w-16 bg-muted rounded"></div>
                      </div>
                      <div className="h-5 w-20 bg-muted rounded"></div>
                    </div>
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
                    <div className="h-2 w-full bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : initiativesError ? (
              <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive">Failed to load recent initiatives</p>
              </div>
            ) : recentInitiatives.length === 0 ? (
              <div className="p-4 border border-dashed border-border rounded-lg text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent initiatives found</p>
              </div>
            ) : (
              recentInitiatives.map((initiative) => (
                <div key={initiative.id} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {initiative.id}
                      </Badge>
                      <Badge className={getPriorityColor(initiative.priority)}>
                        {initiative.priority}
                      </Badge>
                    </div>
                    <Badge className={getStatusColor(initiative.status)}>
                      {initiative.status}
                    </Badge>
                  </div>
                  
                   <h4 className="font-semibold text-foreground">{initiative.title}</h4>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Site: {initiative.site}</span>
                    <span className="font-semibold text-success">{initiative.savings}</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Frequently used actions and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 h-12"
              onClick={() => navigate('/initiative/new')}
            >
              <Plus className="h-4 w-4" />
              Submit New Initiative
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 h-12"
              onClick={() => navigate('/workflow')}
            >
              <CheckCircle className="h-4 w-4" />
              Review Pending Approvals
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 h-12"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="h-4 w-4" />
              Generate Monthly Report
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 h-12"
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!statsLoading && dashboardStats && dashboardStats.pendingApprovals > 0 && (
              <div className="flex items-start gap-3 p-3 border border-warning/20 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {dashboardStats.pendingApprovals} initiative{dashboardStats.pendingApprovals !== 1 ? 's' : ''} pending approval
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dashboardStats.pendingApprovals === 1 ? 'Review required' : 'Reviews required'} for workflow stages
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/workflow')}>
                  View
                </Button>
              </div>
            )}
            
            {/* <div className="flex items-start gap-3 p-3 border border-primary/20 bg-primary/10 rounded-lg">
              <Clock className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Monthly review meeting scheduled</p>
                <p className="text-sm text-muted-foreground">CMO review scheduled for tomorrow at 2:00 PM</p>
              </div>
              <Button size="sm" variant="outline">Details</Button>
            </div> */}
            
            {statsLoading && (
              <div className="space-y-3">
                <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
                <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
              </div>
            )}
            
            {!statsLoading && (!dashboardStats || dashboardStats.pendingApprovals === 0) && (
              <div className="p-3 border border-success/20 bg-success/10 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">All caught up!</p>
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
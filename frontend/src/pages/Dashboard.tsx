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
import { mockInitiatives, User } from "@/lib/mockData";
import { useInitiatives } from "@/hooks/useInitiatives";

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const { data: initiativesData } = useInitiatives();
  
  // Use API data if available, otherwise fallback to mock
  const initiatives = initiativesData?.content || mockInitiatives;

  const stats = [
    {
      title: "Total Initiatives",
      value: "127",
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Annual Savings",
      value: "₹45.2L",
      change: "+28%",
      trend: "up",
      icon: IndianRupee,
      color: "text-success"
    },
    {
      title: "Completed",
      value: "89",
      change: "+5%",
      trend: "up",
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Pending Approval",
      value: "23",
      change: "-2%",
      trend: "down",
      icon: Clock,
      color: "text-warning"
    }
  ];

  const recentInitiatives = mockInitiatives.slice(0, 3).map(initiative => ({
    id: initiative.id,
    title: initiative.initiativeNumber || initiative.title,
    site: initiative.site,
    status: initiative.status,
    savings: initiative.expectedSavings,
    progress: initiative.progress,
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
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs flex items-center gap-1 ${
                stat.trend === 'up' ? 'text-success' : 'text-destructive'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
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
            {recentInitiatives.map((initiative) => (
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
            ))}
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
            <div className="flex items-start gap-3 p-3 border border-warning/20 bg-warning/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">3 initiatives pending your approval</p>
                <p className="text-sm text-muted-foreground">Review required for HSD2/25/OP/AB/004 and 2 others</p>
              </div>
              <Button size="sm" variant="outline">View</Button>
            </div>
            
            <div className="flex items-start gap-3 p-3 border border-primary/20 bg-primary/10 rounded-lg">
              <Clock className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Monthly review meeting scheduled</p>
                <p className="text-sm text-muted-foreground">CMO review scheduled for tomorrow at 2:00 PM</p>
              </div>
              <Button size="sm" variant="outline">Details</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
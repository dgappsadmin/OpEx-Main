import { User } from "@/lib/mockData";
import { useInitiatives } from "@/hooks/useInitiatives";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, 
  Target, 
  IndianRupee, 
  Clock, 
  Award, 
  AlertTriangle, 
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle,
  FileText
} from "lucide-react";

interface KPIProps {
  user: User;
}

export default function KPI({ user }: KPIProps) {
  const { data: initiativesData, isLoading } = useInitiatives();
  
  // Mock data fallback for KPI
  const mockInitiatives = [
    {
      id: 1,
      title: "Process Improvement Initiative",
      status: "In Progress",
      site: "Mumbai",
      priority: "High",
      expectedSavings: 150
    },
    {
      id: 2,
      title: "Cost Reduction Program",
      status: "Completed",
      site: "Delhi",
      priority: "Medium",
      expectedSavings: 200
    },
    {
      id: 3,
      title: "Quality Enhancement",
      status: "Pending",
      site: "Bangalore",
      priority: "Low",
      expectedSavings: 120
    }
  ];
  
  // Handle both API response format and mock data format
  const initiatives = (Array.isArray(initiativesData?.content) && initiativesData.content.length > 0) 
    ? initiativesData.content 
    : (Array.isArray(initiativesData) && initiativesData.length > 0) 
    ? initiativesData 
    : mockInitiatives;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading KPI data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate KPIs with proper status categories
  const totalInitiatives = initiatives.length;
  
  // Status Categories as per requirements - including Rejected
  const pendingInitiatives = initiatives.filter((i: any) => i.status === 'Pending').length;
  const acceptedInitiatives = initiatives.filter((i: any) => i.status === 'Accepted').length;
  const underApprovalsInitiatives = initiatives.filter((i: any) => i.status === 'Under Approvals').length;
  const approvedInitiatives = initiatives.filter((i: any) => i.status === 'Approved').length;
  const inProgressInitiatives = initiatives.filter((i: any) => i.status === 'In Progress' || i.status === 'Planning').length;
  const implementedInitiatives = initiatives.filter((i: any) => i.status === 'Implemented').length;
  const validatedInitiatives = initiatives.filter((i: any) => i.status === 'Validated').length;
  const closedInitiatives = initiatives.filter((i: any) => i.status === 'Closed').length;
  const droppedInitiatives = initiatives.filter((i: any) => i.status === 'Dropped').length;
  const rejectedInitiatives = initiatives.filter((i: any) => i.status === 'Rejected').length; // Added Rejected
  const completedStatusInitiatives = initiatives.filter((i: any) => i.status === 'Completed').length;
  const completedInitiatives = implementedInitiatives + validatedInitiatives + closedInitiatives + completedStatusInitiatives;
  
  const totalExpectedSavings = initiatives.reduce((sum: number, i: any) => {
    // Handle both string format (₹8.5L) and number format
    const savings = typeof i.expectedSavings === 'string' 
      ? parseFloat(i.expectedSavings.replace(/[₹L,]/g, '')) || 0
      : i.expectedSavings || 0;
    return sum + savings;
  }, 0);
  
  const completedSavings = initiatives
    .filter((i: any) => ['Completed', 'Implemented', 'Validated', 'Closed'].includes(i.status))
    .reduce((sum: number, i: any) => {
      const savings = typeof i.expectedSavings === 'string' 
        ? parseFloat(i.expectedSavings.replace(/[₹L,]/g, '')) || 0
        : i.expectedSavings || 0;
      return sum + savings;
    }, 0);

  const completionRate = totalInitiatives > 0 ? Math.min(100, Math.max(0, (completedInitiatives / totalInitiatives) * 100)) : 0;
  
  // Debug logging for completion rate
  console.log('KPI Completion Rate Debug:', {
    totalInitiatives,
    implementedInitiatives,
    validatedInitiatives,
    closedInitiatives,
    completedStatusInitiatives,
    rejectedInitiatives, // Added for debugging
    completedInitiatives,
    completionRate: completionRate.toFixed(1)
  });
  const savingsRealizationRate = totalExpectedSavings > 0 ? (completedSavings / totalExpectedSavings) * 100 : 0;

  // Enhanced status distribution data with improved colors
  const statusData = [
    { name: 'Pending', value: pendingInitiatives, color: '#fbbf24' }, // Amber-400
    { name: 'Accepted', value: acceptedInitiatives, color: '#06b6d4' }, // Cyan-500
    { name: 'Under Approvals', value: underApprovalsInitiatives, color: '#8b5cf6' }, // Violet-500
    { name: 'Approved', value: approvedInitiatives, color: '#10b981' }, // Emerald-500
    { name: 'In Progress', value: inProgressInitiatives, color: '#2b77f2ff' }, // Blue-500
    { name: 'Implemented', value: implementedInitiatives, color: '#22c55e' }, // Green-500
    { name: 'Validated', value: validatedInitiatives, color: '#16a34a' }, // Green-600
    { name: 'Completed', value: completedStatusInitiatives, color: '#29df6cff' }, // Green-700
    { name: 'Closed', value: closedInitiatives, color: '#059669' }, // Emerald-600
    { name: 'Rejected', value: rejectedInitiatives, color: '#ff0404ff' }, // Red-500
    { name: 'Dropped', value: droppedInitiatives, color: '#b91c1c' }, // Red-700
  ].filter(item => item.value > 0); // Only show statuses with initiatives

  // Site distribution
  const siteData = initiatives.reduce((acc: any, initiative: any) => {
    const site = initiative.site || 'Unknown';
    acc[site] = (acc[site] || 0) + 1;
    return acc;
  }, {});

  const siteChartData = Object.entries(siteData).map(([site, count]) => ({
    site,
    count,
  }));

  // Format currency amounts without 'L' suffix
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) { // 1 crore or more
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) { // 1 lakh or more  
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) { // 1 thousand or more
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  // KPI Stats Array similar to Dashboard pattern
  const kpiStats = [
    {
      title: "Total Initiatives",
      value: totalInitiatives.toString(),
      change: "+12%",
      trend: "up",
      icon: Target,
      color: "text-blue-600",
      description: `${inProgressInitiatives} in progress`
    },
    {
      title: "Completion Rate",
      value: `${completionRate.toFixed(1)}%`,
      change: "+8%",
      trend: "up",
      icon: Award,
      color: "text-green-600",
      description: `${completedInitiatives} completed`
    },
    {
      title: "Expected Savings",
      value: formatCurrency(totalExpectedSavings),
      change: "+28%",
      trend: "up",
      icon: IndianRupee,
      color: "text-emerald-600",
      description: `${formatCurrency(completedSavings)} realized`
    },
    {
      title: "Under Approval",
      value: (underApprovalsInitiatives + pendingInitiatives).toString(),
      change: "-5%",
      trend: "down",
      icon: Clock,
      color: "text-orange-600",
      description: "Need attention"
    }
  ];

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-6xl">
      {/* Header - Match Dashboard style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            KPI Monitoring
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Monitor key performance indicators and initiative metrics
          </p>
        </div>
      </div>

      {/* KPI Stats Cards - Match Dashboard pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiStats.map((stat) => (
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
                {stat.value}
              </div>
              <p className="text-2xs text-muted-foreground mb-1">
                {stat.description}
              </p>
              <p className={`text-2xs flex items-center gap-1 ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-2.5 w-2.5" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Navigation - Match Dashboard style */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto lg:mx-0 h-9">
          <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="sites" className="flex items-center gap-1.5 text-xs">
            <PieChartIcon className="h-3.5 w-3.5" />
            By Sites
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="h-4 w-4 text-blue-600" />
                  Initiative Status Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Current status breakdown of all initiatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Recent Initiative Status
                </CardTitle>
                <CardDescription className="text-xs">
                  Latest initiatives requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {initiatives.slice(0, 5).map((initiative: any) => (
                    <div key={initiative.id} className="p-3 border border-border rounded-lg space-y-2 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="font-mono text-2xs">
                            {initiative.initiativeNumber || initiative.id}
                          </Badge>
                          <Badge variant="outline" className="text-2xs">
                            {initiative.site}
                          </Badge>
                        </div>
                        <Badge className={`text-2xs ${
                          initiative.status === 'Completed' ? 'bg-green-500 hover:bg-green-600 text-white' :
                          initiative.status === 'In Progress' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                          initiative.status === 'Rejected' ? 'bg-red-500 hover:bg-red-600 text-white' :
                          initiative.status === 'Approved' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                          initiative.status === 'Under Approvals' ? 'bg-violet-500 hover:bg-violet-600 text-white' :
                          initiative.status === 'Pending' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                          initiative.status === 'Dropped' ? 'bg-red-700 hover:bg-red-800 text-white' :
                          'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}>
                          {initiative.status === 'In Progress' ? 'In Prog.' : 
                           initiative.status === 'Under Approvals' ? 'Pending' : 
                           initiative.status}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-foreground text-xs line-clamp-1">{initiative.title}</h4>
                      <div className="flex items-center justify-between text-2xs text-muted-foreground">
                        <span>Priority: {initiative.priority}</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(initiative.expectedSavings || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Analysis Tab */}
        <TabsContent value="performance" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-4 w-4 text-green-600" />
                  Operational KPIs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cost Savings:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(totalExpectedSavings * 0.8)}
                  </span>
                </div> */}
                {/* <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Productivity:</span>
                  <span className="font-semibold text-blue-600">+15%</span>
                </div> */}
                {/* <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Waste Reduction:</span>
                  <span className="font-semibold text-orange-600">-12%</span>
                </div> */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completion Rate:</span>
                  <div className="text-right">
                    <span className="font-semibold text-purple-600">{completionRate.toFixed(1)}%</span>
                    <div className="text-xs text-muted-foreground">
                      {completedInitiatives}/{totalInitiatives} completed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-blue-600" />
                  Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Overall Progress</span>
                    <span className="font-semibold">{completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
                {/* <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Savings Realization</span>
                    <span className="font-semibold">{savingsRealizationRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={savingsRealizationRate} className="h-2" />
                </div> */}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-purple-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{totalInitiatives}</div>
                  <div className="text-xs text-muted-foreground">Total Initiatives</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{completedInitiatives}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{inProgressInitiatives}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sites Tab */}
        <TabsContent value="sites" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Initiatives by Site
              </CardTitle>
              <CardDescription className="text-xs">
                Distribution of initiatives across different sites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={siteChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="site" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attention Required Cards - Match Dashboard pattern */}
      {((droppedInitiatives > 0) || (underApprovalsInitiatives + pendingInitiatives) > 0) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {droppedInitiatives > 0 && (
                <div className="flex items-start gap-2.5 p-3 border border-red-200 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-xs">
                      {droppedInitiatives} initiative{droppedInitiatives !== 1 ? 's have' : ' has'} been dropped
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Review required for dropped initiatives
                    </p>
                  </div>
                </div>
              )}
              
              {(underApprovalsInitiatives + pendingInitiatives) > 0 && (
                <div className="flex items-start gap-2.5 p-3 border border-orange-200 bg-orange-50 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-xs">
                      {underApprovalsInitiatives + pendingInitiatives} initiative{(underApprovalsInitiatives + pendingInitiatives) !== 1 ? 's are' : ' is'} pending approval
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Action required for pending approvals
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
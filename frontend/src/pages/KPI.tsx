import { User } from "@/lib/mockData";
import { useInitiatives } from "@/hooks/useInitiatives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, IndianRupee, Clock, Award, AlertTriangle } from "lucide-react";

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
    return <div className="p-6">Loading KPI data...</div>;
  }

  // Calculate KPIs with proper status categories
  const totalInitiatives = initiatives.length;
  
  // Status Categories as per requirements
  const pendingInitiatives = initiatives.filter((i: any) => i.status === 'Pending').length;
  const acceptedInitiatives = initiatives.filter((i: any) => i.status === 'Accepted').length;
  const underApprovalsInitiatives = initiatives.filter((i: any) => i.status === 'Under Approvals').length;
  const approvedInitiatives = initiatives.filter((i: any) => i.status === 'Approved').length;
  const inProgressInitiatives = initiatives.filter((i: any) => i.status === 'In Progress' || i.status === 'Planning').length;
  const implementedInitiatives = initiatives.filter((i: any) => i.status === 'Implemented').length;
  const validatedInitiatives = initiatives.filter((i: any) => i.status === 'Validated').length;
  const closedInitiatives = initiatives.filter((i: any) => i.status === 'Closed').length;
  const droppedInitiatives = initiatives.filter((i: any) => i.status === 'Dropped').length;
  const completedInitiatives = implementedInitiatives + validatedInitiatives + closedInitiatives;
  const totalExpectedSavings = initiatives.reduce((sum: number, i: any) => {
    // Handle both string format (₹8.5L) and number format
    const savings = typeof i.expectedSavings === 'string' 
      ? parseFloat(i.expectedSavings.replace(/[₹L,]/g, '')) || 0
      : i.expectedSavings || 0;
    return sum + savings;
  }, 0);
  const completedSavings = initiatives
    .filter((i: any) => i.status === 'Completed')
    .reduce((sum: number, i: any) => {
      const savings = typeof i.expectedSavings === 'string' 
        ? parseFloat(i.expectedSavings.replace(/[₹L,]/g, '')) || 0
        : i.expectedSavings || 0;
      return sum + savings;
    }, 0);

  const completionRate = totalInitiatives > 0 ? (completedInitiatives / totalInitiatives) * 100 : 0;
  const savingsRealizationRate = totalExpectedSavings > 0 ? (completedSavings / totalExpectedSavings) * 100 : 0;

  // Enhanced status distribution data
  const statusData = [
    { name: 'Pending', value: pendingInitiatives, color: '#f59e0b' },
    { name: 'Accepted', value: acceptedInitiatives, color: '#06b6d4' },
    { name: 'Under Approvals', value: underApprovalsInitiatives, color: '#8b5cf6' },
    { name: 'Approved', value: approvedInitiatives, color: '#10b981' },
    { name: 'In Progress', value: inProgressInitiatives, color: '#3b82f6' },
    { name: 'Implemented', value: implementedInitiatives, color: '#22c55e' },
    { name: 'Validated', value: validatedInitiatives, color: '#16a34a' },
    { name: 'Closed', value: closedInitiatives, color: '#059669' },
    { name: 'Dropped', value: droppedInitiatives, color: '#ef4444' },
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

  // Priority distribution
  const priorityData = initiatives.reduce((acc: any, initiative: any) => {
    const priority = initiative.priority || 'Unknown';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const priorityChartData = Object.entries(priorityData).map(([priority, count]) => ({
    priority,
    count,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KPI Monitoring</h1>
        <p className="text-muted-foreground">Monitor key performance indicators and initiative metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Initiatives</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInitiatives}</div>
            <p className="text-xs text-muted-foreground">
              {inProgressInitiatives} in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Savings</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalExpectedSavings.toLocaleString()}L</div>
            <p className="text-xs text-muted-foreground">
              ₹{completedSavings.toLocaleString()}L realized
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{underApprovalsInitiatives + pendingInitiatives}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational KPIs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Cost Savings:</span>
                <span className="font-semibold">₹{(totalExpectedSavings * 0.8).toFixed(1)}L</span>
              </div>
              <div className="flex justify-between">
                <span>Productivity:</span>
                <span className="font-semibold">+15%</span>
              </div>
              <div className="flex justify-between">
                <span>Waste Reduction:</span>
                <span className="font-semibold">-12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sites">By Sites</TabsTrigger>
          <TabsTrigger value="priority">By Priority</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Initiative Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
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

            <Card>
              <CardHeader>
                <CardTitle>Recent Initiative Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   {initiatives.slice(0, 5).map((initiative: any) => (
                     <div key={initiative.id} className="flex items-center justify-between">
                       <div className="flex-1">
                         <p className="font-medium text-sm">{initiative.initiativeNumber || initiative.title}</p>
                         <p className="text-xs text-muted-foreground">{initiative.site}</p>
                       </div>
                      <Badge 
                        className={
                          initiative.status === 'Completed' ? 'bg-green-500' :
                          initiative.status === 'In Progress' ? 'bg-blue-500' :
                          initiative.status === 'Rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }
                      >
                        {initiative.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Initiatives by Site</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
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

        <TabsContent value="priority" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Initiatives by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attention Required Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {droppedInitiatives > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Dropped Initiatives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {droppedInitiatives} initiative(s) have been dropped and may need review.
              </p>
            </CardContent>
          </Card>
        )}
        
        {(underApprovalsInitiatives + pendingInitiatives) > 0 && (
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-600 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {underApprovalsInitiatives + pendingInitiatives} initiative(s) are pending approval and need attention.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
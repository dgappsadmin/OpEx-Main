import { useState } from "react";
import { User } from "@/lib/mockData";
import { useInitiatives } from "@/hooks/useInitiatives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Download, Calendar, TrendingUp, FileText, Filter } from "lucide-react";
import { reportsAPI } from "@/lib/api";

interface ReportsProps {
  user: User;
}

export default function Reports({ user }: ReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const { data: initiativesData, isLoading } = useInitiatives();
  
  // Handle both API response format and mock data format
  const initiatives = initiativesData?.content || initiativesData || [];

  if (isLoading) {
    return <div className="p-6">Loading reports data...</div>;
  }

  // Filter initiatives based on selected site
  const filteredInitiatives = selectedSite === 'all' 
    ? initiatives 
    : initiatives.filter((i: any) => i.site === selectedSite);

  // Get unique sites for filter
  const sites = [...new Set(initiatives.map((i: any) => i.site))];

  // Generate monthly data (mock for demonstration)
  const monthlyData = [
    { month: 'Jan', initiatives: 12, savings: 45000, completed: 8 },
    { month: 'Feb', initiatives: 15, savings: 52000, completed: 10 },
    { month: 'Mar', initiatives: 18, savings: 67000, completed: 12 },
    { month: 'Apr', initiatives: 20, savings: 73000, completed: 15 },
    { month: 'May', initiatives: 22, savings: 81000, completed: 18 },
    { month: 'Jun', initiatives: 25, savings: 95000, completed: 20 },
  ];

  // Calculate summary statistics
  const totalSavings = filteredInitiatives.reduce((sum: number, i: any) => {
    const savings = typeof i.expectedSavings === 'string' 
      ? parseFloat(i.expectedSavings.replace(/[₹L,]/g, '')) || 0
      : i.expectedSavings || 0;
    return sum + savings;
  }, 0);
  const completedCount = filteredInitiatives.filter((i: any) => i.status === 'Completed').length;
  const inProgressCount = filteredInitiatives.filter((i: any) => i.status === 'In Progress').length;
  const avgSavingsPerInitiative = filteredInitiatives.length > 0 ? totalSavings / filteredInitiatives.length : 0;

  const handleDownloadReport = async (reportType: string) => {
    if (reportType === 'Detailed Report (Excel)') {
      try {
        // Use the centralized API with proper authentication
        const filename = await reportsAPI.downloadDetailedExcel({
          site: selectedSite,
          year: new Date().getFullYear().toString()
        });
        
        console.log(`Successfully downloaded detailed Excel report: ${filename} for ${selectedSite} site(s)`);
        // Optional: Show success message instead of alert
        // You can replace this with a toast notification if you have one
        alert(`Excel report "${filename}" downloaded successfully!`);
      } catch (error) {
        console.error('Error downloading Excel report:', error);
        alert('Failed to download Excel report. Please try again.');
      }
    } else {
      // Mock download functionality for other reports
      console.log(`Downloading ${reportType} report for ${selectedSite} site(s) - ${selectedPeriod} period`);
      alert(`${reportType} report download started`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in progress': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monthly Reports</h1>
          <p className="text-muted-foreground">Generate and analyze initiative performance reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleDownloadReport('Executive Summary')}>
            <Download className="h-4 w-4 mr-2" />
            Download Executive Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Period</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Site</label>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map((site: string) => (
                  <SelectItem key={site} value={site}>{site}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Initiatives</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInitiatives.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedCount} completed, {inProgressCount} in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Expected savings from all initiatives
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Initiative</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{avgSavingsPerInitiative.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average expected savings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredInitiatives.length > 0 ? ((completedCount / filteredInitiatives.length) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Initiatives completed successfully
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
          <TabsTrigger value="export">Export Options</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Initiative Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="initiatives" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Savings Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="savings" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Initiative Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expected Savings</TableHead>
                    <TableHead>Start Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInitiatives.slice(0, 10).map((initiative: any) => (
                    <TableRow key={initiative.id}>
                      <TableCell className="font-medium">{initiative.initiativeNumber || initiative.title}</TableCell>
                      <TableCell>{initiative.site}</TableCell>
                      <TableCell>
                        <Badge variant={initiative.priority === 'High' ? 'destructive' : 'outline'}>
                          {initiative.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(initiative.status)}>
                          {initiative.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {typeof initiative.expectedSavings === 'string' 
                          ? initiative.expectedSavings 
                          : `₹${initiative.expectedSavings?.toLocaleString() || 0}`
                        }
                      </TableCell>
                      <TableCell>{initiative.submittedDate || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <p className="text-muted-foreground">
                Download detailed reports in various formats
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleDownloadReport('Executive Summary')}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Executive Summary (PDF)
                </Button>
                
                <Button 
                  onClick={() => handleDownloadReport('Detailed Report (Excel)')}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Detailed Report (Excel)
                </Button>
                
                <Button 
                  onClick={() => handleDownloadReport('Financial Analysis')}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Financial Analysis (PDF)
                </Button>
                
                <Button 
                  onClick={() => handleDownloadReport('Raw Data')}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Raw Data (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState, useEffect, useMemo } from "react";
import { User } from "@/lib/mockData";
import { useInitiatives } from "@/hooks/useInitiatives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import { Download, Calendar, TrendingUp, FileText, Filter, BarChart3, AlertCircle, RefreshCw, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reportsAPI } from "@/lib/api";
import DNLBarChart from "@/components/DNLBarChart";

interface ReportsProps {
  user: User;
}

interface MonthlyData {
  month: string;
  initiatives: number;
  savings: number;
  completed: number;
}

interface DNLChartData {
  processedData: number[][];
}

interface FinancialYearData {
  month: string;
  lastFYCumulativeSavings: number;
  potentialMonthlySavingsCumulative: number;
  actualSavings: number;
  monthlyCumulativeProjectedSavings: number;
  currentFYTarget: number;
}

export default function Reports({ user }: ReportsProps) {
  // Debug render cycles
  console.log('🔄 Reports component render - timestamp:', Date.now());
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>('yearly'); // Default to yearly
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // New filter states
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>('');
  const [selectedBudgetType, setSelectedBudgetType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [dnlChartData, setDnlChartData] = useState<DNLChartData | null>(null);
  const [financialYearData, setFinancialYearData] = useState<FinancialYearData[]>([]);
  const [availableFinancialYears, setAvailableFinancialYears] = useState<string[]>([]);
  
  const [loadingChart, setLoadingChart] = useState<boolean>(false);
  const [loadingFinancialData, setLoadingFinancialData] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [financialDataError, setFinancialDataError] = useState<string | null>(null);
  
  const { data: initiativesData, isLoading } = useInitiatives();
  const { toast } = useToast();
  
  // Memoize initiatives to prevent infinite re-renders
  const initiatives = useMemo(() => {
    const result = initiativesData?.content || initiativesData || [];
    console.log('🔄 Initiatives memoized, length:', result.length);
    return result;
  }, [initiativesData]);

  // Filter initiatives based on selected site and filters - MOVED BEFORE EARLY RETURN
  const filteredInitiatives = useMemo(() => {
    let filtered = selectedSite === 'all' ? initiatives : initiatives.filter((i: any) => i.site === selectedSite);
    
    // Apply budget type filter
    if (selectedBudgetType !== 'all') {
      filtered = filtered.filter((i: any) => 
        (selectedBudgetType === 'budgeted' && (!i.budgetType || i.budgetType.toLowerCase() === 'budgeted')) ||
        (selectedBudgetType === 'non-budgeted' && i.budgetType && i.budgetType.toLowerCase() === 'non-budgeted')
      );
    }
    
    return filtered;
  }, [initiatives, selectedSite, selectedBudgetType]);

  // Enhanced currency formatting for improved display
  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) { // 1 crore or more (1,00,00,000)
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) { // 1 lakh or more (1,00,000)
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) { // 1 thousand or more
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  // Format large numbers for display in cards
  const formatDisplayNumber = (amount: number): string => {
    if (amount >= 10000000) { // 1 crore or more
      return `${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) { // 1 lakh or more
      return `${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) { // 1 thousand or more
      return `${(amount / 1000).toFixed(1)}K`;
    } else {
      return amount.toLocaleString('en-IN');
    }
  };

  // Generate dynamic monthly data based on current fiscal year
  useEffect(() => {
    const generateDynamicMonthlyData = () => {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Fiscal year starts from April (month 3 in 0-indexed)
        const fiscalYearStart = currentMonth >= 3 ? currentYear : currentYear - 1;
        
        const months = [
          'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
          'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'
        ];
        
        const dynamicData: MonthlyData[] = [];
        
        for (let i = 0; i < months.length; i++) {
          const monthIndex = (3 + i) % 12; // Start from April (index 3)
          const year = monthIndex < 3 ? fiscalYearStart + 1 : fiscalYearStart;
          
          // Only include months up to current month in current fiscal year
          const isCurrentFiscalYear = (currentMonth >= 3 && year === currentYear) || 
                                     (currentMonth < 3 && year === currentYear);
          const isPastMonth = isCurrentFiscalYear ? 
                             (monthIndex < currentMonth || (currentMonth < 3 && monthIndex >= 3)) :
                             true;
          
          if (isPastMonth || monthIndex === currentMonth) {
            // Calculate dynamic values based on filtered initiatives for the month
            const monthInitiatives = initiatives.filter((initiative: any) => {
              try {
                const startDate = new Date(initiative.submittedDate || initiative.startDate);
                return startDate.getMonth() === monthIndex && startDate.getFullYear() === year;
              } catch (e) {
                console.warn('Error parsing initiative date:', e);
                return false;
              }
            });
            
            const savings = monthInitiatives.reduce((sum: number, initiative: any) => {
              try {
                const savingsValue = typeof initiative.expectedSavings === 'string' 
                  ? parseFloat(initiative.expectedSavings.replace(/[₹L,]/g, '')) || 0
                  : initiative.expectedSavings || 0;
                return sum + savingsValue;
              } catch (e) {
                console.warn('Error parsing savings value:', e);
                return sum;
              }
            }, 0);
            
            const completedCount = monthInitiatives.filter((i: any) => i.status === 'Completed').length;
            
            dynamicData.push({
              month: months[i],
              initiatives: monthInitiatives.length,
              savings: savings,
              completed: completedCount
            });
          }
        }
        
        return dynamicData;
      } catch (error) {
        console.error('Error generating monthly data:', error);
        return []; // Return empty array on error
      }
    };

    setMonthlyData(generateDynamicMonthlyData());
  }, [initiatives]);

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

  // Fetch financial year data whenever filters change
  useEffect(() => {
    if (!selectedFinancialYear) return;
    
    let isMounted = true;
    
    const fetchFinancialYearData = async () => {
      setLoadingFinancialData(true);
      setFinancialDataError(null);
      
      try {
        const data = await reportsAPI.getFinancialYearData({
          financialYear: selectedFinancialYear,
          site: selectedSite !== 'all' ? selectedSite : undefined,
          budgetType: selectedBudgetType !== 'all' ? selectedBudgetType : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined
        });
        
        if (isMounted) {
          // Transform the data for chart display
          const chartData: FinancialYearData[] = [];
          const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
          
          months.forEach(month => {
            const monthData = data.monthlyData[month];
            if (monthData) {
              chartData.push({
                month: month,
                lastFYCumulativeSavings: parseFloat(monthData.lastFYCumulativeSavings || 0),
                potentialMonthlySavingsCumulative: parseFloat(monthData.potentialMonthlySavingsCumulative || 0),
                actualSavings: parseFloat(monthData.actualSavings || 0),
                monthlyCumulativeProjectedSavings: parseFloat(monthData.monthlyCumulativeProjectedSavings || 0),
                currentFYTarget: parseFloat(monthData.currentFYTarget || 0)
              });
            }
          });
          
          setFinancialYearData(chartData);
          setFinancialDataError(null);
        }
      } catch (error: any) {
        console.error('Error fetching financial year data:', error);
        if (isMounted) {
          setFinancialYearData([]);
          setFinancialDataError('Failed to load financial year data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoadingFinancialData(false);
        }
      }
    };

    fetchFinancialYearData();
    
    return () => {
      isMounted = false;
    };
  }, [selectedFinancialYear, selectedSite, selectedBudgetType, selectedCategory]);

  // Fetch DNL chart data when filters change
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts
    
    const fetchDNLChartData = async () => {
      setLoadingChart(true);
      setChartError(null); // Clear previous errors
      try {
        const data = await reportsAPI.getDNLSavingsData({
          site: selectedSite !== 'all' ? selectedSite : undefined,
          period: selectedPeriod,
          year: selectedYear
        });
        
        // Only update state if component is still mounted
        if (isMounted) {
          setDnlChartData(data);
          setChartError(null);
        }
      } catch (error: any) {
        console.error('Error fetching DNL chart data:', error);
        if (isMounted) {
          setDnlChartData(null);
          // Set user-friendly error message
          if (error?.response?.status === 500) {
            setChartError('Server error: Unable to fetch chart data. Please try again later or contact support.');
          } else if (error?.response?.status === 404) {
            setChartError('No data found for the selected filters.');
          } else {
            setChartError('Failed to load chart data. Please check your connection and try again.');
          }
        }
      } finally {
        if (isMounted) {
          setLoadingChart(false);
        }
      }
    };

    fetchDNLChartData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [selectedSite, selectedPeriod, selectedYear]); // Only trigger on filter changes

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        Loading reports data...
      </div>
    );
  }

  // Get unique sites for filter
  const sites = [...new Set(initiatives.map((i: any) => i.site))];

  // Calculate summary statistics from real data
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
    if (reportType === 'DNL Plant Initiatives PDF') {
      try {
        // Use the new DNL Plant Initiatives PDF export with current year as default
        const currentYear = new Date().getFullYear();
        const filename = await reportsAPI.downloadDNLPlantInitiatives({
          site: selectedSite,
          period: selectedPeriod === 'yearly' ? 'yearly' : selectedPeriod,
          year: selectedYear || currentYear.toString()
        });
        
        console.log(`Successfully downloaded DNL Plant Initiatives PDF report: ${filename} for ${selectedSite} site(s) - ${selectedPeriod} period (${selectedYear})`);
        alert(`DNL Plant Initiatives PDF report "${filename}" downloaded successfully for year ${selectedYear}! Data includes savings till current month (${getCurrentMonth()}).`);
      } catch (error: any) {
        console.error('Error downloading DNL Plant Initiatives PDF report:', error);
        let errorMessage = 'Failed to download DNL Plant Initiatives PDF report. ';
        if (error?.response?.status === 500) {
          errorMessage += 'Server error occurred. Please try again later.';
        } else if (error?.response?.status === 404) {
          errorMessage += 'No data found for selected filters.';
        } else {
          errorMessage += 'Please check your connection and try again.';
        }
        alert(errorMessage);
      }
    } else if (reportType === 'DNL Chart PDF') {
      try {
        const filename = await reportsAPI.downloadDNLChartPDF({
          site: selectedSite !== 'all' ? selectedSite : undefined,
          period: selectedPeriod,
          year: selectedYear
        });
        
        console.log(`Successfully downloaded DNL Chart PDF: ${filename}`);
        alert(`DNL Chart PDF "${filename}" downloaded successfully!`);
      } catch (error: any) {
        console.error('Error downloading DNL Chart PDF:', error);
        let errorMessage = 'Failed to download DNL Chart PDF. ';
        if (error?.response?.status === 500) {
          errorMessage += 'Server error: PDF generation failed. This might be due to chart rendering issues. Please contact support.';
        } else if (error?.response?.status === 404) {
          errorMessage += 'No data found for selected filters.';
        } else {
          errorMessage += 'Please check your connection and try again.';
        }
        alert(errorMessage);
      }
    } else if (reportType === 'DNL Chart Excel') {
      try {
        const filename = await reportsAPI.downloadDNLChartExcel({
          site: selectedSite !== 'all' ? selectedSite : undefined,
          period: selectedPeriod,
          year: selectedYear
        });
        
        console.log(`Successfully downloaded DNL Chart Excel: ${filename}`);
        toast({
          title: "Download Successful",
          description: `DNL Chart Excel "${filename}" downloaded successfully with embedded charts and data table!`,
        });
      } catch (error: any) {
        console.error('Error downloading DNL Chart Excel:', error);
        let errorMessage = 'Failed to download DNL Chart Excel. ';
        if (error?.response?.status === 500) {
          errorMessage += 'Server error: Excel generation failed. This might be due to chart embedding issues. Please contact support.';
        } else if (error?.response?.status === 404) {
          errorMessage += 'No data found for selected filters.';
        } else {
          errorMessage += 'Please check your connection and try again.';
        }
        toast({
          title: "Download Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else if (reportType === 'Detailed Report (Excel)') {
      try {
        // Use the centralized API with proper authentication
        const filename = await reportsAPI.downloadDetailedExcel({
          site: selectedSite,
          year: selectedYear || new Date().getFullYear().toString()
        });
        
        console.log(`Successfully downloaded detailed Excel report: ${filename} for ${selectedSite} site(s)`);
        // Optional: Show success message instead of alert
        // You can replace this with a toast notification if you have one
        alert(`Excel report "${filename}" downloaded successfully!`);
      } catch (error: any) {
        console.error('Error downloading Excel report:', error);
        let errorMessage = 'Failed to download Excel report. ';
        if (error?.response?.status === 500) {
          errorMessage += 'Server error occurred. Please try again later.';
        } else if (error?.response?.status === 404) {
          errorMessage += 'No data found for selected filters.';
        } else {
          errorMessage += 'Please check your connection and try again.';
        }
        alert(errorMessage);
      }
    } else {
      // Mock download functionality for other reports
      console.log(`Downloading ${reportType} report for ${selectedSite} site(s) - ${selectedPeriod} period`);
      alert(`${reportType} report download started`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in progress': return 'bg-blue-500 hover:bg-blue-600';
      case 'rejected': return 'bg-red-500 hover:bg-red-600';
      case 'draft': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'approved': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'pending': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  // Dynamic method to get current month
  const getCurrentMonth = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[now.getMonth()];
  };

  // Dynamic method to get current fiscal year
  const getCurrentFiscalYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    // Fiscal year starts from April, so if current month is Jan-Mar, FY is previous year
    if (now.getMonth() >= 3) {
      return String(year + 1).slice(-2); // e.g., "26" for 2026
    } else {
      return String(year).slice(-2); // e.g., "25" for 2025
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm">Generate and analyze initiative performance reports (Data till {getCurrentMonth()} {new Date().getFullYear()})</p>
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card className="compact-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Period Filter - Commented out as requested */}
            {/* 
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly (Till {getCurrentMonth()})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            */}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Site</label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-full">
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
            
            {/* Year Filter - Commented out as requested */}
            {/* 
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            */}

            {/* Financial Year Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Financial Year</label>
              <Select value={selectedFinancialYear} onValueChange={setSelectedFinancialYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select FY" />
                </SelectTrigger>
                <SelectContent>
                  {availableFinancialYears.map((fy) => (
                    <SelectItem key={fy} value={fy}>FY {fy}-{(parseInt(fy) + 1).toString().slice(-2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Budget Type Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Budget Type</label>
              <Select value={selectedBudgetType} onValueChange={setSelectedBudgetType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Overall</SelectItem>
                  <SelectItem value="budgeted">Budgeted</SelectItem>
                  <SelectItem value="non-budgeted">Non-Budgeted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="rmc">RMC</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="spent acid">Spent Acid</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="compact-kpi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Initiatives</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-xl font-bold">{filteredInitiatives.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedCount} completed, {inProgressCount} in progress
            </p>
          </CardContent>
        </Card>
        
        <Card className="compact-kpi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold break-words">₹{formatDisplayNumber(totalSavings)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Expected savings from all initiatives
            </p>
          </CardContent>
        </Card>
        
        <Card className="compact-kpi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Initiative</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold break-words">₹{formatDisplayNumber(avgSavingsPerInitiative)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average expected savings
            </p>
          </CardContent>
        </Card>
        
        <Card className="compact-kpi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-xl font-bold">
              {filteredInitiatives.length > 0 ? ((completedCount / filteredInitiatives.length) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Initiatives completed successfully
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
          <TabsTrigger value="financial-year" className="text-xs">Financial Year</TabsTrigger>
          <TabsTrigger value="dnl-chart" className="text-xs">DNL Chart</TabsTrigger>
          <TabsTrigger value="detailed" className="text-xs">Detailed Report</TabsTrigger>
          <TabsTrigger value="export" className="text-xs">Export Options</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Monthly Initiative Trends (FY'{getCurrentFiscalYear()})</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Monthly Savings Trends (FY'{getCurrentFiscalYear()})</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Savings']} />
                    <Bar dataKey="savings" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* New Financial Year Tab */}
        <TabsContent value="financial-year" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5" />
                    Financial Year Analysis (FY {selectedFinancialYear}-{selectedFinancialYear ? (parseInt(selectedFinancialYear) + 1).toString().slice(-2) : ''})
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Comprehensive savings analysis by category and budget type
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingFinancialData ? (
                <div className="flex items-center justify-center h-80">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Loading financial year data...</span>
                  </div>
                </div>
              ) : financialDataError ? (
                <div className="flex flex-col items-center justify-center h-80 space-y-4">
                  <div className="text-red-600 text-center">
                    <AlertCircle className="h-10 w-10 mx-auto mb-3" />
                    <p className="font-medium">Financial Year Data Unavailable</p>
                    <p className="text-sm mt-2 max-w-md">{financialDataError}</p>
                  </div>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : financialYearData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={financialYearData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                    
                    {/* Last Financial Year Cumulative Savings - Solid Orange Bar */}
                    <Bar dataKey="lastFYCumulativeSavings" fill="#f97316" name="Last FY Cumulative Savings" />
                    
                    {/* Current Financial Year Target - Blue Bar */}
                    <Bar dataKey="currentFYTarget" fill="#3b82f6" name="Current FY Target" />
                    
                    {/* Potential Monthly Savings Cumulative - Thick Blue Line */}
                    <Line 
                      type="monotone" 
                      dataKey="potentialMonthlySavingsCumulative" 
                      stroke="#1d4ed8" 
                      strokeWidth={4}
                      name="Potential Monthly Savings Cumulative"
                    />
                    
                    {/* Actual Savings - Blue Line */}
                    <Line 
                      type="monotone" 
                      dataKey="actualSavings" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Actual Savings"
                    />
                    
                    {/* Monthly Cumulative Projected Savings - Broken Blue Line */}
                    <Line 
                      type="monotone" 
                      dataKey="monthlyCumulativeProjectedSavings" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Monthly Cumulative Projected Savings"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80">
                  <div className="text-muted-foreground">No financial year data available for selected filters</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dnl-chart" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5" />
                    DNL Plant Initiatives Chart (FY'{getCurrentFiscalYear()})
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Initiative savings by category - {selectedSite !== 'all' ? selectedSite : 'All Sites'} 
                    {selectedYear && ` - Year ${selectedYear}`}
                  </p>
                </div>
                <Button 
                  onClick={() => handleDownloadReport('DNL Chart Excel')}
                  className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                  disabled={loadingChart || !dnlChartData || !!chartError}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingChart ? (
                <div className="flex items-center justify-center h-80">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Loading chart data...</span>
                  </div>
                </div>
              ) : chartError ? (
                <div className="flex flex-col items-center justify-center h-80 space-y-4">
                  <div className="text-red-600 text-center">
                    <AlertCircle className="h-10 w-10 mx-auto mb-3" />
                    <p className="font-medium">Chart Data Unavailable</p>
                    <p className="text-sm mt-2 max-w-md">{chartError}</p>
                  </div>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : dnlChartData ? (
                <DNLBarChart 
                  data={dnlChartData} 
                  title={`Initiative saving till ${getCurrentMonth()} ${selectedYear} (Rs. Lacs)`}
                  year={selectedYear}
                />
              ) : (
                <div className="flex items-center justify-center h-80">
                  <div className="text-muted-foreground">No chart data available</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Initiative Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Site</TableHead>
                      <TableHead className="text-xs">Priority</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Budget Type</TableHead>
                      <TableHead className="text-xs">Expected Savings</TableHead>
                      <TableHead className="text-xs">Start Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInitiatives.slice(0, 10).map((initiative: any) => (
                      <TableRow key={initiative.id}>
                        <TableCell className="font-medium text-xs">
                          <div className="max-w-48 truncate">
                            {initiative.initiativeNumber || initiative.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{initiative.site}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={getPriorityColor(initiative.priority)} className="text-xs">
                            {initiative.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge className={`${getStatusColor(initiative.status)} text-white text-xs`}>
                            {initiative.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={initiative.budgetType?.toLowerCase() === 'budgeted' ? 'default' : 'secondary'} className="text-xs">
                            {initiative.budgetType || 'Budgeted'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {typeof initiative.expectedSavings === 'string' 
                            ? initiative.expectedSavings 
                            : formatCurrency(initiative.expectedSavings || 0)
                          }
                        </TableCell>
                        <TableCell className="text-xs">{initiative.submittedDate || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredInitiatives.length > 10 && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Showing first 10 of {filteredInitiatives.length} initiatives
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Export Reports</CardTitle>
              <p className="text-muted-foreground text-sm">
                Download detailed reports in various formats (Data includes current month: {getCurrentMonth()} {new Date().getFullYear()})
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleDownloadReport('DNL Plant Initiatives PDF')}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  DNL Plant Initiatives Report (Excel)
                </Button>
                
                <Button 
                  onClick={() => handleDownloadReport('Detailed Report (Excel)')}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Detailed Report (Excel)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
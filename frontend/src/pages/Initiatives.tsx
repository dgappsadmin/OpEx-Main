import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Calendar, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Edit,
  Clock,
  Search,
  Download,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { mockInitiatives, paginateArray, User } from "@/lib/mockData";
import { useInitiatives } from "@/hooks/useInitiatives";
import InitiativeModal from "@/components/modals/InitiativeModal";
import { reportsAPI } from "@/lib/api";

interface Initiative {
  id: string | number;
  title: string;
  initiativeNumber?: string;
  site: string;
  status: string;
  priority: string;
  expectedSavings: string | number;
  actualSavings?: string | number;
  progressPercentage?: number;
  progress: number;
  lastUpdated: string;
  updatedAt?: string;
  discipline: string;
  submittedDate: string;
  createdAt?: string;
  createdDate?: string; // Added for sorting
  description?: string;
  startDate?: string;
  endDate?: string;
  currentStage?: number;
  currentStageName?: string; // Stage name from API
  requiresMoc?: boolean | string; // Legacy field for backward compatibility
  requiresCapex?: boolean | string; // Legacy field for backward compatibility
  mocNumber?: string; // New field - MOC Number from OPEX_INITIATIVES table
  capexNumber?: string; // New field - CAPEX Number from OPEX_INITIATIVES table
  createdByName?: string;
  createdByEmail?: string;
  createdBy?: number | string; // User ID who created the initiative
  initiatorName?: string; // Name of the person who initiated the initiative
  // Missing fields from database schema
  assumption1?: string; // CLOB - ASSUMPTION_1
  assumption2?: string; // CLOB - ASSUMPTION_2  
  assumption3?: string; // CLOB - ASSUMPTION_3
  baselineData?: string; // CLOB - BASELINE_DATA
  targetOutcome?: string; // VARCHAR2(255) - TARGET_OUTCOME
  targetValue?: number; // NUMBER(15,2) - TARGET_VALUE
  confidenceLevel?: number; // NUMBER(3) - CONFIDENCE_LEVEL (percentage)
  estimatedCapex?: number; // NUMBER(15,2) - ESTIMATED_CAPEX
  budgetType?: string; // Budget type - BUDGETED or NON-BUDGETED
  
  // Rejection information fields
  rejectedBy?: string;
  rejectionReason?: string;
  rejectionDate?: string;
  rejectedStageName?: string;
  rejectedStageNumber?: number;
}

interface InitiativesProps {
  user: User;
}

// Fallback stage names if API doesn't provide currentStageName
const WORKFLOW_STAGE_NAMES: { [key: number]: string } = {
  1: 'Register Initiative',
  2: 'Approval',
  3: 'Define Responsibilities',
  4: 'MOC-CAPEX Evaluation',
  5: 'Initiative Timeline Tracker',
  6: 'Trial Implementation & Performance Check',
  7: 'Periodic Status Review with CMO',
  8: 'Savings Monitoring (1 Month)',
  9: 'Saving Validation with F&A',
  10: 'Initiative Closure'
};

export default function Initiatives({ user }: InitiativesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

  // Use real API or fallback to mock data
  const { data: apiInitiatives, isLoading, error } = useInitiatives({
    status: statusFilter !== "all" ? statusFilter : undefined,
    site: siteFilter !== "all" ? siteFilter : undefined,
    search: searchTerm || undefined,
  });

  // Use API data if available, otherwise fallback to mock data
  const initiatives = React.useMemo(() => {
    if (apiInitiatives?.content) {
      // Transform API data to match interface
      return apiInitiatives.content.map((item: any) => ({
        id: item.id?.toString() || item.id,
        title: item.title || '',
        initiativeNumber: item.initiativeNumber || '',
        site: item.site || '',
        status: item.status || '',
        priority: item.priority || '',
        expectedSavings: typeof item.expectedSavings === 'number' 
          ? `₹${item.expectedSavings.toLocaleString()}` 
          : item.expectedSavings || '₹0',
        progress: item.progressPercentage || item.progress || 0,
        lastUpdated: item.updatedAt 
          ? new Date(item.updatedAt).toLocaleDateString() 
          : item.lastUpdated || new Date().toLocaleDateString(),
        discipline: item.discipline || '',
        submittedDate: item.createdAt 
          ? new Date(item.createdAt).toLocaleDateString() 
          : item.submittedDate || new Date().toLocaleDateString(),
        description: item.description,
        startDate: item.startDate,
        endDate: item.endDate,
        currentStage: Math.min(item.currentStage || 1, 10), // Cap at stage 10
        // Prioritize currentStageName from API for instant display
        currentStageName: item.status?.toLowerCase() === 'completed' 
          ? 'Initiative Closure' 
          : (item.currentStageName || WORKFLOW_STAGE_NAMES[Math.min(item.currentStage || 1, 10)] || `Stage ${Math.min(item.currentStage || 1, 10)}`),
        requiresMoc: item.requiresMoc,
        requiresCapex: item.requiresCapex,
        mocNumber: item.mocNumber,
        capexNumber: item.capexNumber,
        createdByName: item.createdBy?.fullName || item.createdByName,
        createdByEmail: item.createdBy?.email || item.createdByEmail,
        initiatorName: item.initiatorName,
        createdBy: item.createdBy?.id || item.createdBy,
        // Keep original date fields for sorting
        createdAt: item.createdAt,
        createdDate: item.createdDate,
        // Add missing fields for Target & Financial Information
        targetOutcome: item.targetOutcome,
        targetValue: item.targetValue,
        confidenceLevel: item.confidenceLevel,
        estimatedCapex: item.estimatedCapex,
        budgetType: item.budgetType,
        // Add missing fields for Assumptions & Baseline Data
        assumption1: item.assumption1,
        assumption2: item.assumption2,
        assumption3: item.assumption3,
        baselineData: item.baselineData,
        // Add actualSavings field if needed
        actualSavings: typeof item.actualSavings === 'number' 
          ? `₹${item.actualSavings.toLocaleString()}` 
          : item.actualSavings,
      }));
    } else {
      return mockInitiatives;
    }
  }, [apiInitiatives]);

  // Sort initiatives by status priority and creation date (most recent first)
  const sortedInitiatives = React.useMemo(() => {
    return [...initiatives].sort((a, b) => {
      // First, prioritize pending status initiatives (exact match with DB STATUS column)
      const aIsPending = a.status?.trim() === 'Pending';
      const bIsPending = b.status?.trim() === 'Pending';
      
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      
      // Then sort by creation date (most recent first)
      const dateA = new Date(a.createdAt || a.submittedDate || a.createdDate || '');
      const dateB = new Date(b.createdAt || b.submittedDate || b.createdDate || '');
      return dateB.getTime() - dateA.getTime();
    });
  }, [initiatives]);

  const handleViewInitiative = (initiative: Initiative) => {
    setSelectedInitiative(initiative);
    setModalMode('view');
  };

  const handleEditInitiative = (initiative: Initiative) => {
    setSelectedInitiative(initiative);
    setModalMode('edit');
  };

  const handleCloseModal = () => {
    setSelectedInitiative(null);
  };

  const handleSaveInitiative = (data: any) => {
    // Handle save logic here
    console.log('Saving initiative:', data);
    // You can add API call here to update the initiative
    handleCloseModal();
  };

  const handleDownloadForm = async (initiative: Initiative) => {
    try {
      const filename = await reportsAPI.downloadInitiativeForm(initiative.id.toString());
      console.log(`Successfully downloaded initiative form: ${filename} for ${initiative.initiativeNumber || initiative.title}`);
      // Optional: Show success message instead of alert
      alert(`Initiative form "${filename}" downloaded successfully!`);
    } catch (error) {
      console.error('Error downloading initiative form:', error);
      alert('Failed to download initiative form. Please try again.');
    }
  };

  // Filter sorted initiatives
  const filteredInitiatives = sortedInitiatives.filter((initiative: Initiative) => {
    // Exact status matching with database STATUS column values
    const matchesStatus = statusFilter === "all" || initiative.status.trim() === statusFilter;
    const matchesSite = siteFilter === "all" || initiative.site === siteFilter;
    const matchesSearch = searchTerm === "" || 
      (initiative.title && initiative.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (initiative.initiativeNumber && initiative.initiativeNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (initiative.id && initiative.id.toString().toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSite && matchesSearch;
  });

  // Paginate filtered results
  const paginatedData = paginateArray(filteredInitiatives, currentPage, itemsPerPage);

  const getStatusColor = (status: string) => {
    // Enhanced status colors with better visual distinction
    switch (status.trim()) {
      case "Pending": return "bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-sm";
      case "In Progress": return "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-sm";
      case "Completed": return "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm";
      case "Rejected": return "bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-sm";
      case "Rejected": return "bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-sm";
      case "Dropped": return "bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-sm";
      default: return "bg-slate-500 hover:bg-slate-600 text-white border-slate-500 shadow-sm";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-sm";
      case "Medium": return "bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-sm";
      case "Low": return "bg-green-500 hover:bg-green-600 text-white border-green-500 shadow-sm";
      default: return "bg-slate-500 hover:bg-slate-600 text-white border-slate-500 shadow-sm";
    }
  };

  const formatCurrency = (value: string | number) => {
    if (typeof value === 'string') return value;
    return `₹${value.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-destructive text-lg">Error loading initiatives: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-6xl">
      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Initiatives Management
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Track and manage all initiatives across different sites and stages
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-medium bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200 text-emerald-700">
          <BarChart3 className="h-3 w-3 mr-1.5" />
          {paginatedData.totalItems} initiatives
        </Badge>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-blue-600" />
            All Initiatives
          </CardTitle>
          <CardDescription className="text-xs">
            Comprehensive view of all operational excellence initiatives
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enhanced Filters - Compact */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by title, number, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <div className="flex gap-2.5">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9 text-xs">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Dropped">Dropped</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-28 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  <SelectItem value="NDS">NDS</SelectItem>
                  <SelectItem value="DHJ">DHJ</SelectItem>
                  <SelectItem value="HSD">HSD</SelectItem>
                  <SelectItem value="APL">APL</SelectItem>
                  <SelectItem value="TCD">TCD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Table View - Compact */}
          <div className="hidden lg:block">
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-10 px-4 text-xs font-semibold text-center">Initiative</TableHead>
                    <TableHead className="h-10 px-4 text-xs font-semibold text-center">Site</TableHead>
                    <TableHead className="h-10 px-4 text-xs font-semibold text-center">Status</TableHead>
                    {/* <TableHead className="h-12 px-4 text-sm font-semibold text-center">Current Stage</TableHead> */}
                    <TableHead className="h-10 px-4 text-xs font-semibold text-center">Expected Savings</TableHead>
                    {/* <TableHead className="h-12 px-4 text-sm font-semibold text-center">Progress</TableHead> */}
                    <TableHead className="h-10 px-4 text-xs font-semibold text-center">Last Updated</TableHead>
                    <TableHead className="h-10 px-4 text-xs font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.data.map((initiative: Initiative) => (
                    <TableRow key={initiative.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="p-4 text-center">
                        <div className="space-y-1.5">
                          <p className="font-medium text-xs leading-tight max-w-48">
                            {initiative.initiativeNumber || initiative.title}
                          </p>
                          <Badge variant="outline" className="text-2xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700">
                            {initiative.discipline}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <Badge variant="outline" className="text-xs font-medium bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 text-indigo-700">
                          {initiative.site}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <Badge className={`${getStatusColor(initiative.status)} text-xs font-medium`}>
                          {initiative.status}
                        </Badge>
                      </TableCell>
                      {/* <TableCell className="p-4 text-center">
                        <p className="text-sm text-muted-foreground max-w-48 truncate mx-auto">
                          {initiative.currentStageName}
                        </p>
                      </TableCell> */}
                      <TableCell className="p-4 text-center">
                        <span className="font-semibold text-emerald-600 text-xs">
                          {formatCurrency(initiative.expectedSavings)}
                        </span>
                      </TableCell>
                      {/* <TableCell className="p-4 text-center">
                        <div className="space-y-2 max-w-24 mx-auto">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{initiative.status?.toLowerCase() === 'completed' 
                              ? '100' 
                              : Math.round((Math.min(initiative.currentStage || 1, 10)) * 100 / 10)}%</span>
                          </div>
                          <Progress value={initiative.status?.toLowerCase() === 'completed' 
                            ? 100 
                            : Math.round((Math.min(initiative.currentStage || 1, 10)) * 100 / 10)} className="h-2" />
                        </div>
                      </TableCell> */}
                      <TableCell className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{initiative.lastUpdated}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleViewInitiative(initiative)}
                            title="View Initiative"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {user.role !== 'VIEWER' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 w-7 p-0 hover:bg-secondary hover:text-secondary-foreground transition-colors"
                              onClick={() => handleEditInitiative(initiative)}
                              title="Edit Initiative"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 w-7 p-0 hover:bg-green-600 hover:text-white transition-colors"
                            onClick={() => handleDownloadForm(initiative)}
                            title="Download Initiative Form"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile/Tablet Card View - Compact */}
          <div className="lg:hidden space-y-3">
            {paginatedData.data.map((initiative: Initiative) => (
              <Card key={initiative.id} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-xs">{initiative.initiativeNumber || initiative.title}</h3>
                      <p className="text-xs text-muted-foreground">{initiative.discipline} • {initiative.site}</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs bg-slate-50 border-slate-200 text-slate-600">
                      {initiative.id}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <Badge className={`${getStatusColor(initiative.status)} text-xs font-medium`}>
                          {initiative.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Expected Savings</p>
                        <p className="font-semibold text-emerald-600 text-xs">
                          {formatCurrency(initiative.expectedSavings)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Current Stage</p>
                        <p className="text-xs text-muted-foreground">{initiative.currentStageName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Progress</p>
                        <div className="space-y-1">
                          <Progress value={initiative.status?.toLowerCase() === 'completed' 
                            ? 100 
                            : Math.round((Math.min(initiative.currentStage || 1, 10)) * 100 / 10)} className="h-1.5" />
                          <p className="text-2xs text-muted-foreground">
                            {initiative.status?.toLowerCase() === 'completed' 
                              ? '100' 
                              : Math.round((Math.min(initiative.currentStage || 1, 10)) * 100 / 10)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Updated: {initiative.lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleViewInitiative(initiative)}
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {user.role !== 'VIEWER' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 w-7 p-0 hover:bg-secondary hover:text-secondary-foreground"
                          onClick={() => handleEditInitiative(initiative)}
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 w-7 p-0 hover:bg-green-600 hover:text-white"
                        onClick={() => handleDownloadForm(initiative)}
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Pagination - Compact */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginatedData.totalItems)} of {paginatedData.totalItems} initiatives
            </div>
            
            <div className="flex items-center space-x-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(paginatedData.totalPages, 5) }, (_, i) => {
                  let page;
                  if (paginatedData.totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= paginatedData.totalPages - 2) {
                    page = paginatedData.totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginatedData.totalPages))}
                disabled={currentPage === paginatedData.totalPages}
                className="h-8 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Initiative Modal */}
      <InitiativeModal
        isOpen={!!selectedInitiative}
        onClose={handleCloseModal}
        initiative={selectedInitiative}
        mode={modalMode}
        onSave={handleSaveInitiative}
        user={user}
      />
    </div>
  );
}
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
  Download
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
}

interface InitiativesProps {
  user: User;
}

// Fallback stage names if API doesn't provide currentStageName
const WORKFLOW_STAGE_NAMES: { [key: number]: string } = {
  1: 'Register Initiative',
  2: 'Approval',
  3: 'Define Responsibilities',
  4: 'MOC Stage',
  5: 'CAPEX Stage',
  6: 'Initiative Timeline Tracker',
  7: 'Trial Implementation & Performance Check',
  8: 'Periodic Status Review with CMO',
  9: 'Savings Monitoring (1 Month)',
  10: 'Saving Validation with F&A',
  11: 'Initiative Closure'
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
        currentStage: Math.min(item.currentStage || 1, 11), // Cap at stage 11
        // Prioritize currentStageName from API for instant display
        currentStageName: item.status?.toLowerCase() === 'completed' 
          ? 'Initiative Closure' 
          : (item.currentStageName || WORKFLOW_STAGE_NAMES[Math.min(item.currentStage || 1, 11)] || `Stage ${Math.min(item.currentStage || 1, 11)}`),
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
    // Exact matching with database STATUS column values
    switch (status.trim()) {
      case "Pending": return "bg-destructive text-destructive-foreground";
      case "In Progress": return "bg-primary text-primary-foreground";
      case "Completed": return "bg-success text-success-foreground";
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

  const formatCurrency = (value: string | number) => {
    if (typeof value === 'string') return value;
    return `₹${value.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2">
        <div className="text-center py-6">
          <p className="text-destructive">Error loading initiatives: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-1.5 text-base">
                <FileText className="h-3.5 w-3.5" />
                Initiatives Management
              </CardTitle>
              <CardDescription className="text-2xs">
                Track and manage all initiatives across different sites and stages
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-2xs">
              {paginatedData.totalItems} initiatives
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-1.5 top-1.5 h-2.5 w-2.5 text-muted-foreground" />
              <Input
                placeholder="Search by title, number, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-6 h-6 text-2xs"
              />
            </div>
            <div className="flex gap-1.5">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-24 h-6 text-2xs">
                  <Filter className="h-2.5 w-2.5 mr-0.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-20 h-6 text-2xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  <SelectItem value="NDS">NDS</SelectItem>
                  <SelectItem value="HSD1">HSD1</SelectItem>
                  <SelectItem value="HSD2">HSD2</SelectItem>
                  <SelectItem value="HSD3">HSD3</SelectItem>
                  <SelectItem value="DHJ">DHJ</SelectItem>
                  <SelectItem value="APL">APL</SelectItem>
                  <SelectItem value="TCD">TCD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-7 px-1.5 text-2xs font-medium text-center">Initiative</TableHead>
                    <TableHead className="h-7 px-1.5 text-2xs font-medium text-center">Site</TableHead>
                    <TableHead className="h-7 px-1.5 text-2xs font-medium text-center">Status</TableHead>
                    {/* <TableHead className="h-7 px-1.5 text-2xs font-medium text-center">Priority</TableHead> */}
                    <TableHead className="h-7 px-1.5 text-2xs font-medium text-center">Current Stage</TableHead>
                    <TableHead className="h-7 px-1.5 text-2xs font-medium text-center">Expected Savings</TableHead>
                    <TableHead className="h-7 px-1.5 text-2xs font-medium text-center">Progress</TableHead>
                    <TableHead className="h-7 px-1.5 text-2xs font-medium text-center">Last Updated</TableHead>
                    <TableHead className="h-7 px-1.5 text-2xs font-medium text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.data.map((initiative: Initiative) => (
                    <TableRow key={initiative.id} className="hover:bg-muted/30">
                      <TableCell className="p-1.5 text-center">
                        <div className="space-y-0.5">
                          <p className="font-medium text-2xs leading-tight">
                            {initiative.initiativeNumber || initiative.title}
                          </p>
                          <Badge variant="outline" className="text-2xs">
                            {initiative.discipline}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="p-1.5 text-center">
                        <Badge variant="outline" className="text-2xs">
                          {initiative.site}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-1.5 text-center">
                        <Badge className={`${getStatusColor(initiative.status)} text-2xs`}>
                          {initiative.status}
                        </Badge>
                      </TableCell>
                      {/* <TableCell className="p-1.5 text-center">
                        <Badge className={`${getPriorityColor(initiative.priority)} text-2xs`}>
                          {initiative.priority}
                        </Badge>
                      </TableCell> */}
                      <TableCell className="p-1.5 text-center">
                        <p className="text-2xs text-muted-foreground max-w-32 truncate mx-auto">
                          {initiative.currentStageName}
                        </p>
                      </TableCell>
                      <TableCell className="p-1.5 text-center">
                        <span className="font-semibold text-success text-2xs">
                          {formatCurrency(initiative.expectedSavings)}
                        </span>
                      </TableCell>
                      <TableCell className="p-1.5 text-center">
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-2xs">
                            <span>Progress</span>
                            <span>{initiative.status?.toLowerCase() === 'completed' 
                              ? '100' 
                              : Math.round(((Math.min(initiative.currentStage || 1, 11)) - 1) * 100 / 10)}%</span>
                          </div>
                          <Progress value={initiative.status?.toLowerCase() === 'completed' 
                            ? 100 
                            : Math.round(((Math.min(initiative.currentStage || 1, 11)) - 1) * 100 / 10)} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell className="p-1.5 text-center">
                        <div className="flex items-center justify-center gap-0.5 text-2xs text-muted-foreground">
                          <Calendar className="h-2 w-2" />
                          <span className="truncate">{initiative.lastUpdated}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-1.5 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-5 w-5 p-0 hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleViewInitiative(initiative)}
                            title="View Initiative"
                          >
                            <Eye className="h-2.5 w-2.5" />
                          </Button>
                          {user.role !== 'VIEWER' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-5 w-5 p-0 hover:bg-secondary hover:text-secondary-foreground transition-colors"
                              onClick={() => handleEditInitiative(initiative)}
                              title="Edit Initiative"
                            >
                              <Edit className="h-2.5 w-2.5" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-5 w-5 p-0 hover:bg-green-600 hover:text-white transition-colors"
                            onClick={() => handleDownloadForm(initiative)}
                            title="Download Initiative Form"
                          >
                            <Download className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-1.5">
            {paginatedData.data.map((initiative: Initiative) => (
              <Card key={initiative.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-2">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="space-y-0.5">
                      <h3 className="font-semibold text-2xs">{initiative.initiativeNumber || initiative.title}</h3>
                      <p className="text-2xs text-muted-foreground">{initiative.discipline} • {initiative.site}</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-2xs">
                      {initiative.id}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <div className="space-y-1">
                      <div>
                        <p className="text-2xs text-muted-foreground">Status</p>
                        <Badge className={`${getStatusColor(initiative.status)} text-2xs`}>
                          {initiative.status}
                        </Badge>
                      </div>
                      {/* <div>
                        <p className="text-2xs text-muted-foreground">Priority</p>
                        <Badge className={`${getPriorityColor(initiative.priority)} text-2xs`}>
                          {initiative.priority}
                        </Badge>
                      </div> */}
                    </div>
                    
                    <div className="space-y-1">
                      <div>
                        <p className="text-2xs text-muted-foreground">Expected Savings</p>
                        <p className="font-semibold text-success text-2xs">
                          {formatCurrency(initiative.expectedSavings)}
                        </p>
                      </div>
                      <div>
                        <p className="text-2xs text-muted-foreground">Current Stage</p>
                        <p className="text-2xs text-muted-foreground">{initiative.currentStageName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-2xs text-muted-foreground">
                      <Calendar className="h-2 w-2" />
                      <span>Updated: {initiative.lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-5 w-5 p-0 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleViewInitiative(initiative)}
                        title="View"
                      >
                        <Eye className="h-2.5 w-2.5" />
                      </Button>
                      {user.role !== 'VIEWER' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-5 w-5 p-0 hover:bg-secondary hover:text-secondary-foreground"
                          onClick={() => handleEditInitiative(initiative)}
                          title="Edit"
                        >
                          <Edit className="h-2.5 w-2.5" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-5 w-5 p-0 hover:bg-green-600 hover:text-white"
                        onClick={() => handleDownloadForm(initiative)}
                        title="Download"
                      >
                        <Download className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-2">
            <div className="text-2xs text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginatedData.totalItems)} of {paginatedData.totalItems} initiatives
            </div>
            
            <div className="flex items-center space-x-0.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-5 px-1.5 text-2xs"
              >
                <ChevronLeft className="h-2.5 w-2.5" />
                Previous
              </Button>
              
              <div className="flex items-center gap-0.5">
                {Array.from({ length: paginatedData.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-5 w-5 p-0 text-2xs"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginatedData.totalPages))}
                disabled={currentPage === paginatedData.totalPages}
                className="h-5 px-1.5 text-2xs"
              >
                Next
                <ChevronRight className="h-2.5 w-2.5" />
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
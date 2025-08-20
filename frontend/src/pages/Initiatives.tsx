import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useProgressPercentage, useCurrentPendingStage } from "@/hooks/useWorkflowTransactions";
import InitiativeModal from "@/components/modals/InitiativeModal";
import InitiativeProgress from "@/components/initiative/InitiativeProgress";
import CurrentStage from "@/components/initiative/CurrentStage";
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
  description?: string;
  startDate?: string;
  endDate?: string;
  currentStage?: number;
  requiresMoc?: boolean;
  requiresCapex?: boolean;
  createdByName?: string;
  createdByEmail?: string;
  createdBy?: number | string; // User ID who created the initiative
  initiatorName?: string; // Name of the person who initiated the initiative
}

interface InitiativesProps {
  user: User;
}

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
        currentStage: item.currentStage,
        currentStageName: item.currentStageName, // New field from backend API
        requiresMoc: item.requiresMoc,
        requiresCapex: item.requiresCapex,
        createdByName: item.createdBy?.fullName || item.createdByName,
        createdByEmail: item.createdBy?.email || item.createdByEmail,
        initiatorName: item.initiatorName,
        createdBy: item.createdBy?.id || item.createdBy,
      }));
    } else {
      return mockInitiatives;
    }
  }, [apiInitiatives]);

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

  // Filter initiatives
  const filteredInitiatives = initiatives.filter((initiative: Initiative) => {
    const matchesStatus = statusFilter === "all" || initiative.status.toLowerCase().includes(statusFilter);
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
    switch (status.toLowerCase()) {
      case "completed": return "bg-success text-success-foreground";
      case "in progress": return "bg-primary text-primary-foreground";
      case "under review": return "bg-warning text-warning-foreground";
      case "pending decision": return "bg-warning text-warning-foreground";
      case "registered": return "bg-muted text-muted-foreground";
      case "implementation": return "bg-primary text-primary-foreground";
      case "moc review": return "bg-warning text-warning-foreground";
      case "cmo review": return "bg-primary text-primary-foreground";
      case "decision pending": return "bg-warning text-warning-foreground";
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

  const formatCurrency = (amount: string | number) => {
    const amountStr = typeof amount === 'number' ? `₹${amount.toLocaleString()}` : amount.toString();
    return amountStr.replace('₹', '₹ ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Initiative Management
          </CardTitle>
          <CardDescription>
            Track and manage operational excellence initiatives across all sites
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search initiatives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="under review">Under Review</SelectItem>
                <SelectItem value="implementation">Implementation</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Sites" />
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

            {(statusFilter !== "all" || siteFilter !== "all" || searchTerm !== "") && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setSiteFilter("all");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Initiatives Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Initiatives List
          </CardTitle>
          <CardDescription>
            Showing {paginatedData.data.length} of {paginatedData.totalItems} initiatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                     <TableHead className="min-w-44">Initiative & Discipline</TableHead>
                     <TableHead className="w-16">Site</TableHead>
                     <TableHead className="w-28">Status</TableHead>
                     <TableHead className="w-20">Priority</TableHead>
                     <TableHead className="w-28">Expected Savings</TableHead>
                     <TableHead className="w-28">Current Stage</TableHead>
                     <TableHead className="w-20">Progress</TableHead>
                     <TableHead className="w-24">Last Updated</TableHead>
                     <TableHead className="w-48">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.data.map((initiative: Initiative) => (
                    <TableRow key={initiative.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="p-3">
                        <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                          {initiative.id}
                        </Badge>
                      </TableCell>
                       <TableCell className="p-3">
                         <div className="space-y-1">
                           <p className="font-medium text-sm leading-tight">{initiative.initiativeNumber || initiative.title}</p>
                           <p className="text-xs text-muted-foreground">{initiative.discipline}</p>
                         </div>
                       </TableCell>
                      <TableCell className="p-3">
                        <Badge variant="outline" className="text-xs px-2 py-1">{initiative.site}</Badge>
                      </TableCell>
                      <TableCell className="p-3">
                        <Badge className={`${getStatusColor(initiative.status)} text-xs px-2 py-1`}>
                          {initiative.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3">
                        <Badge className={`${getPriorityColor(initiative.priority)} text-xs px-2 py-1`}>
                          {initiative.priority}
                        </Badge>
                      </TableCell>
                       <TableCell className="p-3">
                         <span className="font-semibold text-success text-sm">
                           {formatCurrency(initiative.expectedSavings)}
                         </span>
                       </TableCell>
                       <TableCell className="p-3">
                         <CurrentStage 
                           initiativeId={initiative.id} 
                           fallbackStage={initiative.currentStage} 
                         />
                       </TableCell>
                       <TableCell className="p-3">
                         <InitiativeProgress 
                           initiativeId={initiative.id} 
                           fallbackProgress={initiative.progress} 
                         />
                       </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="truncate">{initiative.lastUpdated}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-3 text-xs hover:bg-primary hover:text-primary-foreground transition-colors min-w-[70px]"
                            onClick={() => handleViewInitiative(initiative)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-3 text-xs hover:bg-secondary hover:text-secondary-foreground transition-colors min-w-[70px]"
                            onClick={() => handleEditInitiative(initiative)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 hover:bg-green-600 hover:text-white transition-colors"
                            onClick={() => handleDownloadForm(initiative)}
                            title="Download Initiative Form"
                          >
                            <Download className="h-4 w-4" />
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
          <div className="lg:hidden space-y-4">
            {paginatedData.data.map((initiative: Initiative) => (
              <Card key={initiative.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm">{initiative.initiativeNumber || initiative.title}</h3>
                      <p className="text-xs text-muted-foreground">{initiative.discipline} • {initiative.site}</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {initiative.id}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge className={`${getStatusColor(initiative.status)} text-xs`}>
                          {initiative.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Priority</p>
                        <Badge className={`${getPriorityColor(initiative.priority)} text-xs`}>
                          {initiative.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Expected Savings</p>
                        <p className="font-semibold text-success text-sm">
                          {formatCurrency(initiative.expectedSavings)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <InitiativeProgress 
                          initiativeId={initiative.id} 
                          fallbackProgress={initiative.progress} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Updated: {initiative.lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2 text-xs hover:bg-primary hover:text-primary-foreground min-w-[60px]"
                        onClick={() => handleViewInitiative(initiative)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2 text-xs hover:bg-secondary hover:text-secondary-foreground min-w-[60px]"
                        onClick={() => handleEditInitiative(initiative)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 w-7 p-0 hover:bg-green-600 hover:text-white"
                        onClick={() => handleDownloadForm(initiative)}
                        title="Download Form"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginatedData.totalItems)} of {paginatedData.totalItems} initiatives
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: paginatedData.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 p-0"
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
                className="h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4" />
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
      />
    </div>
  );
}
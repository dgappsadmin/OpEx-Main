import { useState } from "react";
import { User } from "@/lib/mockData";
import { useInitiatives } from "@/hooks/useInitiatives";
import { 
  useWorkflowTransactions, 
  useProcessStageAction 
} from "@/hooks/useWorkflowTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, ArrowLeft, User as UserIcon, Search, Filter, MapPin, GitBranch, Activity, Workflow } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import WorkflowStageModal from "@/components/workflow/WorkflowStageModal";
import { DynamicWorkflowTracker } from "@/components/workflow/DynamicWorkflowTracker";

interface NewWorkflowProps {
  user: User;
}

export default function NewWorkflow({ user }: NewWorkflowProps) {
  const [selectedInitiative, setSelectedInitiative] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initiativeTransactions, setInitiativeTransactions] = useState<{[key: number]: any[]}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("default"); // "default" or "completed"
  const [siteFilter, setSiteFilter] = useState(user.site || ""); // Default to user's site
  const { toast } = useToast();
  
  // Site options
  const sites = [
    { code: "NDS", name: "NDS" },
    { code: "DHJ", name: "HSD1" },
    { code: "HSD", name: "HSD2" },
    { code: "APL", name: "DHJ" },
    { code: "TCD", name: "APL" }
  ];
  
  // Prepare filters for API call - corrected parameter names and status values
  const apiFilters = {
    search: searchTerm.trim() || undefined, // Backend expects 'search' parameter
    // Don't send status filter to API, we'll filter on frontend to handle multiple status logic
    site: siteFilter && siteFilter !== "all" ? siteFilter : undefined, // Filter by site, skip if "all" is selected
  };
  
  const { data: initiativesData } = useInitiatives(apiFilters);
  const { data: workflowTransactions = [], refetch: refetchTransactions } = useWorkflowTransactions(selectedInitiative || 0);
  const processStageAction = useProcessStageAction();
  
  // Function to get stage name from workflow transactions
  const getStageName = (stageNumber: number, initiativeId?: number) => {
    // If we have an initiative ID and workflow transactions loaded, use them
    if (initiativeId && workflowTransactions.length > 0) {
      const transaction = workflowTransactions.find((t: any) => t.stageNumber === stageNumber);
      if (transaction && transaction.stageName) {
        return transaction.stageName;
      }
    }
    
    // For the selected initiative, always try to get from transactions first
    if (initiativeId === selectedInitiative && workflowTransactions.length > 0) {
      const transaction = workflowTransactions.find((t: any) => t.stageNumber === stageNumber);
      if (transaction && transaction.stageName) {
        return transaction.stageName;
      }
    }
    
    // Fallback to hardcoded stage names based on stage number (updated to 10 stages)
    const stageNames: { [key: number]: string } = {
      1: "Register Initiative",
      2: "Approval", 
      3: "Define Responsibilities",
      4: "MOC-CAPEX Evaluation",
      5: "Initiative Timeline Tracker",
      6: "Trial Implementation & Performance Check",
      7: "Periodic Status Review with CMO",
      8: "Savings Monitoring (1 Month)",
      9: "Saving Validation with F&A", 
      10: "Initiative Closure"
    };
    
    return stageNames[stageNumber] || `Stage ${stageNumber}`;
  };
  
  // Mock data fallback - removed to use only real API data
  const mockInitiatives: any[] = [];
  
  // Use only real API data, no mock fallback
  const initiatives = (Array.isArray(initiativesData?.content) && initiativesData.content.length > 0) 
    ? initiativesData.content 
    : (Array.isArray(initiativesData) && initiativesData.length > 0) 
    ? initiativesData 
    : []; // Empty array if no real data

  // Filter initiatives by status based on STATUS column values
  const filteredInitiatives = initiatives.filter((initiative: any) => {
    if (statusFilter === "completed") {
      return initiative.status?.trim() === "Completed";
    } else if (statusFilter === "default") {
      // Default shows only Pending and In Progress (excludes Completed)
      const status = initiative.status?.trim();
      return status === "Pending" || status === "In Progress";
    }
    return true; // Show all if no filter
  });

  // Sort filtered initiatives by status priority and creation date (recently created first)
  const sortedInitiatives = [...filteredInitiatives].sort((a, b) => {
    // First, prioritize pending status initiatives (exact match with DB STATUS column)
    const aIsPending = a.status?.trim() === 'Pending';
    const bIsPending = b.status?.trim() === 'Pending';
    
    if (aIsPending && !bIsPending) return -1;
    if (!aIsPending && bIsPending) return 1;
    
    // Then sort by creation date (most recent first)
    const dateA = new Date(a.submittedDate || a.createdDate || a.createdAt || '');
    const dateB = new Date(b.submittedDate || b.createdDate || b.createdAt || '');
    return dateB.getTime() - dateA.getTime();
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedInitiatives.length / itemsPerPage);
  const paginatedInitiatives = sortedInitiatives.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset current page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSiteFilterChange = (value: string) => {
    setSiteFilter(value);
    setCurrentPage(1);
  };

  const handleProcessStage = (data: any) => {
    processStageAction.mutate(data, {
      onSuccess: () => {
        toast({ 
          title: data.action === 'approved' ? "Stage approved successfully" : "Stage rejected",
          description: "The workflow has been updated."
        });
        refetchTransactions();
        setIsModalOpen(false);
        setSelectedTransaction(null);
      },
      onError: (error: any) => {
        toast({ 
          title: "Error processing stage", 
          description: error.response?.data?.message || "Something went wrong",
          variant: "destructive" 
        });
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'pending': return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
      default: return <Clock className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'in_progress': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getRoleCodeDescription = (roleCode: string) => {
    const roles: { [key: string]: string } = {
      'STLD': 'Site TSD Lead',
      'SH': 'Site Head',
      'EH': 'Engineering Head',
      'IL': 'Initiative Lead',
      'CTSD': 'Corp TSD'
    };
    return roles[roleCode] || roleCode;
  };

  const selectedInitiativeData = initiatives.find((i: any) => i.id === selectedInitiative);

  return (
    <div className="container mx-auto p-4 space-y-4 max-w-6xl">
      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Workflow Management
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Manage approval workflows with role-based permissions
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-medium">
          <Activity className="h-3 w-3 mr-1.5" />
          Active Workflows
        </Badge>
      </div>

      <Tabs defaultValue="stages" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10 p-0.5 bg-muted/50">
          <TabsTrigger value="stages" className="font-medium text-xs flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Initiative Workflow
          </TabsTrigger>
          <TabsTrigger value="dynamic" className="font-medium text-xs flex items-center gap-1.5">
            <Workflow className="h-3.5 w-3.5" />
            View Workflow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-4 mt-4">
          {!selectedInitiative ? (
            <div className="space-y-4">
              {/* Search and Filter Controls - Compact */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-600" />
                    Search & Filter Initiatives
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Search by Initiative Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Search by Initiative Number</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Enter initiative number..."
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="pl-8 h-9 text-xs"
                        />
                      </div>
                    </div>

                    {/* Site Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Site Filter</label>
                      <Select value={siteFilter} onValueChange={handleSiteFilterChange}>
                        <SelectTrigger className="h-9 text-xs">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <SelectValue placeholder="Select site" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sites</SelectItem>
                          {sites.map((site) => (
                            <SelectItem key={site.code} value={site.code}>
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Status Filter</label>
                      <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                        <SelectTrigger className="h-9 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Filter className="h-3.5 w-3.5" />
                            <SelectValue placeholder="Select status filter" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default (Pending & In Progress)</SelectItem>
                          <SelectItem value="completed">Completed Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Results summary */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>
                      Showing {sortedInitiatives.length} initiative{sortedInitiatives.length !== 1 ? 's' : ''} 
                      {searchTerm && ` matching "${searchTerm}"`}
                      {siteFilter && siteFilter !== "all" && ` for site ${siteFilter}`}
                      {statusFilter === "completed" ? " with Completed status" : " (Pending & In Progress only)"}
                    </span>
                    <span>Sorted by: Recently Created</span>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center py-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10">
                  <GitBranch className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1.5">Select Initiative</h2>
                <p className="text-muted-foreground text-xs">Choose an initiative to manage its workflow stages</p>
              </div>
              
              <div className="space-y-3">
                {paginatedInitiatives.map((initiative: any) => (
                  <Card
                    key={initiative.id}
                    className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border hover:border-primary/30 bg-gradient-to-r from-card to-card/50"
                    onClick={() => setSelectedInitiative(initiative.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">{initiative.initiativeNumber || initiative.title}</h3>
                            <Badge className={`${getStatusColor(initiative.status)} font-semibold text-xs`}>
                              {initiative.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">Site:</span>
                              <p className="font-medium">{initiative.site}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Initiative Lead:</span>
                              <p className="font-medium">{initiative.initiativeLead || 'Not Assigned'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Current Stage:</span>
                              <p className="font-medium">{getStageName(initiative.currentStage || 1, initiative.id)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expected Savings:</span>
                              <p className="font-medium">₹{initiative.expectedSavings || 0}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{(() => {
                                const currentStage = initiative.currentStage || 1;
                                const status = initiative.status?.trim();
                                
                                if (status === 'Completed') {
                                  return 100;
                                } else {
                                  // Calculate progress: each approved stage = 10%
                                  // If currentStage is 3, it means stages 1 and 2 are approved = 20%
                                  // Current stage is the next pending stage, so approved stages = currentStage - 1
                                  const approvedStages = Math.max(0, currentStage - 1);
                                  return Math.min(100, Math.round((approvedStages * 100) / 10));
                                }
                              })()}%</span>
                            </div>
                            <Progress value={(() => {
                              const currentStage = initiative.currentStage || 1;
                              const status = initiative.status?.trim();
                              
                              if (status === 'Completed') {
                                return 100;
                              } else {
                                // Calculate progress: each approved stage = 10%
                                // If currentStage is 3, it means stages 1 and 2 are approved = 20%
                                // Current stage is the next pending stage, so approved stages = currentStage - 1
                                const approvedStages = Math.max(0, currentStage - 1);
                                return Math.min(100, Math.round((approvedStages * 100) / 10));
                              }
                            })()} className="h-1.5" />
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-200 text-xs"
                          >
                            View Workflow
                            <ArrowLeft className="ml-1.5 h-3.5 w-3.5 rotate-180" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink 
                            href="#" 
                            isActive={currentPage === i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedInitiative(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="font-medium">Back to Initiatives</span>
                </Button>
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-0.5 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {selectedInitiativeData?.initiativeNumber || selectedInitiativeData?.title || 'Initiative'}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium">Workflow Stages</p>
                  </div>
                </div>
              </div>
              
              {workflowTransactions.length === 0 ? (
                <Card className="border-dashed shadow-sm">
                  <CardContent className="p-8 text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-muted">
                      <GitBranch className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5">No Workflow Stages</h3>
                    <p className="text-muted-foreground text-xs">No workflow stages found for this initiative.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {workflowTransactions.map((transaction: any) => (
                    <Card key={transaction.id} className="relative overflow-hidden border-l-3 border-l-primary/30 hover:shadow-md transition-all duration-200 shadow-sm">
                      <CardHeader className="bg-gradient-to-r from-background to-primary/5 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-lg">
                              {transaction.stageNumber}
                            </div>
                            <div>
                              <CardTitle className="text-base text-foreground">
                                {transaction.stageName}
                              </CardTitle>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-muted-foreground">Required Role:</span>
                                <Badge variant="secondary" className="text-xs font-medium">
                                  {getRoleCodeDescription(transaction.requiredRole)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(transaction.approveStatus)}
                            <Badge className={`${getStatusColor(transaction.approveStatus)} font-semibold text-xs`}>
                              {transaction.approveStatus?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-3">
                        {transaction.actionBy && (
                          <div className="flex items-center gap-2 text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <UserIcon className="h-3.5 w-3.5" />
                            <span>
                              {transaction.approveStatus === 'approved' ? 'Approved' : 'Rejected'} by: 
                              <span className="font-medium ml-1">{transaction.actionBy}</span>
                            </span>
                            {transaction.actionDate && (
                              <span className="text-muted-foreground">
                                on {new Date(transaction.actionDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {transaction.comment && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-xs font-medium mb-1.5">Comments:</p>
                            <p className="text-xs">{transaction.comment}</p>
                          </div>
                        )}

                        {/* Show additional info for specific stages */}
                        {transaction.assignedUserId && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs">
                            <span className="font-medium">Assigned Initiative Lead ID:</span>
                            <span className="ml-2">{transaction.assignedUserId}</span>
                          </div>
                        )}

                        {/* Next pending stage info */}
                        {workflowTransactions.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs">
                            {(() => {
                              const nextPendingTransaction = workflowTransactions.find((t: any) => t.approveStatus === 'pending');
                              if (nextPendingTransaction) {
                                return (
                                  <>
                                    <span className="font-medium">Next Pending:</span>
                                    <span className="ml-2">
                                      Stage {nextPendingTransaction.stageNumber}: {nextPendingTransaction.stageName} 
                                      (Pending with: {getRoleCodeDescription(nextPendingTransaction.requiredRole)})
                                    </span>
                                  </>
                                );
                              }
                              return (
                                <>
                                  <span className="font-medium">Status:</span>
                                  <span className="ml-2 text-green-600">All stages completed</span>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {transaction.approveStatus === 'pending' && transaction.pendingWith === user.email && (
                          <div className="border-t pt-3">
                            <Button 
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIsModalOpen(true);
                              }}
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-lg shadow-md transition-all duration-200 text-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              Process This Stage
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dynamic" className="space-y-4 mt-4">
          {!selectedInitiative ? (
            <div className="space-y-4">
              {/* Search and Filter Controls - Compact */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4 text-blue-600" />
                    Search & Filter Initiatives
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Search by Initiative Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Search by Initiative Number</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Enter initiative number..."
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="pl-8 h-9 text-xs"
                        />
                      </div>
                    </div>

                    {/* Site Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Site Filter</label>
                      <Select value={siteFilter} onValueChange={handleSiteFilterChange}>
                        <SelectTrigger className="h-9 text-xs">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <SelectValue placeholder="Select site" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sites</SelectItem>
                          {sites.map((site) => (
                            <SelectItem key={site.code} value={site.code}>
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Status Filter</label>
                      <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                        <SelectTrigger className="h-9 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Filter className="h-3.5 w-3.5" />
                            <SelectValue placeholder="Select status filter" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default (Pending & In Progress)</SelectItem>
                          <SelectItem value="completed">Completed Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Results summary */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>
                      Showing {sortedInitiatives.length} initiative{sortedInitiatives.length !== 1 ? 's' : ''} 
                      {searchTerm && ` matching "${searchTerm}"`}
                      {siteFilter && siteFilter !== "all" && ` for site ${siteFilter}`}
                      {statusFilter === "completed" ? " with Completed status" : " (Pending & In Progress only)"}
                    </span>
                    <span>Sorted by: Recently Created</span>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center py-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10">
                  <Workflow className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1.5">Select Initiative for Dynamic Workflow</h2>
                <p className="text-muted-foreground text-xs">Choose an initiative to view its dynamic role-based workflow progression</p>
              </div>
              
              <div className="space-y-3">
                {paginatedInitiatives.map((initiative: any) => (
                  <Card
                    key={initiative.id}
                    className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border hover:border-primary/30 bg-gradient-to-r from-card to-card/50"
                    onClick={() => setSelectedInitiative(initiative.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">{initiative.initiativeNumber || initiative.title}</h3>
                            <Badge className={`${getStatusColor(initiative.status)} font-semibold text-xs`}>
                              {initiative.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-muted-foreground">Site:</span>
                              <p className="font-medium">{initiative.site}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Initiative Lead:</span>
                              <p className="font-medium">{initiative.initiativeLead || 'Not Assigned'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Current Stage:</span>
                              <p className="font-medium">{getStageName(initiative.currentStage || 1, initiative.id)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expected Savings:</span>
                              <p className="font-medium">₹{initiative.expectedSavings || 0}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-200 text-xs"
                          >
                            View Dynamic Workflow
                            <ArrowLeft className="ml-1.5 h-3.5 w-3.5 rotate-180" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink 
                            href="#" 
                            isActive={currentPage === i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedInitiative(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="font-medium">Back to Initiatives</span>
                </Button>
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-0.5 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {selectedInitiativeData?.initiativeNumber || selectedInitiativeData?.title || 'Initiative'}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium">Dynamic Role-Based Workflow System</p>
                  </div>
                </div>
              </div>
              
              <DynamicWorkflowTracker initiativeId={selectedInitiative} />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Workflow Stage Modal */}
      <WorkflowStageModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        userRole={user.role || ""}
        onProcess={handleProcessStage}
        isLoading={processStageAction.isPending}
      />
    </div>
  );
}
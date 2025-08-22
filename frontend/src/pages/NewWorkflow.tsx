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
import { CheckCircle, XCircle, Clock, ArrowLeft, User as UserIcon, Search, Filter } from "lucide-react";
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
  const { toast } = useToast();
  
  // Prepare filters for API call - corrected parameter names and status values
  const apiFilters = {
    search: searchTerm.trim() || undefined, // Backend expects 'search' parameter
    status: statusFilter === "completed" ? "Completed" : undefined, // Default shows all non-completed (Pending & In Progress)
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
    
    // Fallback to hardcoded stage names based on stage number
    const stageNames: { [key: number]: string } = {
      1: "Register Initiative",
      2: "Approval", 
      3: "Define Responsibilities",
      4: "MOC Stage",
      5: "CAPEX Stage",
      6: "Initiative Timeline Tracker",
      7: "Trial Implementation & Performance Check",
      8: "Periodic Status Review with CMO",
      9: "Savings Monitoring (1 Month)",
      10: "Saving Validation with F&A", 
      11: "Initiative Closure"
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

  // Sort initiatives by creation date (recently created first)
  const sortedInitiatives = [...initiatives].sort((a, b) => {
    const dateA = new Date(a.submittedDate || a.createdDate || '');
    const dateB = new Date(b.submittedDate || b.createdDate || '');
    return dateB.getTime() - dateA.getTime(); // Most recent first
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
      case 'approved': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'rejected': return <XCircle className="h-3 w-3 text-red-500" />;
      case 'pending': return <Clock className="h-3 w-3 text-yellow-500" />;
      default: return <Clock className="h-3 w-3 text-gray-500" />;
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
    <div className="p-2 space-y-2">
      <div className="bg-gradient-to-r from-background via-background to-primary/5 -m-2 p-2 mb-2 border-b">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary/10 text-primary">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Workflow Management</h1>
            <p className="text-muted-foreground text-2xs font-medium">Manage approval workflows with role-based permissions</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="stages" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-7 p-0.5 bg-muted/30">
          <TabsTrigger value="stages" className="font-medium text-2xs">Initiative Workflow</TabsTrigger>
          <TabsTrigger value="dynamic" className="font-medium text-2xs">View Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-2">
          {!selectedInitiative ? (
            <div className="space-y-2">
              {/* Search and Filter Controls - At the very top */}
              <div className="bg-gradient-to-r from-background via-background to-primary/5 p-3 rounded-lg border space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 text-primary">
                    <Search className="w-3 h-3" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Search & Filter Initiatives</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Search by Initiative Number */}
                  <div className="space-y-1">
                    <label className="text-2xs font-medium text-muted-foreground">Search by Initiative Number</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter initiative number..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-1">
                    <label className="text-2xs font-medium text-muted-foreground">Status Filter</label>
                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <div className="flex items-center gap-2">
                          <Filter className="h-3 w-3" />
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
                <div className="flex items-center justify-between text-2xs text-muted-foreground">
                  <span>
                    Showing {sortedInitiatives.length} initiative{sortedInitiatives.length !== 1 ? 's' : ''} 
                    {searchTerm && ` matching "${searchTerm}"`}
                    {statusFilter === "completed" ? " with Completed status" : " (Pending & In Progress only)"}
                  </span>
                  <span>Sorted by: Recently Created</span>
                </div>
              </div>

              <div className="text-center py-4">
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-primary/10">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-foreground mb-1">Select Initiative</h2>
                <p className="text-muted-foreground text-2xs">Choose an initiative to manage its workflow stages</p>
              </div>
              
              <div className="space-y-1.5">
                {paginatedInitiatives.map((initiative: any) => (
                  <Card
                    key={initiative.id}
                    className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border hover:border-primary/30 bg-gradient-to-r from-card to-card/50"
                    onClick={() => setSelectedInitiative(initiative.id)}
                  >
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">{initiative.initiativeNumber || initiative.title}</h3>
                            <Badge className={`${getStatusColor(initiative.status)} font-semibold text-2xs`}>
                              {initiative.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-2xs">
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
                          
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-2xs">
                              <span>Progress</span>
                              <span>{Math.round(((initiative.currentStage || 1) - 1) * 100 / 10)}%</span>
                            </div>
                            <Progress value={Math.round(((initiative.currentStage || 1) - 1) * 100 / 10)} className="h-1" />
                          </div>
                        </div>
                        
                        <div className="ml-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2 py-1 rounded-lg shadow-md transition-all duration-200 text-2xs"
                          >
                            View Workflow
                            <ArrowLeft className="ml-1 h-2.5 w-2.5 rotate-180" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
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
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedInitiative(null)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-2xs"
                >
                  <ArrowLeft className="h-2.5 w-2.5" />
                  <span className="font-medium">Back to Initiatives</span>
                </Button>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-0.5 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      {selectedInitiativeData?.initiativeNumber || selectedInitiativeData?.title || 'Initiative'}
                    </h2>
                    <p className="text-2xs text-muted-foreground font-medium">Workflow Stages</p>
                  </div>
                </div>
              </div>
              
              {workflowTransactions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-muted">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">No Workflow Stages</h3>
                    <p className="text-muted-foreground text-2xs">No workflow stages found for this initiative.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2">
                  {workflowTransactions.map((transaction: any) => (
                    <Card key={transaction.id} className="relative overflow-hidden border-l-2 border-l-primary/30 hover:shadow-lg transition-all duration-200">
                      <CardHeader className="bg-gradient-to-r from-background to-primary/5 pb-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-xs shadow-lg">
                              {transaction.stageNumber}
                            </div>
                            <div>
                              <CardTitle className="text-sm text-foreground">
                                {transaction.stageName}
                              </CardTitle>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-2xs text-muted-foreground">Required Role:</span>
                                <Badge variant="secondary" className="text-2xs font-medium">
                                  {getRoleCodeDescription(transaction.requiredRole)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(transaction.approveStatus)}
                            <Badge className={`${getStatusColor(transaction.approveStatus)} font-semibold text-2xs`}>
                              {transaction.approveStatus?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        {transaction.actionBy && (
                          <div className="flex items-center gap-1.5 text-2xs bg-green-50 dark:bg-green-900/20 p-1.5 rounded-lg">
                            <UserIcon className="h-2.5 w-2.5" />
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
                          <div className="bg-muted p-1.5 rounded-lg">
                            <p className="text-2xs font-medium mb-0.5">Comments:</p>
                            <p className="text-2xs">{transaction.comment}</p>
                          </div>
                        )}

                        {/* Show additional info for specific stages */}
                        {transaction.assignedUserId && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-lg text-2xs">
                            <span className="font-medium">Assigned Initiative Lead ID:</span>
                            <span className="ml-2">{transaction.assignedUserId}</span>
                          </div>
                        )}

                        {/* Next pending stage info */}
                        {workflowTransactions.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-lg text-2xs">
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

                        {transaction.approveStatus === 'pending' && transaction.requiredRole === user.role && (
                          <div className="border-t pt-1.5">
                            <Button 
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIsModalOpen(true);
                              }}
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-1.5 rounded-lg shadow-md transition-all duration-200 text-2xs"
                            >
                              <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
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

        <TabsContent value="dynamic" className="space-y-2">
          {!selectedInitiative ? (
            <div className="space-y-2">
              {/* Search and Filter Controls - At the very top */}
              <div className="bg-gradient-to-r from-background via-background to-primary/5 p-3 rounded-lg border space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 text-primary">
                    <Search className="w-3 h-3" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Search & Filter Initiatives</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Search by Initiative Number */}
                  <div className="space-y-1">
                    <label className="text-2xs font-medium text-muted-foreground">Search by Initiative Number</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Enter initiative number..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-1">
                    <label className="text-2xs font-medium text-muted-foreground">Status Filter</label>
                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <div className="flex items-center gap-2">
                          <Filter className="h-3 w-3" />
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
                <div className="flex items-center justify-between text-2xs text-muted-foreground">
                  <span>
                    Showing {sortedInitiatives.length} initiative{sortedInitiatives.length !== 1 ? 's' : ''} 
                    {searchTerm && ` matching "${searchTerm}"`}
                    {statusFilter === "completed" ? " with Completed status" : " (Pending & In Progress only)"}
                  </span>
                  <span>Sorted by: Recently Created</span>
                </div>
              </div>

              <div className="text-center py-4">
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-primary/10">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-foreground mb-1">Select Initiative for Dynamic Workflow</h2>
                <p className="text-muted-foreground text-2xs">Choose an initiative to view its dynamic role-based workflow progression</p>
              </div>
              
              <div className="space-y-1.5">
                {paginatedInitiatives.map((initiative: any) => (
                  <Card
                    key={initiative.id}
                    className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border hover:border-primary/30 bg-gradient-to-r from-card to-card/50"
                    onClick={() => setSelectedInitiative(initiative.id)}
                  >
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">{initiative.initiativeNumber || initiative.title}</h3>
                            <Badge className={`${getStatusColor(initiative.status)} font-semibold text-2xs`}>
                              {initiative.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-2xs">
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
                        
                        <div className="ml-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2 py-1 rounded-lg shadow-md transition-all duration-200 text-2xs"
                          >
                            View Dynamic Workflow
                            <ArrowLeft className="ml-1 h-2.5 w-2.5 rotate-180" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
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
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedInitiative(null)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-2xs"
                >
                  <ArrowLeft className="h-2.5 w-2.5" />
                  <span className="font-medium">Back to Initiatives</span>
                </Button>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-0.5 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      {selectedInitiativeData?.initiativeNumber || selectedInitiativeData?.title || 'Initiative'}
                    </h2>
                    <p className="text-2xs text-muted-foreground font-medium">Dynamic Role-Based Workflow System</p>
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
import { useState } from "react";
import { User } from "@/lib/mockData";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useTimelineTasks, useUpdateTaskProgress, useCreateTimelineTask, useUpdateTimelineTask } from "@/hooks/useTimelineTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Clock, CheckCircle, Plus, Edit, User as UserIcon, Users, MessageSquare, IndianRupee } from "lucide-react";

interface TimelineProps {
  user: User;
}

export default function Timeline({ user }: TimelineProps) {
  const [selectedInitiative, setSelectedInitiative] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    responsible: '',
    accountable: '',
    consulted: '',
    informed: '',
    comments: ''
  });
  
  const { data: initiativesData, isLoading: initiativesLoading } = useInitiatives();
  const { data: timelineTasks = [], isLoading: tasksLoading } = useTimelineTasks(selectedInitiative?.id || 0);
  const updateProgressMutation = useUpdateTaskProgress();
  const createTaskMutation = useCreateTimelineTask();
  const updateTaskMutation = useUpdateTimelineTask();
  
  // Mock data fallback for Timeline
  const mockInitiatives = [
    {
      id: 1,
      title: "Process Improvement Initiative",
      status: "IN_PROGRESS",
      site: "Mumbai",
      initiativeLead: "John Doe",
      expectedSavings: 150
    },
    {
      id: 2,
      title: "Cost Reduction Program",
      status: "PLANNING",
      site: "Delhi",
      initiativeLead: "Jane Smith",
      expectedSavings: 200
    }
  ];
  
  // Handle both API response format and mock data format
  const initiatives = (Array.isArray(initiativesData?.content) && initiativesData.content.length > 0) 
    ? initiativesData.content 
    : (Array.isArray(initiativesData) && initiativesData.length > 0) 
    ? initiativesData 
    : mockInitiatives;
  const itemsPerPage = 6;

  const handleProgressUpdate = (taskId: number, progress: number) => {
    updateProgressMutation.mutate({ id: taskId, progress });
  };

  const handleCreateTask = () => {
    if (!selectedInitiative || !newTask.title) return;
    
    createTaskMutation.mutate({
      ...newTask,
      initiativeId: selectedInitiative.id,
      status: 'Not Started',
      progressPercentage: 0
    }, {
      onSuccess: () => {
        setNewTaskOpen(false);
        setNewTask({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          responsible: '',
          accountable: '',
          consulted: '',
          informed: '',
          comments: ''
        });
      }
    });
  };

  const handleEditTask = () => {
    if (!editingTask) return;
    
    updateTaskMutation.mutate({
      id: editingTask.id,
      taskData: editingTask
    }, {
      onSuccess: () => {
        setEditTaskOpen(false);
        setEditingTask(null);
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'not started': return 'bg-gray-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const paginatedInitiatives = initiatives.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(initiatives.length / itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RACI Matrix Initiative Timeline Tracking</h1>
          <p className="text-muted-foreground">Track initiative timelines with RACI responsibilities and detailed progress</p>
        </div>
      </div>

      {/* Initiative Cards Layout */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Select Initiative</h2>
        
        {initiativesLoading ? (
          <div>Loading initiatives...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedInitiatives.map((initiative: any) => (
                <Card 
                  key={initiative.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedInitiative?.id === initiative.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedInitiative(initiative)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {initiative.id}
                      </Badge>
                      <Badge className={
                        initiative.status === 'Completed' ? 'bg-green-500' :
                        initiative.status === 'In Progress' ? 'bg-blue-500' :
                        initiative.status === 'Rejected' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }>
                        {initiative.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{initiative.initiativeNumber || initiative.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Site:</span>
                      <Badge variant="secondary">{initiative.site}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant={
                        initiative.priority === 'High' ? 'destructive' :
                        initiative.priority === 'Medium' ? 'default' : 'secondary'
                      }>
                        {initiative.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expected Savings:</span>
                      <span className="font-semibold flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {typeof initiative.expectedSavings === 'string' 
                          ? initiative.expectedSavings 
                          : `${initiative.expectedSavings}L`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Timeline Tasks Section */}
      {selectedInitiative && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Timeline Tasks - {selectedInitiative.initiativeNumber || selectedInitiative.title}</h2>
              <p className="text-muted-foreground">Manage tasks with RACI matrix responsibilities</p>
            </div>
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Timeline Task</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Name</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="Enter task name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsible">Responsible (R)</Label>
                    <Input
                      id="responsible"
                      value={newTask.responsible}
                      onChange={(e) => setNewTask({...newTask, responsible: e.target.value})}
                      placeholder="Who executes the task"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newTask.startDate}
                      onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newTask.endDate}
                      onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountable">Accountable (A)</Label>
                    <Input
                      id="accountable"
                      value={newTask.accountable}
                      onChange={(e) => setNewTask({...newTask, accountable: e.target.value})}
                      placeholder="Who is ultimately accountable"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consulted">Consulted (C)</Label>
                    <Input
                      id="consulted"
                      value={newTask.consulted}
                      onChange={(e) => setNewTask({...newTask, consulted: e.target.value})}
                      placeholder="Who provides input"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="informed">Informed (I)</Label>
                    <Input
                      id="informed"
                      value={newTask.informed}
                      onChange={(e) => setNewTask({...newTask, informed: e.target.value})}
                      placeholder="Who needs to be kept informed"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      placeholder="Task description"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="comments">Comments/Notes</Label>
                    <Textarea
                      id="comments"
                      value={newTask.comments}
                      onChange={(e) => setNewTask({...newTask, comments: e.target.value})}
                      placeholder="Additional comments or notes"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewTaskOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {tasksLoading ? (
            <div>Loading timeline tasks...</div>
          ) : timelineTasks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No timeline tasks found for this initiative. Click "Add Task" to create one.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Timeline Management Table</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Start/End Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>RACI</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timelineTasks.map((task: any) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground">{task.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A'}</div>
                            <div className="text-muted-foreground">to</div>
                            <div>{task.endDate ? new Date(task.endDate).toLocaleDateString() : 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Progress value={task.progressPercentage || 0} className="h-2 flex-1" />
                              <span className="text-xs">{task.progressPercentage || 0}%</span>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleProgressUpdate(task.id, Math.min((task.progressPercentage || 0) + 25, 100))}
                                disabled={updateProgressMutation.isPending}
                                className="h-6 px-2 text-xs"
                              >
                                +25%
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              <span className="font-medium">R:</span> {task.responsible || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              <span className="font-medium">A:</span> {task.accountable || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span className="font-medium">C:</span> {task.consulted || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span className="font-medium">I:</span> {task.informed || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground max-w-32 truncate">
                            {task.comments || 'No comments'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTask(task);
                              setEditTaskOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Timeline Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Task Name</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-responsible">Responsible (R)</Label>
                <Input
                  id="edit-responsible"
                  value={editingTask.responsible}
                  onChange={(e) => setEditingTask({...editingTask, responsible: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={editingTask.startDate}
                  onChange={(e) => setEditingTask({...editingTask, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={editingTask.endDate}
                  onChange={(e) => setEditingTask({...editingTask, endDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-accountable">Accountable (A)</Label>
                <Input
                  id="edit-accountable"
                  value={editingTask.accountable}
                  onChange={(e) => setEditingTask({...editingTask, accountable: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-consulted">Consulted (C)</Label>
                <Input
                  id="edit-consulted"
                  value={editingTask.consulted}
                  onChange={(e) => setEditingTask({...editingTask, consulted: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-informed">Informed (I)</Label>
                <Input
                  id="edit-informed"
                  value={editingTask.informed}
                  onChange={(e) => setEditingTask({...editingTask, informed: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-comments">Comments/Notes</Label>
                <Textarea
                  id="edit-comments"
                  value={editingTask.comments}
                  onChange={(e) => setEditingTask({...editingTask, comments: e.target.value})}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTask} disabled={updateTaskMutation.isPending}>
              Update Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
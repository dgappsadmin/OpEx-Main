// import { useState } from "react";
// import { User } from "@/lib/mockData";
// import { useInitiatives } from "@/hooks/useInitiatives";
// import { useInitiativesReadyForClosure } from "@/hooks/useWorkflowTransactions";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Progress } from "@/components/ui/progress";
// import { IndianRupee, FileText, Target, CheckCircle, Calendar, User as UserIcon, MessageSquare, TrendingUp, TrendingDown } from "lucide-react";

// interface ClosureProps {
//   user: User;
// }

// interface ClosureData {
//   initiativeNumber: string;
//   initiativeName: string;
//   startDate: string;
//   endDate: string;
//   initiativeLead: string;
//   capexSummary: string;
//   closureJustification: string;
//   targetSavings: number;
//   actualSavings: number;
//   targetProductivity: number;
//   actualProductivity: number;
//   targetWasteReduction: number;
//   actualWasteReduction: number;
//   targetCycleTime: number;
//   actualCycleTime: number;
//   teamComments: Array<{
//     id: string;
//     author: string;
//     comment: string;
//     timestamp: string;
//   }>;
// }

// export default function Closure({ user }: ClosureProps) {
//   const [selectedInitiative, setSelectedInitiative] = useState<any | null>(null);
//   const [closureFormOpen, setClosureFormOpen] = useState(false);
//   const [newComment, setNewComment] = useState("");
//   const [closureData, setClosureData] = useState<ClosureData>({
//     initiativeNumber: '',
//     initiativeName: '',
//     startDate: '',
//     endDate: '',
//     initiativeLead: '',
//     capexSummary: '',
//     closureJustification: '',
//     targetSavings: 0,
//     actualSavings: 0,
//     targetProductivity: 0,
//     actualProductivity: 0,
//     targetWasteReduction: 0,
//     actualWasteReduction: 0,
//     targetCycleTime: 0,
//     actualCycleTime: 0,
//     teamComments: []
//   });

//   // Check if user has STLD role permission
//   if (user.role !== "STLD") {
//     return (
//       <div className="p-6 space-y-6">
//         <Card>
//           <CardContent className="p-8 text-center">
//             <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
//             <p className="text-muted-foreground">
//               Only users with Site TSD Lead (STLD) role can access the Initiative Closure Module.
//             </p>
//             <p className="text-sm text-muted-foreground mt-2">
//               Your current role: {user.role}
//             </p>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   const { data: initiativesReadyForClosure = [], isLoading } = useInitiativesReadyForClosure();
  
//   // Get completed initiatives that have finished stage 10
//   const completedInitiatives = initiativesReadyForClosure;

//   const handleSelectInitiative = (initiative: any) => {
//     setSelectedInitiative(initiative);
//     setClosureData({
//       ...closureData,
//       initiativeNumber: initiative.initiativeNumber || initiative.id.toString(),
//       initiativeName: initiative.initiativeNumber || initiative.title,
//       initiativeLead: user.fullName,
//       startDate: initiative.startDate || '',
//       endDate: initiative.endDate || '',
//       targetSavings: typeof initiative.expectedSavings === 'string' 
//         ? parseFloat(initiative.expectedSavings.replace(/[₹L,]/g, '')) || 0
//         : initiative.expectedSavings || 0
//     });
//   };

//   const handleAddComment = () => {
//     if (!newComment.trim()) return;
    
//     const comment = {
//       id: Date.now().toString(),
//       author: user.fullName,
//       comment: newComment,
//       timestamp: new Date().toISOString()
//     };
    
//     setClosureData({
//       ...closureData,
//       teamComments: [...closureData.teamComments, comment]
//     });
//     setNewComment("");
//   };

//   const calculatePercentageDiff = (target: number, actual: number) => {
//     if (target === 0) return 0;
//     return ((actual - target) / target) * 100;
//   };

//   const getVarianceColor = (diff: number) => {
//     if (diff > 0) return "text-green-600";
//     if (diff < 0) return "text-red-600";
//     return "text-gray-600";
//   };

//   const getVarianceIcon = (diff: number) => {
//     if (diff > 0) return <TrendingUp className="h-4 w-4" />;
//     if (diff < 0) return <TrendingDown className="h-4 w-4" />;
//     return null;
//   };

//   const handleSubmitClosure = () => {
//     // Here you would typically submit to your API
//     console.log("Submitting closure data:", closureData);
//     setClosureFormOpen(false);
//     // You could add a toast notification here
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold">Initiative Closure Module</h1>
//         <p className="text-muted-foreground">Structured multi-stage closure workflow for completed initiatives</p>
//       </div>

//       <Tabs defaultValue="selection" className="w-full">
//         <TabsList>
//           <TabsTrigger value="selection">Initiative Selection</TabsTrigger>
//           <TabsTrigger value="closure" disabled={!selectedInitiative}>Closure Process</TabsTrigger>
//           <TabsTrigger value="comparison" disabled={!selectedInitiative}>Target vs Actual</TabsTrigger>
//         </TabsList>

//         <TabsContent value="selection" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle>Select Initiative for Closure</CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 Only initiatives that have completed Stage 10 (Saving Validation with F&A) are available for closure
//               </p>
//             </CardHeader>
//             <CardContent>
//               {isLoading ? (
//                 <div>Loading initiatives...</div>
//               ) : completedInitiatives.length === 0 ? (
//                 <div className="text-center py-8 text-muted-foreground">
//                   No initiatives ready for closure. Initiatives must complete Stage 10 (Saving Validation with F&A) before they can be closed.
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {completedInitiatives.map((initiative: any) => (
//                     <Card 
//                       key={initiative.id}
//                       className={`cursor-pointer transition-all hover:shadow-lg ${
//                         selectedInitiative?.id === initiative.id ? 'ring-2 ring-primary' : ''
//                       }`}
//                       onClick={() => handleSelectInitiative(initiative)}
//                     >
//                       <CardHeader className="pb-3">
//                         <div className="flex items-center justify-between">
//                           <Badge variant="outline" className="text-xs">
//                             {initiative.id}
//                           </Badge>
//                           <Badge className="bg-green-500">
//                             {initiative.status}
//                           </Badge>
//                          </div>
//                          <CardTitle className="text-lg line-clamp-2">{initiative.initiativeNumber || initiative.title}</CardTitle>
//                        </CardHeader>
//                       <CardContent className="space-y-2">
//                         <div className="flex items-center justify-between text-sm">
//                           <span className="text-muted-foreground">Site:</span>
//                           <Badge variant="secondary">{initiative.site}</Badge>
//                         </div>
//                         <div className="flex items-center justify-between text-sm">
//                           <span className="text-muted-foreground">Expected Savings:</span>
//                           <span className="font-semibold flex items-center gap-1">
//                             <IndianRupee className="h-3 w-3" />
//                             {typeof initiative.expectedSavings === 'string' 
//                               ? initiative.expectedSavings 
//                               : `${initiative.expectedSavings}L`}
//                           </span>
//                         </div>
//                         <div className="flex items-center justify-between text-sm">
//                           <span className="text-muted-foreground">Discipline:</span>
//                           <span className="font-medium">{initiative.discipline}</span>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="closure" className="space-y-4">
//           {selectedInitiative && (
//             <Card>
//               <CardHeader>
//                 <div className="flex items-center justify-between">
//                   <div>
//                      <CardTitle>Initiative Closure Form</CardTitle>
//                      <p className="text-sm text-muted-foreground">
//                        Complete the structured closure process for {selectedInitiative.initiativeNumber || selectedInitiative.title}
//                      </p>
//                   </div>
//                   <Dialog open={closureFormOpen} onOpenChange={setClosureFormOpen}>
//                     <DialogTrigger asChild>
//                       <Button>Complete Closure Form</Button>
//                     </DialogTrigger>
//                     <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
//                       <DialogHeader>
//                         <DialogTitle>Initiative Closure Form</DialogTitle>
//                       </DialogHeader>
//                       <div className="grid grid-cols-2 gap-4">
//                         <div className="space-y-2">
//                           <Label>Initiative Number</Label>
//                           <Input
//                             value={closureData.initiativeNumber}
//                             onChange={(e) => setClosureData({...closureData, initiativeNumber: e.target.value})}
//                             disabled
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label>Initiative Name</Label>
//                           <Input
//                             value={closureData.initiativeName}
//                             onChange={(e) => setClosureData({...closureData, initiativeName: e.target.value})}
//                             disabled
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label>Start Date</Label>
//                           <Input
//                             type="date"
//                             value={closureData.startDate}
//                             onChange={(e) => setClosureData({...closureData, startDate: e.target.value})}
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label>End Date</Label>
//                           <Input
//                             type="date"
//                             value={closureData.endDate}
//                             onChange={(e) => setClosureData({...closureData, endDate: e.target.value})}
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label>Initiative Lead</Label>
//                           <Input
//                             value={closureData.initiativeLead}
//                             onChange={(e) => setClosureData({...closureData, initiativeLead: e.target.value})}
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label>CAPEX Summary (₹ Lakhs)</Label>
//                           <Input
//                             value={closureData.capexSummary}
//                             onChange={(e) => setClosureData({...closureData, capexSummary: e.target.value})}
//                             placeholder="Total CAPEX invested"
//                           />
//                         </div>
//                         <div className="space-y-2 col-span-2">
//                           <Label>Closure Justification</Label>
//                           <Textarea
//                             value={closureData.closureJustification}
//                             onChange={(e) => setClosureData({...closureData, closureJustification: e.target.value})}
//                             placeholder="Provide justification for initiative closure..."
//                             rows={3}
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <h3 className="font-semibold mb-3">Performance Metrics</h3>
//                           <div className="grid grid-cols-4 gap-4">
//                             <div className="space-y-2">
//                               <Label>Target Savings (₹L)</Label>
//                               <Input
//                                 type="number"
//                                 value={closureData.targetSavings}
//                                 onChange={(e) => setClosureData({...closureData, targetSavings: parseFloat(e.target.value) || 0})}
//                               />
//                             </div>
//                             <div className="space-y-2">
//                               <Label>Actual Savings (₹L)</Label>
//                               <Input
//                                 type="number"
//                                 value={closureData.actualSavings}
//                                 onChange={(e) => setClosureData({...closureData, actualSavings: parseFloat(e.target.value) || 0})}
//                               />
//                             </div>
//                             <div className="space-y-2">
//                               <Label>Target Productivity (MT/manhour)</Label>
//                               <Input
//                                 type="number"
//                                 value={closureData.targetProductivity}
//                                 onChange={(e) => setClosureData({...closureData, targetProductivity: parseFloat(e.target.value) || 0})}
//                               />
//                             </div>
//                             <div className="space-y-2">
//                               <Label>Actual Productivity (MT/manhour)</Label>
//                               <Input
//                                 type="number"
//                                 value={closureData.actualProductivity}
//                                 onChange={(e) => setClosureData({...closureData, actualProductivity: parseFloat(e.target.value) || 0})}
//                               />
//                             </div>
//                             <div className="space-y-2">
//                               <Label>Target Waste Reduction (%)</Label>
//                               <Input
//                                 type="number"
//                                 value={closureData.targetWasteReduction}
//                                 onChange={(e) => setClosureData({...closureData, targetWasteReduction: parseFloat(e.target.value) || 0})}
//                               />
//                             </div>
//                             <div className="space-y-2">
//                               <Label>Actual Waste Reduction (%)</Label>
//                               <Input
//                                 type="number"
//                                 value={closureData.actualWasteReduction}
//                                 onChange={(e) => setClosureData({...closureData, actualWasteReduction: parseFloat(e.target.value) || 0})}
//                               />
//                             </div>
//                             <div className="space-y-2">
//                               <Label>Target Cycle Time Reduction (%)</Label>
//                               <Input
//                                 type="number"
//                                 value={closureData.targetCycleTime}
//                                 onChange={(e) => setClosureData({...closureData, targetCycleTime: parseFloat(e.target.value) || 0})}
//                               />
//                             </div>
//                             <div className="space-y-2">
//                               <Label>Actual Cycle Time Reduction (%)</Label>
//                               <Input
//                                 type="number"
//                                 value={closureData.actualCycleTime}
//                                 onChange={(e) => setClosureData({...closureData, actualCycleTime: parseFloat(e.target.value) || 0})}
//                               />
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="flex justify-end gap-2">
//                         <Button variant="outline" onClick={() => setClosureFormOpen(false)}>
//                           Cancel
//                         </Button>
//                         <Button onClick={handleSubmitClosure}>
//                           Submit Closure
//                         </Button>
//                       </div>
//                     </DialogContent>
//                   </Dialog>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                   <div className="flex items-center gap-3">
//                     <FileText className="h-8 w-8 text-primary" />
//                     <div>
//                       <p className="text-sm text-muted-foreground">Initiative ID</p>
//                       <p className="font-semibold">{selectedInitiative.id}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <UserIcon className="h-8 w-8 text-primary" />
//                     <div>
//                       <p className="text-sm text-muted-foreground">Lead</p>
//                       <p className="font-semibold">{user.fullName}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <Calendar className="h-8 w-8 text-primary" />
//                     <div>
//                       <p className="text-sm text-muted-foreground">Duration</p>
//                       <p className="font-semibold">6 months</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <Target className="h-8 w-8 text-primary" />
//                     <div>
//                       <p className="text-sm text-muted-foreground">Status</p>
//                       <Badge className="bg-green-500">{selectedInitiative.status}</Badge>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Team Comments Section */}
//           {selectedInitiative && (
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <MessageSquare className="h-5 w-5" />
//                   Team Comments
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="space-y-3">
//                   {closureData.teamComments.map((comment) => (
//                     <div key={comment.id} className="border rounded-lg p-3">
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="font-semibold text-sm">{comment.author}</span>
//                         <span className="text-xs text-muted-foreground">
//                           {new Date(comment.timestamp).toLocaleDateString()}
//                         </span>
//                       </div>
//                       <p className="text-sm">{comment.comment}</p>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="flex gap-2">
//                   <Textarea
//                     placeholder="Add a comment..."
//                     value={newComment}
//                     onChange={(e) => setNewComment(e.target.value)}
//                     className="flex-1"
//                   />
//                   <Button onClick={handleAddComment}>Add Comment</Button>
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//         </TabsContent>

//         <TabsContent value="comparison" className="space-y-4">
//           {selectedInitiative && (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Target vs Actual Comparison</CardTitle>
//                 <p className="text-sm text-muted-foreground">
//                   Performance comparison with variance analysis
//                 </p>
//               </CardHeader>
//               <CardContent>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Metric</TableHead>
//                       <TableHead>Target</TableHead>
//                       <TableHead>Actual</TableHead>
//                       <TableHead>Variance</TableHead>
//                       <TableHead>% Difference</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     <TableRow>
//                       <TableCell className="font-medium">Annual Savings (₹L)</TableCell>
//                       <TableCell>{closureData.targetSavings}</TableCell>
//                       <TableCell>{closureData.actualSavings}</TableCell>
//                       <TableCell className={getVarianceColor(closureData.actualSavings - closureData.targetSavings)}>
//                         <div className="flex items-center gap-1">
//                           {getVarianceIcon(closureData.actualSavings - closureData.targetSavings)}
//                           {(closureData.actualSavings - closureData.targetSavings).toFixed(1)}
//                         </div>
//                       </TableCell>
//                       <TableCell className={getVarianceColor(calculatePercentageDiff(closureData.targetSavings, closureData.actualSavings))}>
//                         {calculatePercentageDiff(closureData.targetSavings, closureData.actualSavings).toFixed(1)}%
//                       </TableCell>
//                     </TableRow>
//                     <TableRow>
//                       <TableCell className="font-medium">Productivity (MT/manhour)</TableCell>
//                       <TableCell>{closureData.targetProductivity}</TableCell>
//                       <TableCell>{closureData.actualProductivity}</TableCell>
//                       <TableCell className={getVarianceColor(closureData.actualProductivity - closureData.targetProductivity)}>
//                         <div className="flex items-center gap-1">
//                           {getVarianceIcon(closureData.actualProductivity - closureData.targetProductivity)}
//                           {(closureData.actualProductivity - closureData.targetProductivity).toFixed(2)}
//                         </div>
//                       </TableCell>
//                       <TableCell className={getVarianceColor(calculatePercentageDiff(closureData.targetProductivity, closureData.actualProductivity))}>
//                         {calculatePercentageDiff(closureData.targetProductivity, closureData.actualProductivity).toFixed(1)}%
//                       </TableCell>
//                     </TableRow>
//                     <TableRow>
//                       <TableCell className="font-medium">Waste Reduction (%)</TableCell>
//                       <TableCell>{closureData.targetWasteReduction}%</TableCell>
//                       <TableCell>{closureData.actualWasteReduction}%</TableCell>
//                       <TableCell className={getVarianceColor(closureData.actualWasteReduction - closureData.targetWasteReduction)}>
//                         <div className="flex items-center gap-1">
//                           {getVarianceIcon(closureData.actualWasteReduction - closureData.targetWasteReduction)}
//                           {(closureData.actualWasteReduction - closureData.targetWasteReduction).toFixed(1)}%
//                         </div>
//                       </TableCell>
//                       <TableCell className={getVarianceColor(calculatePercentageDiff(closureData.targetWasteReduction, closureData.actualWasteReduction))}>
//                         {calculatePercentageDiff(closureData.targetWasteReduction, closureData.actualWasteReduction).toFixed(1)}%
//                       </TableCell>
//                     </TableRow>
//                     <TableRow>
//                       <TableCell className="font-medium">Cycle Time Reduction (%)</TableCell>
//                       <TableCell>{closureData.targetCycleTime}%</TableCell>
//                       <TableCell>{closureData.actualCycleTime}%</TableCell>
//                       <TableCell className={getVarianceColor(closureData.actualCycleTime - closureData.targetCycleTime)}>
//                         <div className="flex items-center gap-1">
//                           {getVarianceIcon(closureData.actualCycleTime - closureData.targetCycleTime)}
//                           {(closureData.actualCycleTime - closureData.targetCycleTime).toFixed(1)}%
//                         </div>
//                       </TableCell>
//                       <TableCell className={getVarianceColor(calculatePercentageDiff(closureData.targetCycleTime, closureData.actualCycleTime))}>
//                         {calculatePercentageDiff(closureData.targetCycleTime, closureData.actualCycleTime).toFixed(1)}%
//                       </TableCell>
//                     </TableRow>
//                   </TableBody>
//                 </Table>
//               </CardContent>
//             </Card>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }
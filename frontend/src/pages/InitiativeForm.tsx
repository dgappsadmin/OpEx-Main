import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CalendarIcon, Upload, FileText, Send, IndianRupee, Percent, Banknote, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { sites, disciplines, User } from "@/lib/mockData";
import { useCreateInitiative } from "@/hooks/useInitiatives";
import GlassmorphLoader from "@/components/ui/GlassmorphLoader";

interface InitiativeFormProps {
  user: User;
}

const formSchema = z.object({
  title: z.string().min(1, "Initiative title is required").min(10, "Title must be at least 10 characters"),
  initiatorName: z.string().min(1, "Initiator name is required"),
  site: z.string().min(1, "Site selection is required"),
  discipline: z.string().min(1, "Discipline selection is required"),
  date: z.date({ required_error: "Date is required" }),
  description: z.string().min(1, "Description is required").min(50, "Description must be at least 50 characters"),
  baselineData: z.string().min(1, "Baseline data is required"),
  targetOutcome: z.string().min(1, "Target outcome is required"),
  targetValue: z.number().min(0, "Target value must be zero or positive").finite("Target value must be a valid number"),
  budgetType: z.enum(["budgeted", "non-budgeted"], {
    required_error: "Budget type is required",
  }),
  expectedValue: z.number().min(0, "Expected value must be zero or positive").finite("Expected value must be a valid number"),
  assumption1: z.string().min(1, "First assumption is required"),
  assumption2: z.string().min(1, "Second assumption is required"),
  assumption3: z.string().min(1, "Third assumption is required"),
  estimatedCapex: z.number().min(0, "CAPEX must be zero or positive").finite("CAPEX must be a valid number"),
});

type FormData = z.infer<typeof formSchema>;

export default function InitiativeForm({ user }: InitiativeFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  if (user.role !== "STLD") {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <Card className="shadow-sm">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-destructive mb-3">Access Denied</h1>
            <p className="text-xs text-muted-foreground mb-2">
              Only users with SITE TSD LEAD role can create new initiatives.
            </p>
            <p className="text-xs text-muted-foreground">Your current role: {user.role}</p>
            {user.role === "VIEWER" && (
              <p className="text-xs text-blue-600 mt-3">
                As a Viewer, you have read-only access to view initiatives and data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const createInitiativeMutation = useCreateInitiative();
  const isSubmitting = createInitiativeMutation.isPending;
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      initiatorName: user.fullName || "",
      site: user.site || "",
      discipline: "",
      date: new Date(),
      baselineData: "",
      targetOutcome: "",
      budgetType: "budgeted",
      targetValue: 0,
      expectedValue: 0,
      estimatedCapex: 0,
      assumption1: "",
      assumption2: "",
      assumption3: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form data:", data);
    console.log("Expected Value (data.expectedValue):", data.expectedValue);
    console.log("Target Value (data.targetValue):", data.targetValue);
    console.log("Estimated CAPEX (data.estimatedCapex):", data.estimatedCapex);

    const initiativeData = {
      title: data.title,
      description: data.description,
      initiatorName: data.initiatorName,
      priority: "Medium",
      expectedSavings: data.expectedValue,
      site: data.site,
      discipline: data.discipline,
      startDate: data.date.toISOString().split("T")[0],
      endDate: new Date(data.date.getTime() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      requiresMoc: data.estimatedCapex > 10,
      requiresCapex: data.estimatedCapex > 0,
      budgetType: data.budgetType,
      baselineData: data.baselineData,
      targetOutcome: data.targetOutcome,
      targetValue: data.targetValue,
      estimatedCapex: data.estimatedCapex,
      assumption1: data.assumption1,
      assumption2: data.assumption2,
      assumption3: data.assumption3,
    };

    console.log("Initiative data being sent:", initiativeData);
    createInitiativeMutation.mutate(initiativeData, {
      onSuccess: () => {
        toast({
          title: "Initiative Submitted Successfully!",
          description: "Initiative has been created and sent for approval.",
        });
        form.reset();
        setFiles([]);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to create initiative",
          variant: "destructive",
        });
      },
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Loading Overlay */}
      <GlassmorphLoader
        show={isSubmitting}
        message="Submitting Initiative..."
        submessage="Please wait while we process your initiative..."
      />
      
      <div className="container mx-auto p-4 space-y-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              New Initiative
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Submit a new operational excellence initiative
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-medium">
            <FileText className="h-3 w-3 mr-1.5" />
            Draft Form
          </Badge>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Basic Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Provide the fundamental details of your initiative
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Initiative Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a descriptive title for your initiative"
                            {...field}
                            className="h-9 text-xs"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initiatorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Initiator Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your full name"
                              {...field}
                              disabled
                              className="h-9 text-xs bg-muted text-muted-foreground"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="site"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Site *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your site"
                              {...field}
                              disabled
                              className="h-9 text-xs bg-muted text-muted-foreground"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="discipline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Discipline *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Select discipline" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {disciplines.map((discipline) => (
                                <SelectItem key={discipline.code} value={discipline.code} className="text-xs hover:bg-blue-50 focus:bg-blue-50">
                                  <div className="flex flex-col py-1">
                                    <span className="font-medium">
                                      {discipline.name} ({discipline.code})
                                    </span>
                                    <span className="text-2xs text-muted-foreground">
                                      {discipline.details}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Initiative Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-9 pl-3 text-left font-normal text-xs",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isSubmitting}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                                initialFocus
                                className="p-3"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a detailed description of the initiative, including background, objectives, and expected outcomes..."
                            className="min-h-[100px] text-xs resize-y"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Target & Financial Information */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  Target & Financial Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Define measurable outcomes and financial expectations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <FormField
                  control={form.control}
                  name="baselineData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        Baseline Data (12-month historical) *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide 12-month historical data that supports this initiative, including current performance metrics, costs, and relevant operational data..."
                          className="min-h-[80px] text-xs resize-y"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetOutcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Target Outcome *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Reduce energy consumption by 15%"
                            {...field}
                            className="h-9 text-xs"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Target Value (Numeric) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              if (value === "" || value === ".") {
                                field.onChange(0);
                              } else {
                                const numValue = parseFloat(value);
                                field.onChange(isNaN(numValue) ? 0 : numValue);
                              }
                            }}
                            className="h-9 text-xs"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expectedValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Expected Value (₹ Lakhs) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              if (value === "" || value === ".") {
                                field.onChange(0);
                              } else {
                                const numValue = parseFloat(value);
                                field.onChange(isNaN(numValue) ? 0 : numValue);
                              }
                            }}
                            className="h-9 text-xs"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimatedCapex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Estimated CAPEX (₹ Lakhs) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              if (value === "" || value === ".") {
                                field.onChange(0);
                              } else {
                                const numValue = parseFloat(value);
                                field.onChange(isNaN(numValue) ? 0 : numValue);
                              }
                            }}
                            className="h-9 text-xs"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="budgetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Budget Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select budget type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="budgeted" className="text-xs focus:bg-accent py-2.5">
                            <div className="flex items-center gap-2.5">
                              <Banknote className="h-4 w-4 text-green-500" />
                              <div className="flex flex-col">
                                <span className="font-medium">Budgeted</span>
                                <span className="text-2xs text-muted-foreground">
                                  Funds allocated in current budget
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="non-budgeted" className="text-xs focus:bg-accent py-2.5">
                            <div className="flex items-center gap-2.5">
                              <IndianRupee className="h-4 w-4 text-red-500" />
                              <div className="flex flex-col">
                                <span className="font-medium">Non-Budgeted</span>
                                <span className="text-2xs text-muted-foreground">
                                  Additional funding required
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Key Assumptions */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-4 w-4 text-purple-600" />
                  Key Assumptions
                </CardTitle>
                <CardDescription className="text-xs">
                  List the three most critical assumptions for this initiative
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="assumption1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Assumption 1 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Current production volume remains stable throughout implementation"
                            {...field}
                            className="h-9 text-xs"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assumption2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Assumption 2 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Energy prices increase by 10% annually"
                            {...field}
                            className="h-9 text-xs"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assumption3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Assumption 3 *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Technology implementation completed within 6 months"
                            {...field}
                            className="h-9 text-xs"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end pt-3">
              <Button 
                type="submit" 
                className="h-10 px-6 text-xs font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4 mr-1.5" />
                Submit for Approval
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
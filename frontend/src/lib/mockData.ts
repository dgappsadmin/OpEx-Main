// Mock data for testing complete OpEx Hub functionality
export interface User {
  id: string;
  email: string;
  fullName: string;
  site: string;
  discipline: string;
  role: string;
  roleName: string;
}

export interface Initiative {
  id: string;
  title: string;
  site: string;
  discipline: string;
  initiativeNumber: string;
  initiator: string;
  submittedDate: string;
  currentStage: number;
  status: string;
  expectedSavings: string;
  actualSavings?: string;
  priority: "High" | "Medium" | "Low";
  description: string;
  targetOutcome: string;
  baselineData: string;
  isBudgeted: boolean;
  estimatedCapex: string;
  progress: number;
  daysInStage: number;
  lastUpdated: string;
  mocRequired?: boolean;
  capexRequired?: boolean;
  timeline: TimelineTask[];
  kpis: {
    [key: string]: string;
  };
  comments: Comment[];
}

export interface TimelineTask {
  taskId: number;
  taskName: string;
  startDate: Date;
  endDate: Date;
  status: "Not Started" | "In Progress" | "On Hold" | "Completed" | "Overdue";
  progress: number;
  responsible: string;
  accountable: string;
  consulted: string;
  informed: string;
  comments: string;
}

export interface Comment {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  type: "comment" | "approval" | "rejection" | "update";
}

export const mockUsers: User[] = [
  {
    id: "1",
    email: "rajesh.lead@godeepak.com",
    fullName: "Rajesh Kumar",
    site: "NDS",
    discipline: "OP",
    role: "INIT_LEAD",
    roleName: "Initiative Lead"
  },
  {
    id: "2",
    email: "priya.approver@godeepak.com",
    fullName: "Priya Sharma",
    site: "NDS",
    discipline: "EG",
    role: "APPROVER",
    roleName: "Approver"
  },
  {
    id: "3",
    email: "amit.tso@godeepak.com",
    fullName: "Amit Patel",
    site: "NDS",
    discipline: "QA",
    role: "SITE_TSO_LEAD",
    roleName: "Site TSO Lead"
  },
  {
    id: "4",
    email: "deepika.corp@godeepak.com",
    fullName: "Deepika Singh",
    site: "NDS",
    discipline: "SF",
    role: "CORP_TSO",
    roleName: "Corp TSO"
  },
  {
    id: "5",
    email: "david.env@company.com",
    fullName: "David Chen",
    site: "TCD",
    discipline: "EV",
    role: "INIT_LEAD",
    roleName: "Initiative Lead"
  }
];

export const mockInitiatives: Initiative[] = [
  {
    id: "NDS/25/OP/AB/001",
    title: "Energy Optimization in Reactor Unit",
    site: "NDS",
    discipline: "Operation",
    initiativeNumber: "NDS/25/OP/01/001",
    initiator: "John Doe",
    submittedDate: "2025-01-15",
    currentStage: 3,
    status: "In Progress",
    expectedSavings: "₹8.5L",
    priority: "High",
    description: "Implementation of advanced energy monitoring and optimization systems in the main reactor unit to reduce energy consumption by 15%.",
    targetOutcome: "Reduce energy consumption by 15%",
    baselineData: "Current monthly energy consumption: 2500 MWh. Historical data shows consistent 10-12% variation seasonally.",
    isBudgeted: true,
    estimatedCapex: "₹5.2L",
    progress: 65,
    daysInStage: 5,
    lastUpdated: "2025-01-20",
    mocRequired: true,
    capexRequired: true,
    timeline: [
      {
        taskId: 1,
        taskName: "Initial Assessment & Data Collection",
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-01-30"),
        status: "Completed",
        progress: 100,
        responsible: "John Doe",
        accountable: "Site TSO Lead",
        consulted: "Process Engineers",
        informed: "Plant Manager",
        comments: "Baseline data collected successfully"
      },
      {
        taskId: 2,
        taskName: "Technical Solution Development",
        startDate: new Date("2025-01-31"),
        endDate: new Date("2025-02-15"),
        status: "In Progress",
        progress: 70,
        responsible: "Engineering Team",
        accountable: "Initiative Lead",
        consulted: "Technology Vendor",
        informed: "CMO",
        comments: "Design review scheduled for next week"
      }
    ],
    kpis: {
      energySaved: "120 MWh",
      productivity: "+15%",
      waste: "-8%"
    },
    comments: [
      {
        id: "c1",
        author: "Jane Smith",
        role: "Approver",
        content: "Excellent initiative. Approved for next stage with minor budget adjustments.",
        timestamp: "2025-01-18 14:30",
        type: "approval"
      }
    ]
  },
  {
    id: "HSD1/25/EG/CD/002",
    title: "Downtime Reduction Initiative",
    site: "HSD1",
    discipline: "Engineering & Utility",
    initiativeNumber: "HSD1/25/EG/01/002",
    initiator: "Priya Sharma",
    submittedDate: "2025-01-10",
    currentStage: 7,
    status: "Pending Decision",
    expectedSavings: "₹12.3L",
    priority: "Medium",
    description: "Predictive maintenance implementation to reduce unplanned downtime by 40% across critical equipment.",
    targetOutcome: "Reduce unplanned downtime by 40%",
    baselineData: "Current average monthly downtime: 48 hours. Major contributors: pump failures (30%), electrical issues (25%).",
    isBudgeted: false,
    estimatedCapex: "₹8.7L",
    progress: 80,
    daysInStage: 2,
    lastUpdated: "2025-01-19",
    mocRequired: false,
    capexRequired: true,
    timeline: [
      {
        taskId: 1,
        taskName: "Equipment Assessment",
        startDate: new Date("2025-01-10"),
        endDate: new Date("2025-01-25"),
        status: "Completed",
        progress: 100,
        responsible: "Maintenance Team",
        accountable: "Engineering Lead",
        consulted: "Operations",
        informed: "Plant Manager",
        comments: "All critical equipment assessed"
      }
    ],
    kpis: {
      cycleTime: "-22%",
      productivity: "+18%",
      maintenance: "-30%"
    },
    comments: []
  },
  {
    id: "APL/25/QA/EF/003",
    title: "Quality Control Enhancement",
    site: "APL",
    discipline: "Quality",
    initiativeNumber: "APL/25/QA/01/003",
    initiator: "Amit Patel",
    submittedDate: "2024-12-20",
    currentStage: 11,
    status: "Implementation",
    expectedSavings: "₹6.7L",
    actualSavings: "₹4.2L",
    priority: "High",
    description: "Implementation of automated quality control systems to reduce defect rates by 50%.",
    targetOutcome: "Reduce defect rates by 50%",
    baselineData: "Current defect rate: 2.5%. Monthly rework costs: ₹1.2L. Customer complaints: 15/month.",
    isBudgeted: true,
    estimatedCapex: "₹3.5L",
    progress: 45,
    daysInStage: 12,
    lastUpdated: "2025-01-20",
    mocRequired: true,
    capexRequired: false,
    timeline: [],
    kpis: {
      defectRate: "-12%",
      rework: "-25%",
      customer: "+8%"
    },
    comments: []
  },
  // Additional mock initiatives for pagination testing
  {
    id: "DHJ/25/SF/GH/004",
    title: "Safety Management System Upgrade",
    site: "DHJ",
    discipline: "Safety",
    initiativeNumber: "DHJ/25/SF/01/004",
    initiator: "Sarah Johnson",
    submittedDate: "2025-01-05",
    currentStage: 5,
    status: "MOC Review",
    expectedSavings: "₹4.8L",
    priority: "High",
    description: "Upgrade of safety management systems to reduce incidents by 60%.",
    targetOutcome: "Reduce safety incidents by 60%",
    baselineData: "Current incident rate: 0.8 per month. Near miss reports: 25/month.",
    isBudgeted: true,
    estimatedCapex: "₹6.1L",
    progress: 55,
    daysInStage: 8,
    lastUpdated: "2025-01-18",
    mocRequired: true,
    capexRequired: true,
    timeline: [],
    kpis: {
      incidents: "-60%",
      nearMiss: "+40%",
      training: "+25%"
    },
    comments: []
  },
  {
    id: "TCD/25/EV/IJ/005",
    title: "Waste Water Treatment Optimization",
    site: "TCD",
    discipline: "Environment",
    initiativeNumber: "TCD/25/EV/01/005",
    initiator: "David Chen",
    submittedDate: "2025-01-12",
    currentStage: 2,
    status: "Under Review",
    expectedSavings: "₹9.2L",
    priority: "Medium",
    description: "Optimization of wastewater treatment processes to reduce environmental impact.",
    targetOutcome: "Reduce waste water by 30%",
    baselineData: "Current waste water generation: 500 KL/day. Treatment costs: ₹2L/month.",
    isBudgeted: false,
    estimatedCapex: "₹12.5L",
    progress: 25,
    daysInStage: 3,
    lastUpdated: "2025-01-19",
    mocRequired: true,
    capexRequired: true,
    timeline: [],
    kpis: {
      wasteReduction: "-30%",
      treatmentCost: "-25%",
      compliance: "+15%"
    },
    comments: []
  },
  {
    id: "HSD2/25/OP/KL/006",
    title: "Production Line Efficiency Enhancement",
    site: "HSD2",
    discipline: "Operation",
    initiativeNumber: "HSD2/25/OP/02/006",
    initiator: "Lisa Wang",
    submittedDate: "2025-01-08",
    currentStage: 12,
    status: "CMO Review",
    expectedSavings: "₹15.6L",
    actualSavings: "₹12.1L",
    priority: "High",
    description: "Lean manufacturing implementation to improve production line efficiency by 25%.",
    targetOutcome: "Improve efficiency by 25%",
    baselineData: "Current OEE: 75%. Production rate: 85 units/hour. Changeover time: 45 minutes.",
    isBudgeted: true,
    estimatedCapex: "₹4.2L",
    progress: 85,
    daysInStage: 6,
    lastUpdated: "2025-01-20",
    mocRequired: false,
    capexRequired: false,
    timeline: [],
    kpis: {
      oee: "+20%",
      changeover: "-35%",
      throughput: "+25%"
    },
    comments: []
  },
  {
    id: "HSD3/25/EG/MN/007",
    title: "Predictive Maintenance Implementation",
    site: "HSD3",
    discipline: "Engineering & Utility",
    initiativeNumber: "HSD3/25/EG/01/007",
    initiator: "Robert Brown",
    submittedDate: "2025-01-14",
    currentStage: 1,
    status: "Registered",
    expectedSavings: "₹11.4L",
    priority: "Medium",
    description: "Implementation of IoT-based predictive maintenance for critical rotating equipment.",
    targetOutcome: "Reduce maintenance costs by 35%",
    baselineData: "Current maintenance spend: ₹32L/year. Unplanned failures: 12/year.",
    isBudgeted: false,
    estimatedCapex: "₹18.3L",
    progress: 15,
    daysInStage: 1,
    lastUpdated: "2025-01-20",
    mocRequired: false,
    capexRequired: true,
    timeline: [],
    kpis: {
      maintenanceCost: "-35%",
      uptime: "+15%",
      failures: "-50%"
    },
    comments: []
  },
  {
    id: "NDS/25/QA/OP/008",
    title: "Statistical Process Control Implementation",
    site: "NDS",
    discipline: "Quality",
    initiativeNumber: "NDS/25/QA/02/008",
    initiator: "Maria Garcia",
    submittedDate: "2025-01-16",
    currentStage: 4,
    status: "Decision Pending",
    expectedSavings: "₹7.8L",
    priority: "Low",
    description: "Implementation of SPC to improve product quality and reduce variations.",
    targetOutcome: "Reduce process variation by 40%",
    baselineData: "Current Cpk: 1.2. Rejection rate: 1.8%. Rework costs: ₹0.8L/month.",
    isBudgeted: true,
    estimatedCapex: "₹2.1L",
    progress: 40,
    daysInStage: 4,
    lastUpdated: "2025-01-19",
    mocRequired: false,
    capexRequired: false,
    timeline: [],
    kpis: {
      cpk: "+25%",
      rejection: "-45%",
      variation: "-40%"
    },
    comments: []
  }
];

export const workflowStages = [
  { stage: 1, name: "Register Initiative", role: "STLD", roleName: "Site Lead" },
  { stage: 2, name: "Approval", role: "SH", roleName: "Site Head" },
  { stage: 3, name: "Define Responsibilities", role: "EH", roleName: "EHS Head" },
  { stage: 4, name: "MOC Stage", role: "IL", roleName: "Initiative Lead" },
  { stage: 5, name: "CAPEX Stage", role: "IL", roleName: "Initiative Lead" },
  { stage: 6, name: "Initiative Timeline Tracker", role: "IL", roleName: "Initiative Lead" },
  { stage: 7, name: "Trial Implementation & Performance Check", role: "STLD", roleName: "Site Lead" },
  { stage: 8, name: "Periodic Status Review with CMO", role: "CTSD", roleName: "Corp TSD" },
  { stage: 9, name: "Savings Monitoring (1 Month)", role: "STLD", roleName: "Site Lead" },
  { stage: 10, name: "Saving Validation with F&A", role: "STLD", roleName: "Site Lead" },
  { stage: 11, name: "Initiative Closure", role: "STLD", roleName: "Site Lead" }
];


export const sites = [
  { code: "NDS", name: "NDS" },
  { code: "HSD1", name: "HSD1" },
  { code: "HSD2", name: "HSD2" },
  { code: "HSD3", name: "HSD3" },
  { code: "DHJ", name: "DHJ" },
  { code: "APL", name: "APL" },
  { code: "TCD", name: "TCD" }
];

export const disciplines = [
  { code: "Operation", name: "Operation", details: "Plant Productivity Enhancement, Capacity debottlenecking, etc." },
  { code: "Engineering & Utility", name: "Engineering & Utility", details: "Downtime reduction, R&M, etc." },
  { code: "Environment", name: "Environment", details: "Reduction in waste generation, effluent handling, etc." },
  { code: "Safety", name: "Safety", details: "Process Safety Management" },
  { code: "Quality", name: "Quality", details: "Reduction in Finished Goods rejections, in-process quality checks" },
  { code: "Others", name: "Others", details: "Logistic improvements, packaging improvements, inventory reduction" }
];


// Utility function for pagination
export function paginateArray<T>(array: T[], page: number, itemsPerPage: number) {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return {
    data: array.slice(startIndex, endIndex),
    totalPages: Math.ceil(array.length / itemsPerPage),
    totalItems: array.length,
    currentPage: page,
    hasNextPage: endIndex < array.length,
    hasPreviousPage: page > 1
  };
}
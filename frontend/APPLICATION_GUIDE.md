# 📋 OpEx Hub - Application Guide

## 🎯 What is OpEx Hub?

**OpEx Hub** is a comprehensive **Operational Excellence Initiative Management System** designed to streamline and track improvement initiatives across multiple sites. It provides a structured 11-stage approval workflow to ensure initiatives are properly evaluated, approved, implemented, and monitored for savings validation.

## 🏢 Multi-Site Operations

The system supports **7 different sites**:
- **NDS**
- **HSD1**
- **HSD2**
- **HSD3**
- **DHJ**
- **APL**
- **TCD**

Each site follows the same standardized 11-stage workflow process.

## 👥 User Roles & Responsibilities

| Role Code | Role Name | Responsibilities |
|-----------|-----------|------------------|
| **STLD** | Site Lead | Initiative registration, trial implementation, savings monitoring, closure |
| **SH** | Site Head | Initiative approval |
| **EH** | Engineering Head | Define responsibilities and technical oversight |
| **IL** | Initiative Lead | MOC/CAPEX management, timeline tracking |
| **CTSD** | Corp TSD | Periodic status reviews with CMO |

## 🔄 11-Stage Workflow Process

### Stage 1: Register Initiative (STLD)
- **Purpose**: Initial initiative registration
- **Owner**: Site Lead (STLD)
- **Activities**: Create initiative with details, expected savings, timeline

### Stage 2: Approval (SH)
- **Purpose**: Management approval for the initiative
- **Owner**: Site Head (SH)
- **Activities**: Review and approve/reject the initiative

### Stage 3: Define Responsibilities (EH)
- **Purpose**: Technical review and responsibility assignment
- **Owner**: Engineering Head (EH)
- **Activities**: Define technical requirements, assign team members

### Stage 4: MOC Stage (IL)
- **Purpose**: Management of Change approval (if required)
- **Owner**: Initiative Lead (IL)
- **Activities**: MOC documentation and approval process

### Stage 5: CAPEX Stage (IL)
- **Purpose**: Capital expenditure approval (if required)
- **Owner**: Initiative Lead (IL)
- **Activities**: CAPEX documentation and budget approval

### Stage 6: Initiative Timeline Tracker (IL)
- **Purpose**: Project timeline management
- **Owner**: Initiative Lead (IL)
- **Activities**: Create detailed timeline with milestones and tasks

### Stage 7: Trial Implementation & Performance Check (STLD)
- **Purpose**: Pilot implementation and testing
- **Owner**: Site Lead (STLD)
- **Activities**: Execute trial, monitor performance, validate results

### Stage 8: Periodic Status Review with CMO (CTSD)
- **Purpose**: Management review and progress assessment
- **Owner**: Corp TSD (CTSD)
- **Activities**: Present status to CMO, get approval for full implementation

### Stage 9: Savings Monitoring (1 Month) (STLD)
- **Purpose**: Track actual savings after implementation
- **Owner**: Site Lead (STLD)
- **Activities**: Monitor and document actual savings achieved

### Stage 10: Saving Validation with F&A (STLD)
- **Purpose**: Financial validation of savings
- **Owner**: Site Lead (STLD)
- **Activities**: Work with Finance & Accounting for savings validation

### Stage 11: Initiative Closure (STLD)
- **Purpose**: Final closure and documentation
- **Owner**: Site Lead (STLD)
- **Activities**: Complete documentation, lessons learned, final closure

## 🚀 Key Features

### 🔐 Authentication & User Management
- **JWT-based secure authentication**
- **Role-based access control**
- **Multi-site user management**
- **User profile management**

### 📊 Initiative Management
- **Create, view, edit, delete initiatives**
- **Initiative numbering system**
- **Progress tracking with percentage completion**
- **Priority management (High, Medium, Low)**
- **Expected vs actual savings tracking**
- **MOC and CAPEX requirement flags**

### 🔄 Workflow Management
- **Dynamic 11-stage approval process**
- **Role-based stage assignments**
- **Approval/rejection with comments**
- **Automatic stage progression**
- **Pending approvals dashboard**
- **Workflow transaction history**

### 📅 Timeline Management
- **Initiative timeline tracking**
- **Task management with RACI matrix**
- **Milestone tracking**
- **Deadline monitoring**
- **Progress visualization**

### 💬 Communication & Collaboration
- **Comment system for each initiative**
- **Activity history tracking**
- **Real-time status updates**
- **Notification system**

### 📈 Reporting & Analytics
- **Dashboard with key metrics**
- **KPI tracking and visualization**
- **Monthly monitoring reports**
- **Savings analysis**
- **Progress reports**
- **Closure analytics**

### 📋 Monthly Monitoring
- **Monthly progress tracking**
- **Savings validation**
- **Performance metrics**
- **Trend analysis**

## 🖥️ Application Modules

### 1. **Dashboard** (`/`)
- **Overview of all initiatives**
- **Key performance indicators**
- **Recent activities**
- **Quick statistics**

### 2. **Initiatives** (`/initiatives`)
- **Complete initiative listing**
- **Search and filter capabilities**
- **Bulk operations**
- **Initiative details modal**

### 3. **New Initiative** (`/new-initiative`)
- **Initiative creation form**
- **Required field validation**
- **Site and discipline selection**
- **Expected savings input**

### 4. **Workflow Management** (`/workflow`)
- **Active workflow tracking**
- **Pending approvals**
- **Stage-wise progress**
- **Approval actions**

### 5. **Timeline Tracker** (`/timeline-tracker`)
- **Project timeline visualization**
- **Task management**
- **Milestone tracking**
- **RACI matrix**

### 6. **KPI Dashboard** (`/kpi`)
- **Key performance indicators**
- **Charts and graphs**
- **Trend analysis**
- **Performance metrics**

### 7. **Monthly Monitoring** (`/monthly-monitoring`)
- **Monthly progress reports**
- **Savings tracking**
- **Performance analysis**
- **Variance reporting**

### 8. **Reports** (`/reports`)
- **Comprehensive reporting**
- **Custom report generation**
- **Export capabilities**
- **Historical data analysis**

### 9. **Teams** (`/teams`)
- **Team management**
- **User assignments**
- **Role management**
- **Collaboration tools**

### 10. **Closure** (`/closure`)
- **Initiative closure process**
- **Final documentation**
- **Lessons learned**
- **Closure analytics**

## 🔧 Technical Architecture

### **Backend**
- **Java Spring Boot 2.7.18**
- **H2 In-Memory Database**
- **JWT Authentication**
- **Spring Security**
- **JPA/Hibernate**
- **RESTful API**

### **Frontend**
- **React 18 with TypeScript**
- **Vite for build tooling**
- **Tailwind CSS for styling**
- **React Query for data fetching**
- **React Router for navigation**
- **Shadcn/UI components**

### **Database Schema**
- **Users** - Authentication and user profiles
- **Initiatives** - Main initiative data
- **Workflow_Stages** - Master stage definitions
- **Workflow_Transactions** - Stage progression tracking
- **Timeline_Tasks** - Task management
- **Comments** - Communication history
- **Monthly_Monitoring_Entries** - Progress tracking

## 🔒 Security Features

- **JWT token-based authentication**
- **Role-based access control (RBAC)**
- **Secure API endpoints**
- **Data validation and sanitization**
- **Session management**

## 📱 User Experience

### **Responsive Design**
- **Mobile-friendly interface**
- **Tablet optimization**
- **Desktop full-feature access**

### **Intuitive Navigation**
- **Sidebar navigation**
- **Breadcrumb trails**
- **Quick action buttons**
- **Search functionality**

### **Real-time Updates**
- **Live status changes**
- **Automatic refresh**
- **Notification system**
- **Progress indicators**

## 🚀 Getting Started

### **For Site Leads (STLD)**
1. **Login** to the system
2. **Navigate** to "New Initiative"
3. **Create** your initiative with details
4. **Submit** for approval workflow
5. **Monitor** progress through stages

### **For Approvers (SH, EH, IL, CTSD)**
1. **Login** to your account
2. **Check** "Workflow Management" for pending approvals
3. **Review** initiative details
4. **Approve or Reject** with comments
5. **Track** overall progress

### **For Administrators**
1. **Manage** user accounts and roles
2. **Monitor** system-wide metrics
3. **Generate** reports and analytics
4. **Oversee** workflow processes

## 📊 Success Metrics

- **Initiative completion rate**
- **Average cycle time per stage**
- **Total savings achieved**
- **User adoption rate**
- **Process efficiency improvements**

## 🔄 Continuous Improvement

The OpEx Hub system is designed to continuously evolve based on:
- **User feedback**
- **Process optimization**
- **Technology updates**
- **Business requirement changes**

---

*This guide provides a comprehensive overview of the OpEx Hub system. For technical documentation, refer to the README.md file.*
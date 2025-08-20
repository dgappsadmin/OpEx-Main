import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppLayout } from "./components/layout/AppLayout";
import AuthPage from "./components/auth/AuthPage";
import Dashboard from "./pages/Dashboard";
import InitiativeForm from "./pages/InitiativeForm";
import Initiatives from "./pages/Initiatives";
import Workflow from "./pages/Workflow";
import NewWorkflow from "./pages/NewWorkflow";
// import Timeline from "./pages/Timeline";
import KPI from "./pages/KPI";
import Reports from "./pages/Reports";
import Teams from "./pages/Teams";
// import Closure from "./pages/Closure";
import TimelineTracker from "./pages/TimelineTracker";
import MonthlyMonitoring from "./pages/MonthlyMonitoring";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  console.log('ProtectedRoute - User:', user, 'isLoading:', isLoading);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading OpEx Hub...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (for auth page)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  console.log('PublicRoute - User:', user, 'isLoading:', isLoading);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading OpEx Hub...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    console.log('PublicRoute: User exists, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Main App Layout Component
const AppRoutes = () => {
  const { user, logout } = useAuth();
  
  return (
    <Routes>
      {/* Public route - Auth page */}
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <AuthPage onLogin={() => {}} />
          </PublicRoute>
        } 
      />
      
      {/* Protected routes - Main app */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <Dashboard user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/initiative/new" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <InitiativeForm user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/initiatives" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <Initiatives user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } />
               {/* <p className="font-medium">₹{initiative.expectedSavings || 0}K</p> */}
      <Route path="/workflow" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <NewWorkflow user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } />
      
      {/* <Route path="/timeline" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <Timeline user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } /> */}
      
      <Route path="/kpi" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <KPI user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <Reports user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/teams" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <Teams user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/timeline-tracker" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <TimelineTracker user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/monthly-monitoring" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <MonthlyMonitoring user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } />
      
      {/* <Route path="/closure" element={
        <ProtectedRoute>
          <AppLayout user={user!} onLogout={logout}>
            <ErrorBoundary>
              <Closure user={user!} />
            </ErrorBoundary>
          </AppLayout>
        </ProtectedRoute>
      } /> */}
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
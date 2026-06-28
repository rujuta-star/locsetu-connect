import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import SearchPage from "@/pages/SearchPage";
import WorkerProfilePage from "@/pages/WorkerProfilePage";
import CustomerDashboardPage from "@/pages/CustomerDashboardPage";
import WorkerDashboardPage from "@/pages/WorkerDashboardPage";
import PostJobPage from "@/pages/PostJobPage";
import JobDetailPage from "@/pages/JobDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import SavedWorkersPage from "@/pages/SavedWorkersPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminWorkersPage from "@/pages/AdminWorkersPage";
import BuzzPage from "@/pages/BuzzPage";
import EmergencyPage from "@/pages/EmergencyPage";
import YojanaPage from "@/pages/YojanaPage";
import CommunityHelpPage from "@/pages/CommunityHelpPage";
import LearningPage from "@/pages/LearningPage";
import PricingPage from "@/pages/PricingPage";
import SosPage from "@/pages/SosPage";
import AvailabilityPage from "@/pages/AvailabilityPage";
import PortfolioPage from "@/pages/PortfolioPage";
import IncomeDashboardPage from "@/pages/IncomeDashboardPage";
import NotFound from "@/pages/not-found";
import { useLocation } from "wouter";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
    if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "worker") navigate("/worker-dashboard");
      else navigate("/dashboard");
    }
  }, [user, isLoading, allowedRoles, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Core routes */}
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/workers/:id" component={WorkerProfilePage} />
        <Route path="/buzz" component={BuzzPage} />

        {/* New community features */}
        <Route path="/emergency" component={EmergencyPage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/learn" component={LearningPage} />
        <Route path="/community" component={CommunityHelpPage} />
        <Route path="/yojana" component={YojanaPage} />
        <Route path="/sos" component={SosPage} />

        {/* Protected worker features */}
        <Route path="/availability">
          <ProtectedRoute allowedRoles={["worker"]}>
            <AvailabilityPage />
          </ProtectedRoute>
        </Route>
        <Route path="/portfolio">
          <ProtectedRoute allowedRoles={["worker"]}>
            <PortfolioPage />
          </ProtectedRoute>
        </Route>
        <Route path="/income">
          <ProtectedRoute allowedRoles={["worker"]}>
            <IncomeDashboardPage />
          </ProtectedRoute>
        </Route>

        {/* Dashboards */}
        <Route path="/dashboard">
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboardPage />
          </ProtectedRoute>
        </Route>
        <Route path="/worker-dashboard">
          <ProtectedRoute allowedRoles={["worker"]}>
            <WorkerDashboardPage />
          </ProtectedRoute>
        </Route>
        <Route path="/jobs/new">
          <ProtectedRoute allowedRoles={["customer"]}>
            <PostJobPage />
          </ProtectedRoute>
        </Route>
        <Route path="/jobs/:id">
          <ProtectedRoute>
            <JobDetailPage />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        </Route>
        <Route path="/saved">
          <ProtectedRoute allowedRoles={["customer"]}>
            <SavedWorkersPage />
          </ProtectedRoute>
        </Route>
        <Route path="/notifications">
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/users">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/workers">
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminWorkersPage />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

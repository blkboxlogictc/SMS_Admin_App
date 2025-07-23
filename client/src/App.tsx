import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { AdminLayout } from "@/components/layout/admin-layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import Rewards from "@/pages/rewards";
import Surveys from "@/pages/surveys";
import Businesses from "@/pages/businesses";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function AuthenticatedRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/events" component={Events} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/surveys" component={Surveys} />
        <Route path="/businesses" component={Businesses} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-xl mx-auto mb-4 animate-pulse"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AuthenticatedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppRoutes />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import ErrorBoundary from "./components/ui/error-boundary";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UsageProvider } from "./contexts/UsageContext";
import RoleSwitcher from "./components/auth/RoleSwitcher";
import { MainLayout } from "./components/layout/MainLayout";

// Pages
import Dashboard from "./pages/dashboard";
import Home from "./pages/home";
import ActiveLots from "./pages/active-lots";
import LiveCopart from "./pages/live-copart";
import LiveIAAI from "./pages/live-iaai";
import IAAIPage from "./pages/iaai";
import AuctionMind from "./pages/auction-mind";
import AuctionMindV2 from "./pages/auction-mind-v2";
import ImportCalculator from "./pages/import-calculator";
import Datasets from "./pages/datasets";
import Account from "./pages/account";
import Billing from "./pages/billing";
import LandingPage from "./pages/landing";
import AuthPage from "./pages/auth";
import AdminDashboard from "./pages/admin";
import DataCollectionPage from "./pages/data-collection";
import NotFound from "./pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading e-ComAutos...</p>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  if (!user) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/login" component={AuthPage} />
        <Route path="/signup" component={AuthPage} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  // Show main application for authenticated users
  return (
    <MainLayout>
      <Switch>
        <Route path="/copart" component={Home} />
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/active-lots" component={ActiveLots} />
        <Route path="/live-copart" component={LiveCopart} />
        <Route path="/live-iaai" component={LiveIAAI} />
        <Route path="/iaai" component={IAAIPage} />
        <Route path="/vin-history" component={AuctionMind} />
        <Route path="/auction-mind-v2" component={AuctionMindV2} />
        <Route path="/import-calculator" component={ImportCalculator} />
        <Route path="/datasets" component={Datasets} />
        <Route path="/account" component={Account} />
        <Route path="/billing" component={Billing} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/data-collection" component={DataCollectionPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UsageProvider>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Router />
              <Toaster />
              <RoleSwitcher />
            </div>
          </QueryClientProvider>
        </UsageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
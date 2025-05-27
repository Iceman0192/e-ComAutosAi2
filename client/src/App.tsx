import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import ErrorBoundary from "./components/ui/error-boundary";
import { AuthProvider } from "./contexts/AuthContext";
import { UsageProvider } from "./contexts/UsageContext";
import RoleSwitcher from "./components/auth/RoleSwitcher";
import { MainLayout } from "./components/layout/MainLayout";

// Pages
import Dashboard from "./pages/dashboard";
import Home from "./pages/home";
import IAAI from "./pages/iaai";
import LiveCopart from "./pages/live-copart";
import LiveIAAI from "./pages/live-iaai";
import CrossPlatform from "./pages/cross-platform";
import AIAnalysis from "./pages/ai-analysis";
import Datasets from "./pages/datasets";
import Account from "./pages/account";
import Billing from "./pages/billing";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/" component={Home} />
        <Route path="/copart" component={Home} />
        <Route path="/iaai" component={IAAI} />
        <Route path="/live-copart" component={LiveCopart} />
        <Route path="/live-iaai" component={LiveIAAI} />
        <Route path="/cross-platform" component={CrossPlatform} />
        <Route path="/ai-analysis" component={AIAnalysis} />
        <Route path="/datasets" component={Datasets} />
        <Route path="/account" component={Account} />
        <Route path="/billing" component={Billing} />
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
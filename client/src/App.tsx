import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import ErrorBoundary from "./components/ui/error-boundary";
import { AuthProvider } from "./contexts/AuthContext";
import { UsageProvider } from "./contexts/UsageContext";
import RoleSwitcher from "./components/auth/RoleSwitcher";

// Pages
import Home from "./pages/home";
import IAAI from "./pages/iaai";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/copart" component={Home} />
      <Route path="/iaai" component={IAAI} />
      <Route component={NotFound} />
    </Switch>
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
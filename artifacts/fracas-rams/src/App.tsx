import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import JobCards from "@/pages/job-cards";
import Reports from "@/pages/reports";
import Fleet from "@/pages/fleet";
import Scenarios from "@/pages/scenarios";
import NCR from "@/pages/ncr";
import EIR from "@/pages/eir";
import RSOI from "@/pages/rsoi";
import DLP from "@/pages/dlp";
import Tools from "@/pages/tools";
import GatePass from "@/pages/gate-pass";
import Inventory from "@/pages/inventory";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/job-cards" component={JobCards} />
        <Route path="/reports" component={Reports} />
        <Route path="/fleet" component={Fleet} />
        <Route path="/ncr" component={NCR} />
        <Route path="/scenarios" component={Scenarios} />
        <Route path="/eir" component={EIR} />
        <Route path="/rsoi" component={RSOI} />
        <Route path="/dlp" component={DLP} />
        <Route path="/tools" component={Tools} />
        <Route path="/gate-pass" component={GatePass} />
        <Route path="/inventory" component={Inventory} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

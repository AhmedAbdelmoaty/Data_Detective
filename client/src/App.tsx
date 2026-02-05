import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/Sidebar";

// Pages
import Intro from "@/pages/Intro";
import Office from "@/pages/Office";
import EvidenceRoom from "@/pages/EvidenceRoom";
import Interviews from "@/pages/Interviews";
import HypothesisBoard from "@/pages/HypothesisBoard";
import Report from "@/pages/Report";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-screen bg-background overflow-hidden font-arabic"
      dir="rtl"
    >
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        {/* Subtle grid background for the main area */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="relative z-10 min-h-full">{children}</div>
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Intro} />

      {/* Game Routes wrapped in Layout */}
      <Route path="/office">
        <Layout>
          <Office />
        </Layout>
      </Route>
      {/* New simulation routes */}
      <Route path="/analyst">
        <Layout>
          <HypothesisBoard />
        </Layout>
      </Route>
      <Route path="/archive">
        <Layout>
          <EvidenceRoom />
        </Layout>
      </Route>
      <Route path="/meetings">
        <Layout>
          <Interviews />
        </Layout>
      </Route>

      {/* Backward-compatible routes */}
      <Route path="/hypotheses">
        <Layout>
          <HypothesisBoard />
        </Layout>
      </Route>
      <Route path="/evidence">
        <Layout>
          <EvidenceRoom />
        </Layout>
      </Route>
      <Route path="/interviews">
        <Layout>
          <Interviews />
        </Layout>
      </Route>
      <Route path="/data">
        <Layout>
          <HypothesisBoard initialTab="data" />
        </Layout>
      </Route>
      <Route path="/report">
        <Layout>
          <Report />
        </Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

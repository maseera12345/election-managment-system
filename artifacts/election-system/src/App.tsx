import { Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import About from "@/pages/public/About";
import Contact from "@/pages/public/Contact";
import ElectionDetail from "@/pages/public/ElectionDetail";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminElections from "@/pages/admin/AdminElections";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminRequests from "@/pages/admin/AdminRequests";

import CreatorDashboard from "@/pages/creator/CreatorDashboard";
import CreateElection from "@/pages/creator/CreateElection";
import EditElection from "@/pages/creator/EditElection";
import CreatorElections from "@/pages/creator/CreatorElections";
import CreatorCandidates from "@/pages/creator/CreatorCandidates";
import ManageVoters from "@/pages/creator/ManageVoters";

import VoterDashboard from "@/pages/voter/VoterDashboard";
import VoterElections from "@/pages/voter/VoterElections";
import VoterParticipations from "@/pages/voter/VoterParticipations";
import JoinElection from "@/pages/voter/JoinElection";
import VoteElection from "@/pages/voter/VoteElection";

import ElectionResults from "@/pages/shared/ElectionResults";
import NotFound from "@/pages/not-found";

// React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

/**
 * SAFE Protected Route Wrapper (FIXED for Vercel TS)
 */
const Protected = (
  Component: React.ComponentType,
  roles: string[]
) => {
  return function ProtectedWrapper() {
    return (
      <ProtectedRoute allowedRoles={roles}>
        <Component />
      </ProtectedRoute>
    );
  };
};

function AppRouter() {
  return (
    <>
      {/* PUBLIC ROUTES */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/elections/:id" component={ElectionDetail} />

      {/* ADMIN */}
      <Route path="/admin" component={Protected(AdminDashboard, ["super_admin"])} />
      <Route path="/admin/requests" component={Protected(AdminRequests, ["super_admin"])} />
      <Route path="/admin/elections" component={Protected(AdminElections, ["super_admin"])} />
      <Route path="/admin/elections/:id/results" component={Protected(ElectionResults, ["super_admin"])} />
      <Route path="/admin/users" component={Protected(AdminUsers, ["super_admin"])} />
      <Route path="/admin/audit-logs" component={Protected(AdminAuditLogs, ["super_admin"])} />
      <Route path="/admin/notifications" component={Protected(AdminNotifications, ["super_admin"])} />

      {/* CREATOR */}
      <Route path="/creator" component={Protected(CreatorDashboard, ["election_creator"])} />
      <Route path="/creator/create" component={Protected(CreateElection, ["election_creator"])} />
      <Route path="/creator/elections" component={Protected(CreatorElections, ["election_creator"])} />
      <Route path="/creator/elections/:id/edit" component={Protected(EditElection, ["election_creator"])} />
      <Route path="/creator/elections/:id/candidates" component={Protected(CreatorCandidates, ["election_creator"])} />
      <Route path="/creator/elections/:id/voters" component={Protected(ManageVoters, ["election_creator"])} />
      <Route path="/creator/elections/:id/results" component={Protected(ElectionResults, ["election_creator"])} />

      {/* VOTER */}
      <Route path="/voter" component={Protected(VoterDashboard, ["voter"])} />
      <Route path="/voter/elections" component={Protected(VoterElections, ["voter"])} />
      <Route path="/voter/participations" component={Protected(VoterParticipations, ["voter"])} />
      <Route path="/voter/elections/:id/join" component={Protected(JoinElection, ["voter"])} />
      <Route path="/voter/elections/:id/vote" component={Protected(VoteElection, ["voter"])} />
      <Route path="/voter/elections/:id/results" component={Protected(ElectionResults, ["voter"])} />

      {/* 404 */}
      <Route component={NotFound} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

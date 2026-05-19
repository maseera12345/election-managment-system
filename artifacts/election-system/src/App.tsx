import { Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

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

      {/* ADMIN ROUTES */}
      <Route
        path="/admin"
        component={() => (
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin/requests"
        component={() => (
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <AdminRequests />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin/elections"
        component={() => (
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <AdminElections />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin/elections/:id/results"
        component={() => (
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <ElectionResults />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin/users"
        component={() => (
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin/audit-logs"
        component={() => (
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <AdminAuditLogs />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin/notifications"
        component={() => (
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <AdminNotifications />
          </ProtectedRoute>
        )}
      />

      {/* CREATOR ROUTES */}
      <Route
        path="/creator"
        component={() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <CreatorDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/creator/create"
        component={() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <CreateElection />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/creator/elections"
        component={() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <CreatorElections />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/creator/elections/:id/edit"
        component={() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <EditElection />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/creator/elections/:id/candidates"
        component={() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <CreatorCandidates />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/creator/elections/:id/voters"
        component={() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <ManageVoters />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/creator/elections/:id/results"
        component={() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <ElectionResults />
          </ProtectedRoute>
        )}
      />

      {/* VOTER ROUTES */}
      <Route
        path="/voter"
        component={() => (
          <ProtectedRoute allowedRoles={["voter"]}>
            <VoterDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/voter/elections"
        component={() => (
          <ProtectedRoute allowedRoles={["voter"]}>
            <VoterElections />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/voter/participations"
        component={() => (
          <ProtectedRoute allowedRoles={["voter"]}>
            <VoterParticipations />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/voter/elections/:id/join"
        component={() => (
          <ProtectedRoute allowedRoles={["voter"]}>
            <JoinElection />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/voter/elections/:id/vote"
        component={() => (
          <ProtectedRoute allowedRoles={["voter"]}>
            <VoteElection />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/voter/elections/:id/results"
        component={() => (
          <ProtectedRoute allowedRoles={["voter"]}>
            <ElectionResults />
          </ProtectedRoute>
        )}
      />

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
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

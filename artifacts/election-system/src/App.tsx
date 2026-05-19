import { Switch, Route, Router as WouterRouter } from "wouter";
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
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/elections/:id" component={ElectionDetail} />

      {/* Admin */}
      <Route path="/admin">
        {() => <ProtectedRoute allowedRoles={["super_admin"]}><AdminDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/admin/requests">
        {() => <ProtectedRoute allowedRoles={["super_admin"]}><AdminRequests /></ProtectedRoute>}
      </Route>
      <Route path="/admin/elections">
        {() => <ProtectedRoute allowedRoles={["super_admin"]}><AdminElections /></ProtectedRoute>}
      </Route>
      <Route path="/admin/elections/:id/results">
        {() => <ProtectedRoute allowedRoles={["super_admin"]}><ElectionResults /></ProtectedRoute>}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute allowedRoles={["super_admin"]}><AdminUsers /></ProtectedRoute>}
      </Route>
      <Route path="/admin/audit-logs">
        {() => <ProtectedRoute allowedRoles={["super_admin"]}><AdminAuditLogs /></ProtectedRoute>}
      </Route>
      <Route path="/admin/notifications">
        {() => <ProtectedRoute allowedRoles={["super_admin"]}><AdminNotifications /></ProtectedRoute>}
      </Route>

      {/* Creator */}
      <Route path="/creator">
        {() => <ProtectedRoute allowedRoles={["election_creator"]}><CreatorDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/creator/create">
        {() => <ProtectedRoute allowedRoles={["election_creator"]}><CreateElection /></ProtectedRoute>}
      </Route>
      <Route path="/creator/elections">
        {() => <ProtectedRoute allowedRoles={["election_creator"]}><CreatorElections /></ProtectedRoute>}
      </Route>
      <Route path="/creator/elections/:id/edit">
        {() => <ProtectedRoute allowedRoles={["election_creator"]}><EditElection /></ProtectedRoute>}
      </Route>
      <Route path="/creator/elections/:id/candidates">
        {() => <ProtectedRoute allowedRoles={["election_creator"]}><CreatorCandidates /></ProtectedRoute>}
      </Route>
      <Route path="/creator/elections/:id/voters">
        {() => <ProtectedRoute allowedRoles={["election_creator"]}><ManageVoters /></ProtectedRoute>}
      </Route>
      <Route path="/creator/elections/:id/results">
        {() => <ProtectedRoute allowedRoles={["election_creator"]}><ElectionResults /></ProtectedRoute>}
      </Route>

      {/* Voter */}
      <Route path="/voter">
        {() => <ProtectedRoute allowedRoles={["voter"]}><VoterDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/voter/elections">
        {() => <ProtectedRoute allowedRoles={["voter"]}><VoterElections /></ProtectedRoute>}
      </Route>
      <Route path="/voter/participations">
        {() => <ProtectedRoute allowedRoles={["voter"]}><VoterParticipations /></ProtectedRoute>}
      </Route>
      <Route path="/voter/elections/:id/join">
        {() => <ProtectedRoute allowedRoles={["voter"]}><JoinElection /></ProtectedRoute>}
      </Route>
      <Route path="/voter/elections/:id/vote">
        {() => <ProtectedRoute allowedRoles={["voter"]}><VoteElection /></ProtectedRoute>}
      </Route>
      <Route path="/voter/elections/:id/results">
        {() => <ProtectedRoute allowedRoles={["voter"]}><ElectionResults /></ProtectedRoute>}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

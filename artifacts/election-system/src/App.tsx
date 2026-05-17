import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ElectionDetail from "@/pages/public/ElectionDetail";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";

import CreatorDashboard from "@/pages/creator/CreatorDashboard";
import CreateElection from "@/pages/creator/CreateElection";
import CreatorElections from "@/pages/creator/CreatorElections";
import CreatorCandidates from "@/pages/creator/CreatorCandidates";

import VoterDashboard from "@/pages/voter/VoterDashboard";
import VoterElections from "@/pages/voter/VoterElections";

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/elections/:id" component={ElectionDetail} />
      
      {/* Admin Routes */}
      <Route path="/admin">
        {() => (
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        )}
      </Route>

      {/* Creator Routes */}
      <Route path="/creator">
        {() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <CreatorDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/creator/create">
        {() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <CreateElection />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/creator/elections">
        {() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <CreatorElections />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/creator/elections/:id/candidates">
        {() => (
          <ProtectedRoute allowedRoles={["election_creator"]}>
            <CreatorCandidates />
          </ProtectedRoute>
        )}
      </Route>

      {/* Voter Routes */}
      <Route path="/voter">
        {() => (
          <ProtectedRoute allowedRoles={["voter"]}>
            <VoterDashboard />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/voter/elections">
        {() => (
          <ProtectedRoute allowedRoles={["voter"]}>
            <VoterElections />
          </ProtectedRoute>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const queryClient = new QueryClient();

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

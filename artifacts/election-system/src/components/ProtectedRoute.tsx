import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to their respective dashboard
    if (role === "super_admin") return <Redirect to="/admin" />;
    if (role === "election_creator") return <Redirect to="/creator" />;
    return <Redirect to="/voter" />;
  }

  return <>{children}</>;
}

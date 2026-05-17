import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetCreatorDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Archive, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";

export default function CreatorDashboard() {
  const { data: dashboard, isLoading } = useGetCreatorDashboard();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Creator Dashboard</h1>
          <Button asChild>
            <Link href="/creator/create">Create New Election</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Elections</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.totalElections || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.activeElections || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.upcomingElections || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.totalVoters || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Elections</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.recentElections && dashboard.recentElections.length > 0 ? (
              <div className="divide-y">
                {dashboard.recentElections.map((election) => (
                  <div key={election.id} className="py-4 flex items-center justify-between flex-wrap gap-4 first:pt-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{election.title}</span>
                        <StatusBadge status={election.status} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {election.voterCount || 0} voters • {election.voteCount || 0} votes cast
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/creator/elections/${election.id}/results`}>Manage</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                <Archive className="h-12 w-12 text-muted mb-4" />
                <p>You haven't created any elections yet.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/creator/create">Create your first election</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

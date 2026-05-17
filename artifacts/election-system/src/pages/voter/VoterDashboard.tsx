import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetVoterDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Archive, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";

export default function VoterDashboard() {
  const { data: dashboard, isLoading } = useGetVoterDashboard();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
        <h1 className="text-3xl font-bold tracking-tight text-primary">Voter Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Joined Elections</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.joinedElections || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.votedCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Elections</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.upcomingElections || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-end mt-8 mb-4">
          <h2 className="text-xl font-bold tracking-tight">Your Participations</h2>
          <Button variant="outline" asChild>
            <Link href="/voter/elections">Browse Elections</Link>
          </Button>
        </div>

        {dashboard?.participations && dashboard.participations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboard.participations.map((participation) => (
              <Card key={participation.election.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <StatusBadge status={participation.election.status} />
                    {participation.voter.hasVoted && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-medium">Voted</span>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{participation.election.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-sm mb-2 flex justify-between">
                    <span className="text-muted-foreground">Approval Status:</span>
                    <StatusBadge status={participation.voter.status} className="scale-90 origin-right" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {participation.election.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t">
                  {participation.election.status === "active" && (participation.voter.status === "approved" || participation.voter.status === "finalized") && !participation.voter.hasVoted ? (
                    <Button asChild className="w-full">
                      <Link href={`/voter/elections/${participation.election.id}/join`}>Vote Now</Link>
                    </Button>
                  ) : participation.election.status === "completed" ? (
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/voter/elections/${participation.election.id}/results`}>View Results</Link>
                    </Button>
                  ) : (
                    <Button variant="secondary" asChild className="w-full">
                      <Link href={`/elections/${participation.election.id}`}>View Details</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
              <Archive className="h-12 w-12 text-muted mb-4" />
              <p>You haven't joined any elections yet.</p>
              <Button className="mt-4" asChild>
                <Link href="/voter/elections">Find an election to join</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

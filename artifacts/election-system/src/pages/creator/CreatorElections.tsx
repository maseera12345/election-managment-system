import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListElections } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { Archive, Users, Vote } from "lucide-react";

export default function CreatorElections() {
  const { user } = useAuth();
  const { data: response, isLoading } = useListElections(
    user?.id ? { creatorId: user.id, limit: 100 } : { limit: 0 }
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-52 bg-muted rounded-lg"></div>)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const elections = response?.elections || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">My Elections</h1>
            <p className="text-muted-foreground mt-1">{elections.length} election{elections.length !== 1 ? "s" : ""} created</p>
          </div>
          <Button asChild>
            <Link href="/creator/create">+ Create New</Link>
          </Button>
        </div>

        {elections.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center text-muted-foreground flex flex-col items-center">
              <Archive className="h-12 w-12 text-muted mb-4" />
              <p className="mb-4">You haven't created any elections yet.</p>
              <Button asChild>
                <Link href="/creator/create">Create your first election</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <Card key={election.id} className="flex flex-col hover:shadow-md transition-shadow">
                {election.bannerUrl && (
                  <div className="h-32 rounded-t-lg overflow-hidden bg-muted">
                    <img src={election.bannerUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between mb-2">
                    <StatusBadge status={election.status} />
                    {election.votersFinalized && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Voters Finalized</span>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2 leading-snug">{election.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-1 text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {election.voterCount ?? 0} voters
                    </span>
                    <span className="flex items-center gap-1">
                      <Vote className="h-3.5 w-3.5" />
                      {election.voteCount ?? 0} votes
                    </span>
                  </div>
                  {election.startDate && (
                    <p className="text-xs">Starts: {format(new Date(election.startDate), "PP p")}</p>
                  )}
                  {election.endDate && (
                    <p className="text-xs">Ends: {format(new Date(election.endDate), "PP p")}</p>
                  )}
                </CardContent>
                <CardFooter className="pt-4 border-t gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/creator/elections/${election.id}/candidates`}>Candidates</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/creator/elections/${election.id}/voters`}>Voters</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/creator/elections/${election.id}/results`}>Results</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListElections } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

export default function CreatorElections() {
  // Pass an empty object to get all elections for the creator, or rely on creatorId if needed
  const { data: response, isLoading } = useListElections();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-lg"></div>)}
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
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Elections</h1>
          <Button asChild>
            <Link href="/creator/create">Create New</Link>
          </Button>
        </div>

        {elections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
              <p>You haven't created any elections yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <Card key={election.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <StatusBadge status={election.status} />
                  </div>
                  <CardTitle className="line-clamp-2">{election.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <p>Voters: {election.voterCount || 0}</p>
                  <p>Candidates: {election.candidateCount || 0}</p>
                  {election.startDate && <p>Starts: {format(new Date(election.startDate), "PP p")}</p>}
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

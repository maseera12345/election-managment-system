import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetElection, useListCandidates } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useRoute } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

export default function ElectionDetail() {
  const [, params] = useRoute("/elections/:id");
  const electionId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: election, isLoading: isLoadingElection } = useGetElection(electionId, {
    query: { enabled: !!electionId }
  });
  
  const { data: candidates, isLoading: isLoadingCandidates } = useListCandidates(electionId, {
    query: { enabled: !!electionId }
  });

  if (isLoadingElection || isLoadingCandidates) {
    return (
      <PublicLayout>
        <div className="container py-12 animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </PublicLayout>
    );
  }

  if (!election) {
    return (
      <PublicLayout>
        <div className="container py-12 text-center text-muted-foreground">
          Election not found.
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-12 px-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={election.status} />
            {election.category && <span className="opacity-80 text-sm">{election.category}</span>}
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">{election.title}</h1>
          <p className="text-lg opacity-90">{election.description}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20 space-y-8">
        <div className="flex items-center justify-between p-6 bg-muted/30 rounded-lg border">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{election.status.replace("_", " ")}</p>
          </div>
          {election.startDate && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(new Date(election.startDate), "PP p")}</p>
            </div>
          )}
          {election.endDate && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">{format(new Date(election.endDate), "PP p")}</p>
            </div>
          )}
          <Button asChild size="lg">
            <Link href={`/voter/elections/${election.id}/join`}>Join Election</Link>
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Candidates</h2>
          {candidates && candidates.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {candidates.map(candidate => (
                <Card key={candidate.id}>
                  <CardHeader>
                    <CardTitle>{candidate.name}</CardTitle>
                    {candidate.designation && <p className="text-sm text-muted-foreground">{candidate.designation}</p>}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-3">{candidate.manifesto}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg text-muted-foreground">
              No candidates announced yet.
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

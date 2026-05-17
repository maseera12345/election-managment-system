import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListElections, useGetElection, useListCandidates } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useRoute } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";

export default function CreatorCandidates() {
  const [, params] = useRoute("/creator/elections/:id/candidates");
  const electionId = parseInt(params?.id || "0", 10);
  
  const { data: election, isLoading: isLoadingElection } = useGetElection(electionId, {
    query: { enabled: !!electionId }
  });
  
  const { data: candidates, isLoading: isLoadingCandidates } = useListCandidates(electionId, {
    query: { enabled: !!electionId }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/creator/elections">← Back</Link>
          </Button>
          {election && <StatusBadge status={election.status} />}
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Candidates</h1>
            <p className="text-muted-foreground mt-1">{election?.title}</p>
          </div>
          <Button>Add Candidate</Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoadingCandidates ? (
              <div className="animate-pulse grid md:grid-cols-2 gap-6">
                {[1, 2].map(i => <div key={i} className="h-32 bg-muted rounded" />)}
              </div>
            ) : candidates && candidates.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {candidates.map(candidate => (
                  <Card key={candidate.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="text-lg">{candidate.name}</CardTitle>
                      {candidate.designation && <CardDescription>{candidate.designation}</CardDescription>}
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm line-clamp-2 text-muted-foreground">{candidate.manifesto}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No candidates have been added yet.</p>
                <Button variant="outline">Add First Candidate</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetElection, useListCandidates, getGetElectionQueryKey, getListCandidatesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link, useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function VoteElection() {
  const [, params] = useRoute("/voter/elections/:id/vote");
  const electionId = parseInt(params?.id || "0", 10);
  const [, setLocation] = useLocation();
  const { token } = useAuth();

  const { data: election } = useGetElection(electionId, { query: { queryKey: getGetElectionQueryKey(electionId), enabled: !!electionId } });
  const { data: candidates } = useListCandidates(electionId, { query: { queryKey: getListCandidatesQueryKey(electionId), enabled: !!electionId } });

  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [secretId, setSecretId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedSuccess, setVotedSuccess] = useState(false);

  const handleVote = async () => {
    if (!selectedCandidate) {
      toast.error("Please select a candidate");
      return;
    }
    if (!secretId.trim()) {
      toast.error("Please enter your secret voting ID");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/elections/${electionId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ candidateId: selectedCandidate, secretId: secretId.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cast vote");
      setVotedSuccess(true);
      toast.success("Your vote has been cast successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to cast vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (votedSuccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-emerald-100 p-6 mb-6">
            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-3">Vote Cast Successfully!</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Your vote has been recorded securely. Thank you for participating in this election.
          </p>
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/voter">Back to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href={`/voter/elections/${electionId}/results`}>View Live Results</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/voter">← Back</Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Cast Your Vote</h1>
          {election && <p className="text-muted-foreground mt-1">{election.title}</p>}
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex gap-3 pt-4 pb-4">
            <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <strong>Secure Voting:</strong> Your vote is anonymous and cannot be traced back to you. 
              Enter your secret voting ID (provided by the election organizer) to authenticate.
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">Step 1 — Select a Candidate</h2>
          {candidates && candidates.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCandidate === candidate.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {candidate.photoUrl ? (
                      <img
                        src={candidate.photoUrl}
                        alt={candidate.name}
                        className="w-16 h-16 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{candidate.name}</h3>
                        {selectedCandidate === candidate.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      {candidate.designation && (
                        <p className="text-sm text-muted-foreground">{candidate.designation}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{candidate.manifesto}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No candidates available for this election.
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Step 2 — Enter Your Secret Voting ID</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secretId">Secret Voting ID</Label>
                <Input
                  id="secretId"
                  placeholder="Enter your secret ID (e.g., ABCD1234EFGH5678)"
                  value={secretId}
                  onChange={(e) => setSecretId(e.target.value.toUpperCase())}
                  className="font-mono text-lg tracking-widest"
                  maxLength={32}
                />
                <p className="text-xs text-muted-foreground">
                  Your secret ID was provided by the election organizer. It ensures your vote is anonymous and secure.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button
            size="lg"
            className="flex-1"
            onClick={handleVote}
            disabled={isSubmitting || !selectedCandidate || !secretId.trim()}
          >
            {isSubmitting ? "Casting Vote..." : "Cast My Vote"}
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/voter">Cancel</Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

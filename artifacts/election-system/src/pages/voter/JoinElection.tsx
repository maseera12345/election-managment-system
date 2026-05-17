import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetElection, useListCandidates, getGetElectionQueryKey, getListCandidatesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useRoute, useLocation } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, Users, Calendar, User, Key, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface VoterInfo {
  id: number;
  status: string;
  hasVoted: boolean;
  secretId?: string | null;
  isUsed?: boolean;
}

export default function JoinElection() {
  const [, params] = useRoute("/voter/elections/:id/join");
  const electionId = parseInt(params?.id || "0", 10);
  const { token } = useAuth();
  const [, setLocation] = useLocation();

  const { data: election } = useGetElection(electionId, { query: { queryKey: getGetElectionQueryKey(electionId), enabled: !!electionId } });
  const { data: candidates } = useListCandidates(electionId, { query: { queryKey: getListCandidatesQueryKey(electionId), enabled: !!electionId } });

  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [joining, setJoining] = useState(false);

  const fetchMyStatus = async () => {
    try {
      const res = await fetch(`/api/elections/${electionId}/my-secret-id`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) { setVoterInfo(null); return; }
      if (!res.ok) throw new Error("Failed to check status");
      const data = await res.json();
      setVoterInfo({ id: data.voter.id, status: data.voter.status, hasVoted: data.voter.hasVoted, secretId: data.secretId, isUsed: data.isUsed });
    } catch {
      setVoterInfo(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => { if (electionId) fetchMyStatus(); }, [electionId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/elections/${electionId}/voters`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("You've joined this election! Awaiting organizer approval.");
      fetchMyStatus();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  };

  const isActive = election?.status === "active";
  const isPublished = election?.status === "published";

  const StatusSection = () => {
    if (checkingStatus) return <div className="animate-pulse h-24 bg-muted rounded-lg" />;

    if (!voterInfo) {
      return (
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Ready to join this election?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Join Election" to register. The organizer will review and approve your participation.
                </p>
              </div>
              <Button onClick={handleJoin} disabled={joining || (!isActive && !isPublished)} className="shrink-0">
                {joining ? "Joining..." : "Join Election"}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (voterInfo.hasVoted) {
      return (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800">You have already voted in this election.</p>
              <Button variant="link" className="p-0 h-auto text-emerald-700" asChild>
                <Link href={`/voter/elections/${electionId}/results`}>View results →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (voterInfo.status === "pending") {
      return (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">Registration pending approval</p>
              <p className="text-sm text-amber-700">The election organizer needs to approve your registration.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (voterInfo.status === "approved" || (voterInfo.status === "finalized" && !voterInfo.secretId)) {
      return (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-800">You are approved to vote</p>
              <p className="text-sm text-blue-700">Waiting for the organizer to generate secret voting IDs.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (voterInfo.status === "finalized" && voterInfo.secretId) {
      return (
        <Card className="border-purple-300 bg-purple-50">
          <CardContent className="pt-4 pb-6 space-y-4">
            <div className="flex items-center gap-3">
              <Key className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-semibold text-purple-800">Your Secret Voting ID</p>
                <p className="text-sm text-purple-700">Use this ID when casting your vote. Keep it private.</p>
              </div>
            </div>
            <div className="bg-white border border-purple-200 rounded-lg p-4 font-mono text-xl tracking-widest text-center text-purple-900 select-all">
              {voterInfo.secretId}
            </div>
            {isActive && (
              <Button className="w-full bg-purple-700 hover:bg-purple-800" asChild>
                <Link href={`/voter/elections/${electionId}/vote`}>Cast Your Vote Now</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/voter/elections">← Browse Elections</Link>
          </Button>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {election && <StatusBadge status={election.status} />}
            {election?.category && (
              <span className="text-sm text-muted-foreground">{election.category}</span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{election?.title || "Loading..."}</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">{election?.description}</p>
        </div>

        <StatusSection />

        {election && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {election.startDate && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
                <Calendar className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium text-xs text-muted-foreground uppercase">Starts</p>
                  <p>{format(new Date(election.startDate), "PP")}</p>
                </div>
              </div>
            )}
            {election.endDate && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
                <Calendar className="h-4 w-4 mt-0.5 text-red-500" />
                <div>
                  <p className="font-medium text-xs text-muted-foreground uppercase">Ends</p>
                  <p>{format(new Date(election.endDate), "PP")}</p>
                </div>
              </div>
            )}
            {election.maxVoters && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-xs text-muted-foreground uppercase">Max Voters</p>
                  <p>{election.maxVoters.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {candidates && candidates.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Candidates ({candidates.length})</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {candidates.map(candidate => (
                <Card key={candidate.id}>
                  <CardContent className="pt-4 pb-4 flex gap-3">
                    {candidate.photoUrl ? (
                      <img src={candidate.photoUrl} alt={candidate.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-7 w-7 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold">{candidate.name}</p>
                      {candidate.designation && <p className="text-sm text-muted-foreground">{candidate.designation}</p>}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{candidate.manifesto}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetElection, getGetElectionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useRoute } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Users, Key, Zap } from "lucide-react";
import { format } from "date-fns";

interface Voter {
  id: number;
  electionId: number;
  userId: number;
  status: string;
  hasVoted: boolean;
  joinedAt: string;
  user?: { id: number; fullName: string; email: string };
}

export default function ManageVoters() {
  const [, params] = useRoute("/creator/elections/:id/voters");
  const electionId = parseInt(params?.id || "0", 10);
  const { token } = useAuth();

  const { data: election } = useGetElection(electionId, { query: { queryKey: getGetElectionQueryKey(electionId), enabled: !!electionId } });

  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/elections/${electionId}/voters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load voters");
      const data = await res.json();
      setVoters(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useState(() => { if (electionId) fetchVoters(); });

  const approveVoter = async (voterId: number) => {
    setActionLoading(`approve-${voterId}`);
    try {
      const res = await fetch(`/api/elections/${electionId}/voters/${voterId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Voter approved");
      await fetchVoters();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const finalizeVoters = async () => {
    setActionLoading("finalize");
    try {
      const res = await fetch(`/api/elections/${electionId}/finalize-voters`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Voters finalized!");
      await fetchVoters();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const generateSecretIds = async () => {
    setActionLoading("secret-ids");
    try {
      const res = await fetch(`/api/elections/${electionId}/secret-ids`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      toast.success(data.message || "Secret IDs generated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const activateElection = async () => {
    setActionLoading("activate");
    try {
      const res = await fetch(`/api/elections/${electionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Election is now ACTIVE! Voting is open.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = voters.filter(v => v.status === "pending").length;
  const approvedCount = voters.filter(v => v.status === "approved").length;
  const finalizedCount = voters.filter(v => v.status === "finalized").length;
  const votedCount = voters.filter(v => v.hasVoted).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/creator/elections">← Back</Link>
          </Button>
          {election && <StatusBadge status={election.status} />}
        </div>

        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Voters</h1>
            <p className="text-muted-foreground mt-1">{election?.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {approvedCount > 0 && !election?.votersFinalized && (
              <Button
                variant="outline"
                onClick={finalizeVoters}
                disabled={actionLoading === "finalize"}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Zap className="h-4 w-4 mr-2" />
                {actionLoading === "finalize" ? "Finalizing..." : `Finalize ${approvedCount} Voters`}
              </Button>
            )}
            {election?.votersFinalized && (
              <Button
                variant="outline"
                onClick={generateSecretIds}
                disabled={actionLoading === "secret-ids"}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Key className="h-4 w-4 mr-2" />
                {actionLoading === "secret-ids" ? "Generating..." : "Generate Secret IDs"}
              </Button>
            )}
            {election?.status === "published" && election.votersFinalized && (
              <Button
                onClick={activateElection}
                disabled={actionLoading === "activate"}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {actionLoading === "activate" ? "Activating..." : "Activate Election"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending", count: pendingCount, color: "text-amber-600" },
            { label: "Approved", count: approvedCount, color: "text-blue-600" },
            { label: "Finalized", count: finalizedCount, color: "text-purple-600" },
            { label: "Voted", count: votedCount, color: "text-emerald-600" },
          ].map(({ label, count, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4">
                <div className={`text-2xl font-bold ${color}`}>{count}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Voter Registrations ({voters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-48 bg-muted rounded" />
            ) : voters.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No voters have joined this election yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Voted</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voters.map(voter => (
                    <TableRow key={voter.id}>
                      <TableCell className="font-medium">{voter.user?.fullName || `User #${voter.userId}`}</TableCell>
                      <TableCell className="text-muted-foreground">{voter.user?.email || "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={voter.status} />
                      </TableCell>
                      <TableCell>
                        {voter.hasVoted ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" /> Voted
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {voter.joinedAt ? format(new Date(voter.joinedAt), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        {voter.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveVoter(voter.id)}
                            disabled={actionLoading === `approve-${voter.id}`}
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >
                            {actionLoading === `approve-${voter.id}` ? "..." : "Approve"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

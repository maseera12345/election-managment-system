import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { useListElections } from "@workspace/api-client-react";

export default function AdminElections() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, isLoading, refetch } = useListElections({ limit: 100 });
  const elections = data?.elections || [];

  const filtered = elections.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  );

  const suspendElection = async (id: number) => {
    setActionLoading(`suspend-${id}`);
    try {
      const res = await fetch(`/api/elections/${id}/suspend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Election suspended");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const activateElection = async (id: number) => {
    setActionLoading(`activate-${id}`);
    try {
      const res = await fetch(`/api/elections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Election activated");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const completeElection = async (id: number) => {
    setActionLoading(`complete-${id}`);
    try {
      const res = await fetch(`/api/elections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Election marked as completed");
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">All Elections</h1>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search elections..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="animate-pulse h-64 bg-muted rounded-lg m-4" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Voters</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(election => (
                    <TableRow key={election.id}>
                      <TableCell className="font-medium max-w-[200px]">
                        <Link href={`/admin/elections/${election.id}/results`} className="hover:underline text-primary">
                          {election.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {election.creator?.fullName || "—"}
                      </TableCell>
                      <TableCell className="text-sm">{election.category || "—"}</TableCell>
                      <TableCell><StatusBadge status={election.status} /></TableCell>
                      <TableCell className="text-sm">{election.voterCount ?? 0}</TableCell>
                      <TableCell className="text-sm">{election.voteCount ?? 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(election.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {election.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-700 hover:bg-red-50 text-xs"
                              onClick={() => suspendElection(election.id)}
                              disabled={!!actionLoading}
                            >
                              Suspend
                            </Button>
                          )}
                          {(election.status === "suspended" || election.status === "published") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs"
                              onClick={() => activateElection(election.id)}
                              disabled={!!actionLoading}
                            >
                              Activate
                            </Button>
                          )}
                          {election.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => completeElection(election.id)}
                              disabled={!!actionLoading}
                            >
                              Complete
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" asChild className="text-xs">
                            <Link href={`/admin/elections/${election.id}/results`}>Results</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No elections found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

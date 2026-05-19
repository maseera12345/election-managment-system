import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListUsers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Search, MoreHorizontal, ShieldCheck, Ban, UserCog } from "lucide-react";

export default function AdminUsers() {
  const { data, isLoading, refetch } = useListUsers({ limit: 100 });
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const users = (data?.users || []).filter(u =>
    !search ||
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const updateUser = async (userId: number, updates: Record<string, unknown>, successMsg: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(successMsg);
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Users</h1>
          <p className="text-muted-foreground mt-1">{data?.users?.length ?? 0} registered users</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id} className={actionLoading === user.id ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <span className="capitalize text-sm">{user.role.replace(/_/g, " ")}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.status === "active" ? (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => updateUser(user.id, { status: "suspended" }, `${user.fullName} suspended`)}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-emerald-600"
                                onClick={() => updateUser(user.id, { status: "active" }, `${user.fullName} activated`)}
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {user.role !== "voter" && (
                              <DropdownMenuItem
                                onClick={() => updateUser(user.id, { role: "voter" }, `Changed to Voter`)}
                              >
                                <UserCog className="h-4 w-4 mr-2" />
                                Set as Voter
                              </DropdownMenuItem>
                            )}
                            {user.role !== "election_creator" && (
                              <DropdownMenuItem
                                onClick={() => updateUser(user.id, { role: "election_creator" }, `Changed to Election Creator`)}
                              >
                                <UserCog className="h-4 w-4 mr-2" />
                                Set as Creator
                              </DropdownMenuItem>
                            )}
                            {user.role !== "super_admin" && (
                              <DropdownMenuItem
                                onClick={() => updateUser(user.id, { role: "super_admin" }, `Changed to Super Admin`)}
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Set as Admin
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        {search ? "No users match your search." : "No users found."}
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

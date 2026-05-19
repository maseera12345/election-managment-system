import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { Bell, Send } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
  targetRole: string | null;
  createdAt: string;
}

export default function AdminNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      setNotifications(await res.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetRole: targetRole === "all" ? null : targetRole,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Notification broadcast successfully");
      setTitle("");
      setMessage("");
      setTargetRole("all");
      fetchNotifications();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Notifications</h1>
          <p className="text-muted-foreground mt-1">Broadcast system-wide announcements to users.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send New Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Notification title..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="voter">Voters Only</SelectItem>
                    <SelectItem value="election_creator">Election Creators Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your notification message..."
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <Button onClick={sendNotification} disabled={sending || !title.trim() || !message.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : "Broadcast Notification"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Sent Notifications ({notifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="animate-pulse h-48 bg-muted rounded-lg m-4" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.title}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">{n.message}</TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {n.targetRole ? n.targetRole.replace(/_/g, " ") : "All users"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(n.createdAt), "MMM d, HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {notifications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        No notifications sent yet.
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

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetElection, useListCandidates, useCreateCandidate, useDeleteCandidate, getGetElectionQueryKey, getListCandidatesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link, useRoute } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, User, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const candidateSchema = z.object({
  name: z.string().min(2, "Name is required"),
  designation: z.string().optional(),
  manifesto: z.string().optional(),
  description: z.string().optional(),
  photoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function CreatorCandidates() {
  const [, params] = useRoute("/creator/elections/:id/candidates");
  const electionId = parseInt(params?.id || "0", 10);
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const { data: election, isLoading: isLoadingElection } = useGetElection(electionId, {
    query: { queryKey: getGetElectionQueryKey(electionId), enabled: !!electionId }
  });

  const { data: candidates, isLoading: isLoadingCandidates, refetch } = useListCandidates(electionId, {
    query: { queryKey: getListCandidatesQueryKey(electionId), enabled: !!electionId }
  });

  const createCandidate = useCreateCandidate();
  const deleteCandidate = useDeleteCandidate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof candidateSchema>>({
    resolver: zodResolver(candidateSchema),
    defaultValues: { name: "", designation: "", manifesto: "", description: "", photoUrl: "" },
  });

  const onSubmit = async (values: z.infer<typeof candidateSchema>) => {
    try {
      await createCandidate.mutateAsync({
        electionId,
        data: {
          name: values.name,
          designation: values.designation || null,
          manifesto: values.manifesto || null,
          description: values.description || null,
          photoUrl: values.photoUrl || null,
        },
      });
      toast.success("Candidate added successfully");
      refetch();
      setDialogOpen(false);
      form.reset();
    } catch (e: any) {
      toast.error(e.message || "Failed to add candidate");
    }
  };

  const handleDelete = async (candidateId: number) => {
    if (!confirm("Remove this candidate?")) return;
    setDeletingId(candidateId);
    try {
      await deleteCandidate.mutateAsync({ electionId, candidateId });
      toast.success("Candidate removed");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to remove candidate");
    } finally {
      setDeletingId(null);
    }
  };

  const publishElection = async () => {
    try {
      const res = await fetch(`/api/elections/${electionId}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Election published! Voters can now discover and join it.");
      queryClient.invalidateQueries({ queryKey: [`/api/elections/${electionId}`] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/creator/elections">← Back to Elections</Link>
          </Button>
          {election && <StatusBadge status={election.status} />}
        </div>

        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Candidates</h1>
            <p className="text-muted-foreground mt-1">{election?.title}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {election?.status === "draft" && (candidates?.length ?? 0) > 0 && (
              <Button variant="outline" onClick={publishElection} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                Publish Election
              </Button>
            )}
            <Button asChild variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
              <Link href={`/creator/elections/${electionId}/voters`}>
                <Users className="h-4 w-4 mr-2" />
                Manage Voters
              </Link>
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Candidate
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoadingCandidates ? (
              <div className="animate-pulse grid md:grid-cols-2 gap-6">
                {[1, 2].map(i => <div key={i} className="h-40 bg-muted rounded" />)}
              </div>
            ) : candidates && candidates.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {candidates.map(candidate => (
                  <Card key={candidate.id} className="overflow-hidden group">
                    <CardContent className="p-4 flex gap-3">
                      {candidate.photoUrl ? (
                        <img src={candidate.photoUrl} alt={candidate.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">{candidate.name}</h3>
                            {candidate.designation && (
                              <p className="text-sm text-muted-foreground">{candidate.designation}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 shrink-0"
                            onClick={() => handleDelete(candidate.id)}
                            disabled={deletingId === candidate.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {candidate.manifesto && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{candidate.manifesto}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Votes: <span className="font-semibold">{candidate.voteCount ?? 0}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 flex flex-col items-center">
                <User className="h-12 w-12 text-muted mb-4" />
                <p className="text-muted-foreground mb-4">No candidates have been added yet.</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Candidate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Candidate</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation / Title</FormLabel>
                      <FormControl><Input placeholder="e.g., Presidential Candidate" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo URL</FormLabel>
                      <FormControl><Input placeholder="https://example.com/photo.jpg" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manifesto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manifesto / Platform</FormLabel>
                      <FormControl><Textarea placeholder="Candidate's key positions and goals..." rows={3} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Bio</FormLabel>
                      <FormControl><Textarea placeholder="Brief background..." rows={2} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createCandidate.isPending}>
                    {createCandidate.isPending ? "Adding..." : "Add Candidate"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

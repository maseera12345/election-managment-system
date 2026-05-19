import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetElection, getGetElectionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Link, useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  category: z.string().optional(),
  bannerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  registrationDeadline: z.string().optional(),
  maxVoters: z.coerce.number().min(1).optional().or(z.literal("")),
});

function toDatetimeLocal(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 16);
}

export default function EditElection() {
  const [, params] = useRoute("/creator/elections/:id/edit");
  const electionId = parseInt(params?.id || "0", 10);
  const { token } = useAuth();
  const [, setLocation] = useLocation();

  const { data: election, isLoading } = useGetElection(electionId, {
    query: { queryKey: getGetElectionQueryKey(electionId), enabled: !!electionId },
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", category: "", bannerUrl: "", startDate: "", endDate: "", registrationDeadline: "" },
  });

  useEffect(() => {
    if (election) {
      form.reset({
        title: election.title,
        description: election.description || "",
        category: election.category || "",
        bannerUrl: election.bannerUrl || "",
        startDate: toDatetimeLocal(election.startDate),
        endDate: toDatetimeLocal(election.endDate),
        registrationDeadline: toDatetimeLocal(election.registrationDeadline),
        maxVoters: election.maxVoters ?? "",
      });
    }
  }, [election]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const res = await fetch(`/api/elections/${electionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          category: values.category || null,
          bannerUrl: values.bannerUrl || null,
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          registrationDeadline: values.registrationDeadline || null,
          maxVoters: values.maxVoters || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Election updated successfully");
      setLocation(`/creator/elections/${electionId}/candidates`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update election");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6 max-w-2xl">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/creator/elections">← Back to Elections</Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Edit Election</h1>
          {election && <p className="text-muted-foreground mt-1">{election.title}</p>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Election Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl><Input placeholder="Election title..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="What is this election for?" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl><Input placeholder="e.g. Corporate, Academic..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="maxVoters" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Voters</FormLabel>
                      <FormControl><Input type="number" placeholder="Unlimited" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="bannerUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Image URL</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date & Time</FormLabel>
                      <FormControl><Input type="datetime-local" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date & Time</FormLabel>
                      <FormControl><Input type="datetime-local" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="registrationDeadline" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Deadline</FormLabel>
                      <FormControl><Input type="datetime-local" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="flex gap-4 pt-2">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/creator/elections">Cancel</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

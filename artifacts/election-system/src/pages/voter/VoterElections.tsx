import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListElections } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Search, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function VoterElections() {
  const [search, setSearch] = useState("");

  const { data: activeData, isLoading: loadingActive } = useListElections({ status: "active", limit: 50 });
  const { data: publishedData, isLoading: loadingPublished } = useListElections({ status: "published", limit: 50 });

  const isLoading = loadingActive || loadingPublished;

  const allElections = [
    ...(activeData?.elections || []),
    ...(publishedData?.elections || []),
  ].filter((e, idx, arr) => arr.findIndex(x => x.id === e.id) === idx);

  const filtered = search
    ? allElections.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
    : allElections;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Browse Elections</h1>
          <p className="text-muted-foreground mt-1">Find elections you can join and participate in.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search elections..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted rounded-lg" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(election => (
              <Card key={election.id} className="flex flex-col hover:shadow-md transition-shadow">
                {election.bannerUrl && (
                  <div className="h-36 bg-muted rounded-t-lg overflow-hidden">
                    <img src={election.bannerUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <StatusBadge status={election.status} />
                    {election.category && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {election.category}
                      </span>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2 leading-snug">{election.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <p className="line-clamp-2">{election.description}</p>
                  <div className="flex flex-col gap-1 pt-1">
                    {election.endDate && (
                      <span className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        Ends {format(new Date(election.endDate), "PP")}
                      </span>
                    )}
                    {election.candidateCount !== undefined && (
                      <span className="flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        {election.candidateCount} candidate{election.candidateCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t">
                  <Button asChild className="w-full">
                    <Link href={`/voter/elections/${election.id}/join`}>
                      {election.status === "active" ? "Join & Vote" : "View & Register"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 border rounded-lg">
            <Search className="h-12 w-12 text-muted mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search ? "No elections match your search." : "No elections are available to join right now."}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetVoterDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Archive, CheckCircle2, Clock, Vote } from "lucide-react";

export default function VoterParticipations() {
  const { data: dashboard, isLoading } = useGetVoterDashboard();

  const participations = dashboard?.participations || [];

  const voted = participations.filter(p => p.voter.hasVoted).length;
  const pending = participations.filter(p => p.voter.status === "pending").length;
  const eligible = participations.filter(p => (p.voter.status === "approved" || p.voter.status === "finalized") && !p.voter.hasVoted && p.election.status === "active").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Participations</h1>
          <p className="text-muted-foreground mt-1">Track your voting history and election memberships.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Joined", value: participations.length, icon: Archive, color: "text-primary" },
            { label: "Votes Cast", value: voted, icon: CheckCircle2, color: "text-emerald-600" },
            { label: "Pending Approval", value: pending, icon: Clock, color: "text-amber-600" },
            { label: "Ready to Vote", value: eligible, icon: Vote, color: "text-purple-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Icon className={`h-8 w-8 ${color}`} />
                <div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-52 bg-muted rounded-lg" />)}
          </div>
        ) : participations.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center flex flex-col items-center text-muted-foreground">
              <Archive className="h-12 w-12 text-muted mb-4" />
              <p className="mb-4">You haven't joined any elections yet.</p>
              <Button asChild>
                <Link href="/voter/elections">Browse Elections</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {participations.map((participation) => {
              const election = participation.election;
              const voter = participation.voter;
              const canVote = election.status === "active" &&
                (voter.status === "approved" || voter.status === "finalized") &&
                !voter.hasVoted;

              return (
                <Card key={election.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <StatusBadge status={election.status} />
                      {voter.hasVoted && (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Voted
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2 leading-snug">{election.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Your status</span>
                      <StatusBadge status={voter.status} />
                    </div>
                    {election.category && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Category</span>
                        <span className="text-xs">{election.category}</span>
                      </div>
                    )}
                    {election.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Ends</span>
                        <span className="text-xs">{format(new Date(election.endDate), "PP")}</span>
                      </div>
                    )}
                    <p className="text-muted-foreground text-xs line-clamp-2 mt-2">{election.description}</p>
                  </CardContent>
                  <CardFooter className="pt-4 border-t">
                    {canVote ? (
                      <Button asChild className="w-full">
                        <Link href={`/voter/elections/${election.id}/join`}>Vote Now</Link>
                      </Button>
                    ) : voter.status === "finalized" && !voter.hasVoted ? (
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/voter/elections/${election.id}/join`}>View Secret ID</Link>
                      </Button>
                    ) : (election.status === "completed" || election.status === "active") ? (
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/voter/elections/${election.id}/results`}>
                          {election.status === "completed" ? "Final Results" : "Live Results"}
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" className="w-full">
                        <Link href={`/voter/elections/${election.id}/join`}>View Election</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

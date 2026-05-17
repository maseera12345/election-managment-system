import { useGetElection, getGetElectionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Link, useRoute } from "wouter";
import { Trophy, Users, Vote, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface ResultsData {
  electionId: number;
  totalVotes: number;
  totalVoters: number;
  turnoutPercentage: number;
  winner: { candidateId: number; name: string; photoUrl?: string; designation?: string; voteCount: number; percentage: number } | null;
  candidates: { candidateId: number; name: string; photoUrl?: string; designation?: string; voteCount: number; percentage: number }[];
}

const CHART_COLORS = ["#1e3a8a", "#3b5bd6", "#6366f1", "#8b5cf6", "#a78bfa"];

export default function ElectionResults() {
  const [matchVoter] = useRoute("/voter/elections/:id/results");
  const [matchCreator] = useRoute("/creator/elections/:id/results");
  const [matchAdmin] = useRoute("/admin/elections/:id/results");

  const [, paramsVoter] = useRoute("/voter/elections/:id/results");
  const [, paramsCreator] = useRoute("/creator/elections/:id/results");
  const [, paramsAdmin] = useRoute("/admin/elections/:id/results");

  const params = paramsVoter || paramsCreator || paramsAdmin;
  const electionId = parseInt(params?.id || "0", 10);

  const { data: election } = useGetElection(electionId, { query: { queryKey: getGetElectionQueryKey(electionId), enabled: !!electionId } });
  const { token } = useAuth();

  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!electionId) return;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/elections/${electionId}/results`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to load results");
        const data = await res.json();
        setResults(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
    const interval = setInterval(fetchResults, 15000);
    return () => clearInterval(interval);
  }, [electionId, token]);

  const backHref = matchVoter ? "/voter" : matchCreator ? "/creator/elections" : "/admin/elections";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href={backHref}>← Back</Link>
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Election Results</h1>
            {election && <StatusBadge status={election.status} />}
          </div>
          {election && <p className="text-muted-foreground mt-1">{election.title}</p>}
          {election?.status === "active" && (
            <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Live results — refreshing every 15 seconds
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-lg" />)}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">{error}</CardContent>
          </Card>
        ) : results ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
                  <Vote className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{results.totalVotes}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Registered Voters</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{results.totalVoters}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Voter Turnout</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{results.turnoutPercentage}%</div>
                </CardContent>
              </Card>
            </div>

            {results.winner && results.totalVotes > 0 && (
              <Card className="border-amber-300 bg-amber-50">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <Trophy className="h-6 w-6 text-amber-500" />
                  <CardTitle className="text-amber-800">
                    {election?.status === "completed" ? "Winner" : "Current Leader"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  {results.winner.photoUrl && (
                    <img src={results.winner.photoUrl} alt={results.winner.name} className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="text-2xl font-bold text-amber-900">{results.winner.name}</p>
                    {results.winner.designation && <p className="text-sm text-amber-700">{results.winner.designation}</p>}
                    <p className="text-sm text-amber-700 mt-1">
                      {results.winner.voteCount} votes ({results.winner.percentage}%)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {results.candidates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Vote Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.candidates} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(value, name) => [value, "Votes"]}
                        labelFormatter={(label) => `Candidate: ${label}`}
                      />
                      <Bar dataKey="voteCount" radius={[4, 4, 0, 0]}>
                        {results.candidates.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Candidate Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.candidates.map((c, idx) => (
                    <div key={c.candidateId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground w-5">{idx + 1}.</span>
                          {c.photoUrl && <img src={c.photoUrl} alt={c.name} className="w-8 h-8 rounded-full object-cover" />}
                          <span className="font-semibold">{c.name}</span>
                          {c.designation && <span className="text-muted-foreground">— {c.designation}</span>}
                        </div>
                        <span className="font-semibold">{c.voteCount} votes ({c.percentage}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${c.percentage}%`,
                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {results.candidates.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No votes cast yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetPublicStats, useListElections } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, Calendar, Users, Timer, CheckCircle2, TrendingUp, Shield, Globe } from "lucide-react";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const target = new Date(targetDate);
      const now = new Date();
      if (isPast(target)) { setTimeLeft("Ended"); return; }
      const diff = target.getTime() - now.getTime();
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className="flex items-center gap-1 text-xs font-mono text-amber-600">
      <Timer className="h-3 w-3" />
      {timeLeft}
    </span>
  );
}

export default function Home() {
  const { data: stats } = useGetPublicStats();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const { data: activeData } = useListElections({ status: "active", limit: 6 });
  const { data: publishedData } = useListElections({ status: "published", limit: 6 });
  const { data: completedData } = useListElections({ status: "completed", limit: 3 });

  const activeElections = (activeData?.elections || []).filter(e =>
    (!search || e.title.toLowerCase().includes(search.toLowerCase())) &&
    (!category || e.category === category)
  );
  const upcomingElections = (publishedData?.elections || []).filter(e =>
    (!search || e.title.toLowerCase().includes(search.toLowerCase())) &&
    (!category || e.category === category)
  );
  const completedElections = completedData?.elections || [];

  const allCategories = Array.from(new Set([
    ...(activeData?.elections || []),
    ...(publishedData?.elections || []),
  ].map(e => e.category).filter(Boolean))) as string[];

  return (
    <PublicLayout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white" />
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-white" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <Badge className="mb-6 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-sm px-4 py-1">
            Trusted by 200+ Organizations
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Secure Online<br />Election Management
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            A mission-critical civic platform for transparent, secure, and fully verifiable elections.
            Anonymous voting. Real-time results. Complete audit trails.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild size="lg" variant="secondary" className="text-base px-8">
              <Link href="/register">Register to Vote</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground text-base px-8">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-muted/40 border-b">
        <div className="max-w-6xl mx-auto py-8 px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: stats?.totalElections || 0, label: "Total Elections", color: "text-primary", icon: Globe },
              { value: stats?.activeElections || 0, label: "Active Now", color: "text-emerald-600", icon: TrendingUp },
              { value: (stats?.totalVotes || 0).toLocaleString(), label: "Votes Cast", color: "text-purple-600", icon: CheckCircle2 },
              { value: stats?.completedElections || 0, label: "Completed", color: "text-blue-600", icon: Shield },
            ].map(({ value, label, color, icon: Icon }) => (
              <div key={label} className="text-center py-4">
                <div className={`text-4xl font-bold ${color} mb-1`}>{value}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-6 space-y-16">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search elections..."
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {allCategories.length > 0 && (
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {/* Active Elections */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-600 uppercase tracking-wide">Live Now</span>
              </div>
              <h2 className="text-2xl font-bold text-primary">Active Elections</h2>
            </div>
          </div>
          {activeElections.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeElections.map(election => (
                <Card key={election.id} className="flex flex-col hover:shadow-lg transition-shadow border-emerald-100">
                  {election.bannerUrl && (
                    <div className="h-36 w-full overflow-hidden rounded-t-lg">
                      <img src={election.bannerUrl} alt={election.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-emerald-600 text-white">Live</Badge>
                      {election.category && <Badge variant="outline" className="text-xs">{election.category}</Badge>}
                    </div>
                    <CardTitle className="line-clamp-2 leading-snug">{election.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                    <p className="line-clamp-2">{election.description}</p>
                    <div className="flex flex-col gap-1 pt-1">
                      {election.endDate && <Countdown targetDate={election.endDate} />}
                      {election.candidateCount !== undefined && (
                        <span className="flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          {election.candidateCount} candidates · {election.voterCount ?? 0} voters
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t">
                    <Button asChild className="w-full">
                      <Link href={`/elections/${election.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No active elections at the moment. Check back soon.</p>
            </div>
          )}
        </section>

        {/* Upcoming Elections */}
        {upcomingElections.length > 0 && (
          <section>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Registrations Open</span>
              </div>
              <h2 className="text-2xl font-bold text-primary">Upcoming Elections</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingElections.map(election => (
                <Card key={election.id} className="flex flex-col hover:shadow-md transition-shadow border-blue-100">
                  {election.bannerUrl && (
                    <div className="h-36 w-full overflow-hidden rounded-t-lg">
                      <img src={election.bannerUrl} alt={election.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-blue-600 text-white">Upcoming</Badge>
                      {election.category && <Badge variant="outline" className="text-xs">{election.category}</Badge>}
                    </div>
                    <CardTitle className="line-clamp-2 leading-snug">{election.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                    <p className="line-clamp-2">{election.description}</p>
                    <div className="flex flex-col gap-1 pt-1">
                      {election.startDate && (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Calendar className="h-3 w-3" />
                          Starts {format(new Date(election.startDate), "MMM d, yyyy")}
                        </span>
                      )}
                      {election.registrationDeadline && isFuture(new Date(election.registrationDeadline)) && (
                        <span className="text-xs text-muted-foreground">
                          Register by {format(new Date(election.registrationDeadline), "MMM d")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t">
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/elections/${election.id}`}>Register Now</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Completed Elections */}
        {completedElections.length > 0 && (
          <section>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Results Available</span>
              </div>
              <h2 className="text-2xl font-bold text-primary">Completed Elections</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {completedElections.map(election => (
                <Card key={election.id} className="flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{election.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {election.voteCount ?? 0} votes cast
                      {election.endDate && ` · ${formatDistanceToNow(new Date(election.endDate), { addSuffix: true })}`}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/elections/${election.id}`}>Results</Link>
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="py-8">
          <h2 className="text-2xl font-bold text-center mb-10 text-primary">How SecureVote Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Register & Join", desc: "Create an account and join any open election. The organizer reviews and approves your participation." },
              { step: "02", title: "Get Your Secret ID", desc: "Once approved, you receive a unique, anonymous secret voting ID that cannot be traced back to you." },
              { step: "03", title: "Vote Securely", desc: "Select your candidate, enter your secret ID, and cast your vote. Results are tallied in real-time." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary text-primary-foreground rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to run a secure election?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join hundreds of organizations using SecureVote to run transparent, tamper-proof elections.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Create an Account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}

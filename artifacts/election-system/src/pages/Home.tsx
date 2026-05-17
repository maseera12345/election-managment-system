import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetPublicStats, useListElections } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: stats } = useGetPublicStats();
  const { data: electionsResponse } = useListElections({ limit: 6, status: "active" });

  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Secure Online Election Management</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10">
            A mission-critical civic platform for transparent, secure, and verifiable elections.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Register to Vote</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold">{stats?.totalElections || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total Elections</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold text-green-600">{stats?.activeElections || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Active Elections</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold text-primary">{stats?.totalVotes?.toLocaleString() || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Votes Cast</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-4xl font-bold text-purple-600">{stats?.completedElections || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Completed Elections</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Active Elections</h2>
              <p className="text-muted-foreground">Live elections currently accepting votes.</p>
            </div>
          </div>
          
          {electionsResponse?.elections && electionsResponse.elections.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {electionsResponse.elections.map((election) => (
                <Card key={election.id} className="flex flex-col">
                  {election.bannerUrl && (
                    <div className="h-32 w-full overflow-hidden rounded-t-lg">
                      <img src={election.bannerUrl} alt={election.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                      {election.category && <Badge variant="outline">{election.category}</Badge>}
                    </div>
                    <CardTitle className="line-clamp-2">{election.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {election.description || "No description provided."}
                    </p>
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
              <p className="text-muted-foreground">No active elections at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

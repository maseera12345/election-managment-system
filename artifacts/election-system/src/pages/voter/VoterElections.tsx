import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListElections } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function VoterElections() {
  const { data, isLoading } = useListElections({ status: "active", limit: 20 });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Browse Elections</h1>
        </div>
        
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search elections..." className="pl-10" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted rounded-lg" />)}
          </div>
        ) : data?.elections && data.elections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.elections.map(election => (
              <Card key={election.id} className="flex flex-col">
                {election.bannerUrl && (
                  <div className="h-32 bg-muted rounded-t-lg overflow-hidden">
                    <img src={election.bannerUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between mb-2">
                    <StatusBadge status={election.status} />
                  </div>
                  <CardTitle className="line-clamp-2">{election.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {election.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t">
                  <Button asChild className="w-full">
                    <Link href={`/voter/elections/${election.id}/join`}>View & Join</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 border rounded-lg">
            <p className="text-muted-foreground">No active elections found to join.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

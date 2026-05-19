import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, FileText, Archive, Vote, LogOut, ClipboardList, Bell } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { toast } from "sonner";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      setLocation("/");
      toast.success("Logged out successfully");
    } catch (e) {
      logout();
      setLocation("/");
    }
  };

  const superAdminNav = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "All Elections", url: "/admin/elections", icon: Archive },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Audit Logs", url: "/admin/audit-logs", icon: ClipboardList },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
  ];

  const creatorNav = [
    { title: "Dashboard", url: "/creator", icon: LayoutDashboard },
    { title: "My Elections", url: "/creator/elections", icon: Archive },
    { title: "Create Election", url: "/creator/create", icon: FileText },
  ];

  const voterNav = [
    { title: "Dashboard", url: "/voter", icon: LayoutDashboard },
    { title: "Browse Elections", url: "/voter/elections", icon: Archive },
  ];

  const navItems = role === "super_admin" ? superAdminNav : role === "election_creator" ? creatorNav : voterNav;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="h-16 flex items-center px-4 border-b">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
              <Vote className="h-6 w-6" />
              <span>SecureVote</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url || (item.url !== "/admin" && item.url !== "/creator" && item.url !== "/voter" && location.startsWith(item.url))}>
                        <Link href={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{user?.fullName}</span>
                <span className="text-xs text-muted-foreground capitalize">{role?.replace("_", " ")}</span>
              </div>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center px-6 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-4">
              {/* Top right header content if needed */}
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-muted/20">
            <div className="mx-auto max-w-6xl w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

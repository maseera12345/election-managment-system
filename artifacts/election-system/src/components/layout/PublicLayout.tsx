import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();

  const getDashboardLink = () => {
    if (role === "super_admin") return "/admin";
    if (role === "election_creator") return "/creator";
    return "/voter";
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold text-primary">SecureVote</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
                Elections
              </Link>
              <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Contact
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href={getDashboardLink()} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
                  Log in
                </Link>
                <Link href="/register" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/40 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm leading-loose text-muted-foreground">
            © {new Date().getFullYear()} SecureVote Management System. Built for transparency and trust.
          </p>
        </div>
      </footer>
    </div>
  );
}

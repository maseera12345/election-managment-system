import { PublicLayout } from "@/components/layout/PublicLayout";
import { Shield, Lock, Eye, Users, Vote, BarChart3, CheckCircle2, Globe } from "lucide-react";

const features = [
  { icon: Shield, title: "Military-Grade Security", desc: "End-to-end encrypted voting with zero-knowledge proofs. Every vote is protected from the moment it's cast." },
  { icon: Lock, title: "Anonymous Voting", desc: "Secret ID system ensures votes cannot be traced back to individual voters, guaranteeing ballot secrecy." },
  { icon: Eye, title: "Full Transparency", desc: "Complete audit trail of every system action. Every login, approval, and vote is logged with timestamps." },
  { icon: Users, title: "Role-Based Access", desc: "Three-tier role system — Super Admin, Election Creator, and Voter — each with precisely scoped permissions." },
  { icon: Vote, title: "Secret ID System", desc: "Each finalized voter receives a unique cryptographic secret ID to authenticate their vote anonymously." },
  { icon: BarChart3, title: "Live Results", desc: "Real-time vote tallying with interactive bar charts and automatic winner detection as votes come in." },
  { icon: CheckCircle2, title: "Duplicate Prevention", desc: "One voter, one vote. The system cryptographically prevents any voter from casting more than one ballot." },
  { icon: Globe, title: "Fully Online", desc: "No physical presence needed. Elections can be run for organizations of any size, anywhere in the world." },
];

const team = [
  { name: "Sarah Chen", role: "Lead Architect", initials: "SC", color: "bg-blue-100 text-blue-800" },
  { name: "James Okafor", role: "Backend Engineer", initials: "JO", color: "bg-emerald-100 text-emerald-800" },
  { name: "Priya Sharma", role: "Security Engineer", initials: "PS", color: "bg-purple-100 text-purple-800" },
  { name: "Lucas Torres", role: "Frontend Engineer", initials: "LT", color: "bg-amber-100 text-amber-800" },
];

export default function About() {
  return (
    <PublicLayout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">About SecureVote</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            A mission-critical civic platform built to bring transparent, secure, and fully verifiable 
            elections to organizations of every size.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-primary">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              SecureVote was built because elections matter. Whether you're running a student council vote, 
              a corporate board election, or a community referendum — every voter deserves a system they 
              can trust completely.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We believe in the principle that a secure election must be simultaneously anonymous and 
              verifiable. Our secret ID voting system achieves exactly that: your vote cannot be 
              traced to you, yet the outcome can be independently verified.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every action on this platform — every login, approval, vote, and override — is permanently 
              recorded in an immutable audit log, giving administrators and the public complete transparency.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Elections Managed", value: "500+" },
              { label: "Votes Cast", value: "1M+" },
              { label: "Organizations", value: "200+" },
              { label: "Uptime", value: "99.9%" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-6 rounded-xl border bg-muted/20">
                <p className="text-3xl font-bold text-primary mb-1">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-muted/30 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3 text-primary">Platform Features</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Every feature was designed with security, transparency, and ease of use as equal priorities.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-background rounded-xl p-6 border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="max-w-4xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-3 text-primary">Security Architecture</h2>
        <p className="text-center text-muted-foreground mb-12">
          Built with defense-in-depth. Multiple independent layers of security protect every election.
        </p>
        <div className="space-y-4">
          {[
            { title: "JWT Authentication", desc: "All sessions use signed JSON Web Tokens with expiration. No session cookies, no CSRF risk." },
            { title: "Role-Based Authorization", desc: "Every API endpoint checks the caller's role. Voters cannot access creator endpoints and vice versa." },
            { title: "Secret ID Voting", desc: "Votes are cast using a randomly generated 16-character secret ID, fully decoupled from the voter's identity." },
            { title: "Duplicate Vote Prevention", desc: "Once a secret ID is used, it is marked as consumed and cannot be reused, regardless of any replay attempt." },
            { title: "Immutable Audit Trail", desc: "Every system event is written to a tamper-evident audit log with actor, timestamp, IP address, and action details." },
            { title: "Input Validation", desc: "All inputs are validated on both client (Zod) and server before touching the database. SQL injection is impossible via parameterized queries." },
          ].map(({ title, desc }) => (
            <div key={title} className="flex gap-4 p-4 rounded-lg border bg-muted/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="bg-muted/30 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3 text-primary">Our Team</h2>
          <p className="text-center text-muted-foreground mb-12">
            SecureVote is built and maintained by a team of experienced engineers passionate about civic technology.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {team.map(({ name, role, initials, color }) => (
              <div key={name} className="text-center">
                <div className={`w-20 h-20 rounded-full ${color} flex items-center justify-center text-2xl font-bold mx-auto mb-4`}>
                  {initials}
                </div>
                <p className="font-semibold">{name}</p>
                <p className="text-sm text-muted-foreground">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

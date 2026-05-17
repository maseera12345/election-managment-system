import { Badge, BadgeProps } from "@/components/ui/badge";

type StatusType = 
  | "active" | "draft" | "published" | "completed" | "suspended" 
  | "pending" | "approved" | "rejected" | "blocked" | "waitlisted" | "finalized";

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: StatusType | string;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let colorClass = "";

  switch (normalizedStatus) {
    case "active":
    case "approved":
    case "finalized":
    case "published":
      variant = "default";
      colorClass = "bg-emerald-600 hover:bg-emerald-700 text-white";
      break;
    case "pending":
    case "waitlisted":
    case "draft":
      variant = "secondary";
      colorClass = "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20";
      break;
    case "suspended":
    case "rejected":
    case "blocked":
      variant = "destructive";
      break;
    case "completed":
      variant = "default";
      colorClass = "bg-indigo-600 hover:bg-indigo-700 text-white";
      break;
    default:
      variant = "outline";
  }

  return (
    <Badge variant={variant} className={`${colorClass} capitalize ${className}`} {...props}>
      {status.replace("_", " ")}
    </Badge>
  );
}
